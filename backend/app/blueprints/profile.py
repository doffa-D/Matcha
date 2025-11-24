from flask import Blueprint, request, jsonify
from datetime import datetime
from app.db import Database
from app.jwt import token_required

bp = Blueprint('profile', __name__, url_prefix='/api/profile')


def calculate_age(date_of_birth):
    """Calculate age from date_of_birth"""
    if not date_of_birth:
        return None
    today = datetime.utcnow().date()
    age = today.year - date_of_birth.year - ((today.month, today.day) < (date_of_birth.month, date_of_birth.day))
    return age


@bp.route('/me', methods=['GET'])
@token_required
def get_profile(current_user_id):
    """Get current user's profile with images and tags"""
    try:
        with Database() as db:
            # Get user profile
            user = db.query(
                """SELECT id, username, email, first_name, last_name, bio, 
                          gender, sexual_preference, latitude, longitude, 
                          date_of_birth, age, fame_rating, is_verified, 
                          last_online, created_at
                   FROM users WHERE id = %s""",
                (current_user_id,)
            )
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            user_data = user[0]
            
            # Use stored age if available, otherwise calculate from date_of_birth
            age = user_data.get('age')
            if age is None and user_data['date_of_birth']:
                age = calculate_age(user_data['date_of_birth'])
                # Update age in database for future queries
                if age:
                    db.query(
                        "UPDATE users SET age = %s WHERE id = %s",
                        (age, current_user_id)
                    )
            
            # Get user images
            images = db.query(
                """SELECT id, file_path, is_profile_pic, created_at 
                   FROM images WHERE user_id = %s ORDER BY is_profile_pic DESC, created_at ASC""",
                (current_user_id,)
            )
            
            # Get user tags
            tags = db.query(
                """SELECT t.id, t.tag_name 
                   FROM tags t
                   INNER JOIN user_tags ut ON t.id = ut.tag_id
                   WHERE ut.user_id = %s
                   ORDER BY t.tag_name ASC""",
                (current_user_id,)
            )
            
            # Format response
            profile = {
                'id': user_data['id'],
                'username': user_data['username'],
                'email': user_data['email'],
                'first_name': user_data['first_name'],
                'last_name': user_data['last_name'],
                'bio': user_data['bio'],
                'gender': user_data['gender'],
                'sexual_preference': user_data['sexual_preference'],
                'location': {
                    'latitude': float(user_data['latitude']) if user_data['latitude'] else None,
                    'longitude': float(user_data['longitude']) if user_data['longitude'] else None
                },
                'age': age,
                'date_of_birth': user_data['date_of_birth'].isoformat() if user_data['date_of_birth'] else None,
                'fame_rating': float(user_data['fame_rating']) if user_data['fame_rating'] else 0.0,
                'is_verified': user_data['is_verified'],
                'last_online': user_data['last_online'].isoformat() if user_data['last_online'] else None,
                'created_at': user_data['created_at'].isoformat() if user_data['created_at'] else None,
                'images': [
                    {
                        'id': img['id'],
                        'file_path': img['file_path'],
                        'is_profile_pic': img['is_profile_pic'],
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
                ]
            }
            
            return jsonify(profile), 200
    
    except Exception as e:
        import traceback
        print(f"Get profile error: {e}")
        traceback.print_exc()
        return jsonify({'error': f'Failed to get profile: {str(e)}'}), 500


@bp.route('/update', methods=['PUT'])
@token_required
def update_profile(current_user_id):
    """Update user profile fields"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    updates = {}
    
    # Update first_name
    if 'first_name' in data:
        first_name = data['first_name'].strip() if data['first_name'] else None
        if first_name and len(first_name) > 0:
            updates['first_name'] = first_name
    
    # Update last_name
    if 'last_name' in data:
        last_name = data['last_name'].strip() if data['last_name'] else None
        if last_name and len(last_name) > 0:
            updates['last_name'] = last_name
    
    # Update email (with validation)
    if 'email' in data:
        email = data['email'].strip().lower() if data['email'] else None
        if email:
            import re
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_pattern, email):
                return jsonify({'error': 'Invalid email format'}), 400
            
            # Check if email already exists (excluding current user)
            with Database() as db:
                existing = db.query(
                    "SELECT id FROM users WHERE email = %s AND id != %s",
                    (email, current_user_id)
                )
                if existing:
                    return jsonify({'error': 'Email already in use'}), 409
            
            updates['email'] = email
            # Note: You might want to set is_verified = FALSE when email changes
    
    # Update bio
    if 'bio' in data:
        bio = data['bio'].strip() if data['bio'] else None
        updates['bio'] = bio if bio else None
    
    # Update gender
    if 'gender' in data:
        gender = data['gender'].strip() if data['gender'] else None
        valid_genders = ['Male', 'Female']
        if gender and gender in valid_genders:
            updates['gender'] = gender
        elif gender:
            return jsonify({'error': f'Invalid gender. Must be one of: {", ".join(valid_genders)}'}), 400
    
    # Update sexual_preference
    if 'sexual_preference' in data:
        sexual_preference = data['sexual_preference'].strip() if data['sexual_preference'] else None
        valid_preferences = ['Straight', 'Gay', 'Bisexual']
        if sexual_preference and sexual_preference in valid_preferences:
            updates['sexual_preference'] = sexual_preference
        elif sexual_preference:
            return jsonify({'error': f'Invalid sexual preference. Must be one of: {", ".join(valid_preferences)}'}), 400
    
    # Update date_of_birth
    if 'date_of_birth' in data:
        date_of_birth_str = data['date_of_birth']
        if date_of_birth_str:
            try:
                date_of_birth = datetime.strptime(date_of_birth_str, '%Y-%m-%d').date()
                # Calculate and validate age (must be 18+)
                age = calculate_age(date_of_birth)
                if age < 18:
                    return jsonify({'error': 'You must be at least 18 years old'}), 400
                if age > 120:
                    return jsonify({'error': 'Invalid date of birth'}), 400
                updates['date_of_birth'] = date_of_birth
                updates['age'] = age  # Store calculated age
            except ValueError:
                return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        else:
            updates['date_of_birth'] = None
            updates['age'] = None
    
    if not updates:
        return jsonify({'error': 'No valid fields to update'}), 400
    
    try:
        with Database() as db:
            # Build dynamic UPDATE query
            set_clauses = []
            values = []
            for field, value in updates.items():
                set_clauses.append(f"{field} = %s")
                values.append(value)
            
            values.append(current_user_id)
            
            query = f"""
                UPDATE users 
                SET {', '.join(set_clauses)}
                WHERE id = %s
            """
            
            db.query(query, tuple(values))
            
            # If email was changed, you might want to set is_verified = FALSE
            if 'email' in updates:
                db.query(
                    "UPDATE users SET is_verified = FALSE WHERE id = %s",
                    (current_user_id,)
                )
            
            return jsonify({
                'message': 'Profile updated successfully',
                'updated_fields': list(updates.keys())
            }), 200
    
    except Exception as e:
        import traceback
        print(f"Update profile error: {e}")
        traceback.print_exc()
        return jsonify({'error': f'Failed to update profile: {str(e)}'}), 500