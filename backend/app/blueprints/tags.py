from flask import Blueprint, request, jsonify
from app.db import Database
from app.jwt import token_required

bp = Blueprint('tags', __name__, url_prefix='/api')


@bp.route('/tags', methods=['GET'])
def get_tags():
    """Get all available tags. Supports optional search query parameter."""
    try:
        # Get optional search query parameter
        search_query = request.args.get('q', '').strip().lower()
        
        with Database() as db:
            if search_query:
                # Search tags by name (case-insensitive, partial match)
                tags = db.query(
                    """SELECT id, tag_name, created_at
                       FROM tags
                       WHERE LOWER(tag_name) LIKE %s
                       ORDER BY tag_name ASC""",
                    (f'%{search_query}%',)
                )
            else:
                # Get all tags
                tags = db.query(
                    """SELECT id, tag_name, created_at
                       FROM tags
                       ORDER BY tag_name ASC"""
                )
            
            # Format response
            tags_list = [
                {
                    'id': tag['id'],
                    'tag_name': tag['tag_name'],
                    'created_at': tag['created_at'].isoformat() if tag['created_at'] else None
                }
                for tag in tags
            ]
            
            return jsonify({
                'tags': tags_list,
                'count': len(tags_list)
            }), 200
            
    except Exception as e:
        import traceback
        print(f"Get tags error: {e}")
        traceback.print_exc()
        return jsonify({'error': f'Failed to get tags: {str(e)}'}), 500


@bp.route('/tags', methods=['POST'])
@token_required
def add_tags(current_user_id):
    """Add tags to user profile. Tags are reusable across users."""
    try:
        data = request.get_json()
        
        if not data or 'tags' not in data:
            return jsonify({'error': 'Tags array is required'}), 400
        
        tags = data['tags']
        
        if not isinstance(tags, list):
            return jsonify({'error': 'Tags must be an array'}), 400
        
        if not tags:
            return jsonify({'error': 'Tags array cannot be empty'}), 400
        
        # Validate and normalize tags
        validated_tags = []
        for tag in tags:
            if not isinstance(tag, str):
                continue
            
            tag = tag.strip()
            if not tag:
                continue
            
            # Normalize tag (add # if not present, lowercase)
            if not tag.startswith('#'):
                tag = '#' + tag
            
            if len(tag) > 50:
                return jsonify({'error': f'Tag "{tag}" exceeds maximum length of 50 characters'}), 400
            
            validated_tags.append(tag.lower())
        
        if not validated_tags:
            return jsonify({'error': 'No valid tags provided'}), 400
        
        # Remove duplicates from input
        validated_tags = list(set(validated_tags))
        
        added_tags = []
        skipped_tags = []
        
        with Database() as db:
            # Step 1: Check which tags already exist in database
            placeholders = ','.join(['%s'] * len(validated_tags))
            existing_tags = db.query(
                f"""SELECT id, tag_name FROM tags 
                   WHERE tag_name IN ({placeholders})""",
                tuple(validated_tags)
            )
            
            existing_tag_names = {tag['tag_name']: tag['id'] for tag in existing_tags}
            new_tags = [t for t in validated_tags if t not in existing_tag_names]
            
            # Step 2: Insert only new tags
            new_tag_ids = {}
            for tag_name in new_tags:
                tag_id = db.query(
                    """INSERT INTO tags (tag_name)
                       VALUES (%s)
                       ON CONFLICT (tag_name) DO NOTHING
                       RETURNING id""",
                    (tag_name,)
                )
                
                # Handle return value (integer ID or empty list)
                if isinstance(tag_id, int):
                    new_tag_ids[tag_name] = tag_id
                elif isinstance(tag_id, list) and len(tag_id) == 0:
                    # Race condition: tag was inserted by another request
                    existing = db.query(
                        "SELECT id FROM tags WHERE tag_name = %s",
                        (tag_name,)
                    )
                    if existing:
                        new_tag_ids[tag_name] = existing[0]['id']
            
            # Step 3: Combine existing and new tag IDs
            all_tag_ids = {**existing_tag_names, **new_tag_ids}
            
            # Step 4: Check which user_tags already exist
            if all_tag_ids:
                tag_ids_list = list(all_tag_ids.values())
                placeholders = ','.join(['%s'] * len(tag_ids_list))
                existing_user_tags = db.query(
                    f"""SELECT tag_id FROM user_tags 
                       WHERE user_id = %s AND tag_id IN ({placeholders})""",
                    (current_user_id, *tag_ids_list)
                )
                existing_user_tag_ids = {row['tag_id'] for row in existing_user_tags}
            else:
                existing_user_tag_ids = set()
            
            # Step 5: Insert only new user_tags (batch insert)
            for tag_name, tag_id in all_tag_ids.items():
                if tag_id in existing_user_tag_ids:
                    skipped_tags.append(tag_name)
                    continue
                
                user_tag_result = db.query(
                    """INSERT INTO user_tags (user_id, tag_id)
                       VALUES (%s, %s)
                       ON CONFLICT (user_id, tag_id) DO NOTHING
                       RETURNING user_id""",
                    (current_user_id, tag_id)
                )
                
                if isinstance(user_tag_result, int):
                    added_tags.append({
                        'id': tag_id,
                        'tag_name': tag_name
                    })
                else:
                    skipped_tags.append(tag_name)
        
        response = {
            'message': f'Successfully added {len(added_tags)} tag(s)',
            'added_tags': added_tags
        }
        
        if skipped_tags:
            response['skipped_tags'] = skipped_tags
            response['message'] += f', {len(skipped_tags)} already exist'
        
        return jsonify(response), 201
        
    except Exception as e:
        import traceback
        print(f"Add tags error: {e}")
        traceback.print_exc()
        return jsonify({'error': f'Failed to add tags: {str(e)}'}), 500


@bp.route('/tags/<int:tag_id>', methods=['DELETE'])
@token_required
def remove_tag(current_user_id, tag_id):
    """Remove tag from user profile. Does not delete tag from tags table (tags are reusable)."""
    try:
        with Database() as db:
            # Verify tag exists and belongs to user
            user_tag = db.query(
                """SELECT ut.user_id, ut.tag_id, t.tag_name
                   FROM user_tags ut
                   INNER JOIN tags t ON ut.tag_id = t.id
                   WHERE ut.user_id = %s AND ut.tag_id = %s""",
                (current_user_id, tag_id)
            )
            
            if not user_tag:
                return jsonify({'error': 'Tag not found in your profile'}), 404
            
            tag_name = user_tag[0]['tag_name']
            
            # Remove from user_tags table (do not delete from tags table)
            db.query(
                "DELETE FROM user_tags WHERE user_id = %s AND tag_id = %s",
                (current_user_id, tag_id)
            )
            
            return jsonify({
                'message': 'Tag removed successfully',
                'removed_tag': {
                    'id': tag_id,
                    'tag_name': tag_name
                }
            }), 200
            
    except Exception as e:
        import traceback
        print(f"Remove tag error: {e}")
        traceback.print_exc()
        return jsonify({'error': f'Failed to remove tag: {str(e)}'}), 500

