from flask import Blueprint, request, jsonify
from datetime import datetime
from app.db import Database
from app.jwt import token_required
from app.utils.user_utils import calculate_age, is_online
from app.utils.fame import update_user_fame
from app.sockets.events import send_notification


bp = Blueprint('users', __name__, url_prefix='/api')


@bp.route('/users/<int:target_user_id>', methods=['GET'])
@token_required
def view_user_profile(current_user_id, target_user_id):
    """
    View another user's profile.
    Records visit: current_user_id visits target_user_id
    Returns profile data + relationship info (liked_by_me, connected, liked_by_them)
    """
    try:
        if current_user_id == target_user_id:
            return jsonify({'error': 'Cannot view your own profile'}), 400

        with Database() as db:
            # Get target user profile
            target_user = db.query(
                """SELECT id, username, first_name, last_name, bio,
                          gender, sexual_preference, latitude, longitude,
                          date_of_birth, age, fame_rating, is_verified,
                          last_online, created_at
                   FROM users WHERE id = %s""",
                (target_user_id,)
            )

            if not target_user:
                return jsonify({'error': 'User not found'}), 404

            target_user_data = target_user[0]

            # Check if either user blocked the other
            blocked = db.query(
                """SELECT id FROM blocks
                   WHERE (blocker_id = %s AND blocked_id = %s)
                      OR (blocker_id = %s AND blocked_id = %s)""",
                (current_user_id, target_user_id, target_user_id, current_user_id)
            )

            if blocked:
                return jsonify({'error': 'User profile not available'}), 403

            # Record visit (track count per day)
            # Check if visit already exists today
            existing_visit = db.query(
                """SELECT id, visit_count FROM visits
                   WHERE visitor_id = %s AND visited_id = %s
                   AND DATE(timestamp) = CURRENT_DATE""",
                (current_user_id, target_user_id)
            )
            if existing_visit:
                # Increment visit count
                db.query(
                    """UPDATE visits 
                       SET visit_count = visit_count + 1,
                           timestamp = CURRENT_TIMESTAMP
                       WHERE id = %s""",
                    (existing_visit[0]['id'],)
                )
            else:
                # Create new visit record
                db.query(
                    """INSERT INTO visits (visitor_id, visited_id, timestamp, visit_count)
                       VALUES (%s, %s, CURRENT_TIMESTAMP, 1)""",
                    (current_user_id, target_user_id)
                )
                
                # Send visit notification (only on new visit, not repeat visits same day)
                send_notification(target_user_id, 'visit', current_user_id)

            # Calculate age if not stored
            age = target_user_data.get('age')
            if age is None and target_user_data['date_of_birth']:
                age = calculate_age(target_user_data['date_of_birth'])

            # Get user images
            images = db.query(
                """SELECT id, file_path, created_at
                   FROM images WHERE user_id = %s ORDER BY created_at ASC""",
                (target_user_id,)
            )

            # Get user tags
            tags = db.query(
                """SELECT t.id, t.tag_name
                   FROM tags t
                   INNER JOIN user_tags ut ON t.id = ut.tag_id
                   WHERE ut.user_id = %s
                   ORDER BY t.tag_name ASC""",
                (target_user_id,)
            )

            # Check relationship status (likes)
            like_from_me = db.query(
                "SELECT id FROM likes WHERE liker_id = %s AND liked_id = %s",
                (current_user_id, target_user_id)
            )
            liked_by_me = bool(like_from_me)

            like_from_them = db.query(
                "SELECT id FROM likes WHERE liker_id = %s AND liked_id = %s",
                (target_user_id, current_user_id)
            )
            liked_by_them = bool(like_from_them)

            connected = liked_by_me and liked_by_them

            # Check online status
            last_online_ts = target_user_data['last_online']
            is_online_status = is_online(last_online_ts)

            # Build response
            profile = {
                'id': target_user_data['id'],
                'username': target_user_data['username'],
                'first_name': target_user_data['first_name'],
                'last_name': target_user_data['last_name'],
                'bio': target_user_data['bio'],
                'gender': target_user_data['gender'],
                'sexual_preference': target_user_data['sexual_preference'],
                'location': {
                    'latitude': float(target_user_data['latitude']) if target_user_data['latitude'] else None,
                    'longitude': float(target_user_data['longitude']) if target_user_data['longitude'] else None
                },
                'age': age,
                'date_of_birth': target_user_data['date_of_birth'].isoformat() if target_user_data['date_of_birth'] else None,
                'fame_rating': float(target_user_data['fame_rating']) if target_user_data['fame_rating'] else 0.0,
                'is_verified': target_user_data['is_verified'],
                'is_online': is_online_status,
                'last_online': last_online_ts.isoformat() if last_online_ts else None,
                'created_at': target_user_data['created_at'].isoformat() if target_user_data['created_at'] else None,
                'images': [
                    {
                        'id': img['id'],
                        'file_path': img['file_path'],
                        'created_at': img['created_at'].isoformat() if img['created_at'] else None
                    }
                    for img in images
                ],
                'tags': [
                    {
                        'id': tag['id'],
                        'tag_name': tag['tag_name']
                    }
                    for tag in tags
                ],
                'liked_by_me': liked_by_me,
                'liked_by_them': liked_by_them,
                'connected': connected
            }

            return jsonify(profile), 200

    except Exception as e:
        import traceback
        print(f"View user profile error: {e}")
        traceback.print_exc()
        return jsonify({'error': f'Failed to view profile: {str(e)}'}), 500


@bp.route('/users/<int:target_user_id>/like', methods=['POST'])
@token_required
def toggle_like(current_user_id, target_user_id):
    """
    Like or Unlike a user's profile.
    Request body: {"like": true} to like, {"like": false} to unlike
    """
    try:
        if current_user_id == target_user_id:
            return jsonify({'error': 'Cannot like your own profile'}), 400

        data = request.get_json()
        if not data or 'like' not in data:
            return jsonify({'error': 'Missing "like" field in request body'}), 400

        like_status = data['like']
        if not isinstance(like_status, bool):
            return jsonify({'error': '"like" must be a boolean (true/false)'}), 400

        with Database() as db:
            # Check if target user exists
            target_user = db.query(
                "SELECT id FROM users WHERE id = %s",
                (target_user_id,)
            )
            if not target_user:
                return jsonify({'error': 'User not found'}), 404

            # Check if either user blocked the other
            blocked = db.query(
                """SELECT id FROM blocks
                   WHERE (blocker_id = %s AND blocked_id = %s)
                      OR (blocker_id = %s AND blocked_id = %s)""",
                (current_user_id, target_user_id, target_user_id, current_user_id)
            )
            if blocked:
                return jsonify({'error': 'User profile not available'}), 403

            # Check if current user has at least one image (profile picture required to like)
            user_images = db.query(
                "SELECT id FROM images WHERE user_id = %s LIMIT 1",
                (current_user_id,)
            )
            if not user_images and like_status:
                return jsonify({'error': 'You must have a profile picture to like other users'}), 403

            # Check current like status
            existing_like = db.query(
                "SELECT id FROM likes WHERE liker_id = %s AND liked_id = %s",
                (current_user_id, target_user_id)
            )
            currently_liked = bool(existing_like)

            # Check if they liked me
            like_from_them = db.query(
                "SELECT id FROM likes WHERE liker_id = %s AND liked_id = %s",
                (target_user_id, current_user_id)
            )
            liked_by_them = bool(like_from_them)

            if like_status:  # Want to like
                if currently_liked:
                    return jsonify({
                        'message': 'Already liked this user',
                        'liked_by_me': True,
                        'liked_by_them': liked_by_them,
                        'connected': liked_by_them
                    }), 200

                # Insert like
                db.query(
                    """INSERT INTO likes (liker_id, liked_id, created_at)
                       VALUES (%s, %s, CURRENT_TIMESTAMP)""",
                    (current_user_id, target_user_id)
                )

                # Check if now connected (mutual like)
                connected = liked_by_them  # They already liked me, now I liked them

        # Update fame AFTER transaction commits (outside with block)
        if like_status:
            update_user_fame(target_user_id)
            
            # Send like notification
            send_notification(target_user_id, 'like', current_user_id)
            
            # If mutual like (match), notify both users
            if liked_by_them:
                send_notification(target_user_id, 'match', current_user_id)
                send_notification(current_user_id, 'match', target_user_id)
            
            return jsonify({
                'message': 'Profile liked successfully',
                'liked_by_me': True,
                'liked_by_them': liked_by_them,
                'connected': connected
            }), 200

        with Database() as db:
            # Re-check for unlike case (need fresh db context)
            existing_like = db.query(
                "SELECT id FROM likes WHERE liker_id = %s AND liked_id = %s",
                (current_user_id, target_user_id)
            )
            currently_liked = bool(existing_like)
            
            like_from_them = db.query(
                "SELECT id FROM likes WHERE liker_id = %s AND liked_id = %s",
                (target_user_id, current_user_id)
            )
            liked_by_them = bool(like_from_them)

            if not currently_liked:
                return jsonify({
                    'message': 'Already unliked this user',
                    'liked_by_me': False,
                    'liked_by_them': liked_by_them,
                    'connected': False
                }), 200

            # Delete like
            db.query(
                "DELETE FROM likes WHERE liker_id = %s AND liked_id = %s",
                (current_user_id, target_user_id)
            )

        # Update fame AFTER transaction commits
        update_user_fame(target_user_id)
        
        # Send unlike notification (only if was connected)
        if liked_by_them:
            send_notification(target_user_id, 'unlike', current_user_id)

        return jsonify({
            'message': 'Profile unliked successfully',
            'liked_by_me': False,
            'liked_by_them': liked_by_them,
            'connected': False  # Connection broken
        }), 200

    except Exception as e:
        import traceback
        print(f"Toggle like error: {e}")
        traceback.print_exc()
        return jsonify({'error': f'Failed to toggle like: {str(e)}'}), 500


@bp.route('/users/<int:target_user_id>/block', methods=['POST'])
@token_required
def block_user(current_user_id, target_user_id):
    """
    Block a user.
    Blocks user from appearing in search/notifications. Disables chat.
    Removes any existing likes between users (breaks connection).
    """
    try:
        if current_user_id == target_user_id:
            return jsonify({'error': 'Cannot block yourself'}), 400

        with Database() as db:
            # Check if target user exists
            target_user = db.query(
                "SELECT id, username FROM users WHERE id = %s",
                (target_user_id,)
            )
            if not target_user:
                return jsonify({'error': 'User not found'}), 404

            # Check if already blocked
            existing_block = db.query(
                "SELECT id FROM blocks WHERE blocker_id = %s AND blocked_id = %s",
                (current_user_id, target_user_id)
            )
            if existing_block:
                return jsonify({
                    'message': 'User already blocked',
                    'blocked': True
                }), 200

            # Insert block record
            db.query(
                """INSERT INTO blocks (blocker_id, blocked_id, created_at)
                   VALUES (%s, %s, CURRENT_TIMESTAMP)""",
                (current_user_id, target_user_id)
            )

            # Remove any existing likes between users (breaks connection)
            # Delete like from me to them
            db.query(
                "DELETE FROM likes WHERE liker_id = %s AND liked_id = %s",
                (current_user_id, target_user_id)
            )
            # Delete like from them to me
            db.query(
                "DELETE FROM likes WHERE liker_id = %s AND liked_id = %s",
                (target_user_id, current_user_id)
            )

            return jsonify({
                'message': 'User blocked successfully',
                'blocked': True,
                'blocked_user_id': target_user_id
            }), 200

    except Exception as e:
        import traceback
        print(f"Block user error: {e}")
        traceback.print_exc()
        return jsonify({'error': f'Failed to block user: {str(e)}'}), 500


@bp.route('/users/<int:target_user_id>/report', methods=['POST'])
@token_required
def report_user(current_user_id, target_user_id):
    """
    Report a user as "Fake Account".
    Stores report in database for moderation.
    """
    try:
        if current_user_id == target_user_id:
            return jsonify({'error': 'Cannot report yourself'}), 400

        with Database() as db:
            # Check if target user exists
            target_user = db.query(
                "SELECT id, username FROM users WHERE id = %s",
                (target_user_id,)
            )
            if not target_user:
                return jsonify({'error': 'User not found'}), 404

            # Check if already reported
            existing_report = db.query(
                "SELECT id FROM reports WHERE reporter_id = %s AND reported_id = %s",
                (current_user_id, target_user_id)
            )
            if existing_report:
                return jsonify({
                    'message': 'User already reported',
                    'reported': True
                }), 200

            # Insert report record
            db.query(
                """INSERT INTO reports (reporter_id, reported_id, created_at)
                   VALUES (%s, %s, CURRENT_TIMESTAMP)""",
                (current_user_id, target_user_id)
            )

            return jsonify({
                'message': 'User reported successfully',
                'reported': True,
                'reported_user_id': target_user_id
            }), 200

    except Exception as e:
        import traceback
        print(f"Report user error: {e}")
        traceback.print_exc()
        return jsonify({'error': f'Failed to report user: {str(e)}'}), 500