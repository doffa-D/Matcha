from flask import Blueprint, request, jsonify
from datetime import datetime
from app.db import Database
from app.jwt import token_required
from app.utils.password_validator import contains_dictionary_word
import uuid
from pathlib import Path
from app.utils.user_utils import calculate_age

bp = Blueprint('profile', __name__, url_prefix='/api/profile')





# Allowed file extensions and MIME types
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'webp'}
ALLOWED_MIME_TYPES = {
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
MAX_IMAGES_PER_USER = 5


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


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
                   FROM images WHERE user_id = %s 
                   ORDER BY is_profile_pic DESC, created_at ASC""",
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

            # Get visits (who viewed my profile)
            visits = db.query(
                """SELECT v.visitor_id, v.visit_count, v.timestamp,
                          u.username, u.first_name, u.last_name
                   FROM visits v
                   INNER JOIN users u ON v.visitor_id = u.id
                   WHERE v.visited_id = %s
                   ORDER BY v.timestamp DESC
                   LIMIT 50""",
                (current_user_id,)
            )

            # Get likes (who liked me)
            likes = db.query(
                """SELECT l.liker_id, l.created_at,
                          u.username, u.first_name, u.last_name
                   FROM likes l
                   INNER JOIN users u ON l.liker_id = u.id
                   WHERE l.liked_id = %s
                   ORDER BY l.created_at DESC""",
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
                'visits': [
                    {
                        'visitor_id': visit['visitor_id'],
                        'username': visit['username'],
                        'first_name': visit['first_name'],
                        'last_name': visit['last_name'],
                        'visit_count': visit['visit_count'],
                        'last_visit': visit['timestamp'].isoformat() if visit['timestamp'] else None
                    }
                    for visit in visits
                ],
                'likes': [
                    {
                        'liker_id': like['liker_id'],
                        'username': like['username'],
                        'first_name': like['first_name'],
                        'last_name': like['last_name'],
                        'liked_at': like['created_at'].isoformat() if like['created_at'] else None
                    }
                    for like in likes
                ],
                'stats': {
                    'total_visits': len(visits),
                    'total_likes': len(likes)
                }
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
    """Update user profile fields including password"""
    # Handle empty JSON body gracefully
    if not request.data:
        data = {}
    else:
        try:
            data = request.get_json() or {}
        except:
            data = {}

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    updates = {}

    # Update password (requires current_password for security)
    if 'password' in data:
        password = data['password']
        current_password = data.get('current_password')

        if not current_password:
            return jsonify({'error': 'Current password is required to change password'}), 400

        # Validate new password
        if not password or len(password) < 8:
            return jsonify({'error': 'Password must be at least 8 characters long'}), 400
        
        # Password validation (dictionary words)
        if contains_dictionary_word(password):
            return jsonify({'error': 'Password cannot contain dictionary words'}), 400

        # Verify current password
        import bcrypt
        with Database() as db:
            user = db.query(
                "SELECT password_hash FROM users WHERE id = %s",
                (current_user_id,)
            )
            if not user:
                return jsonify({'error': 'User not found'}), 404

            if not bcrypt.checkpw(current_password.encode('utf-8'), user[0]['password_hash'].encode('utf-8')):
                return jsonify({'error': 'Current password is incorrect'}), 401

            # Hash new password
            password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            updates['password_hash'] = password_hash

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

            # Remove password from response for security
            updated_fields = [f for f in updates.keys() if f != 'password_hash']

            return jsonify({
                'message': 'Profile updated successfully',
                'updated_fields': updated_fields
            }), 200

    except Exception as e:
        import traceback
        print(f"Update profile error: {e}")
        traceback.print_exc()
        return jsonify({'error': f'Failed to update profile: {str(e)}'}), 500


@bp.route('/location', methods=['PUT'])
@token_required
def update_location(current_user_id):
    """Update user GPS location. If GPS not provided, use IP geolocation."""
    # Handle empty or missing JSON body - allow empty body for IP geolocation
    try:
        if request.is_json:
            data = request.get_json() or {}
        else:
            data = {}
    except:
        data = {}

    latitude = None
    longitude = None

    # Check if GPS coordinates provided
    if data and 'latitude' in data and 'longitude' in data:
        try:
            latitude = float(data['latitude'])
            longitude = float(data['longitude'])

            # Validate coordinates
            if not (-90 <= latitude <= 90):
                return jsonify({'error': 'Invalid latitude. Must be between -90 and 90'}), 400
            if not (-180 <= longitude <= 180):
                return jsonify({'error': 'Invalid longitude. Must be between -180 and 180'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid latitude/longitude format'}), 400

    # If GPS not provided, use IP geolocation
    if latitude is None or longitude is None:
        try:
            import urllib.request
            import json

            # Get client IP address (prefer custom header for testing, then proxy headers)
            ip = (
                request.headers.get('X-Client-Public-IP') or
                request.headers.get('X-Forwarded-For', '').split(',')[0].strip() or
                request.headers.get('X-Real-IP') or
                request.remote_addr
            )

            # Use ip-api.com to get location
            url = f"http://ip-api.com/json/{ip}?fields=status,lat,lon"
            with urllib.request.urlopen(url, timeout=5) as response:
                geo_data = json.loads(response.read().decode())

                if geo_data.get('status') == 'success':
                    latitude = geo_data.get('lat')
                    longitude = geo_data.get('lon')
                else:
                    return jsonify({
                        'error': 'Could not determine location from IP. Please provide GPS coordinates.',
                        'ip': ip
                    }), 400
        except Exception as e:
            import traceback
            print(f"IP geolocation error: {e}")
            traceback.print_exc()
            return jsonify({'error': 'Failed to get location from IP'}), 500

    # Update location in database
    try:
        with Database() as db:
            db.query(
                "UPDATE users SET latitude = %s, longitude = %s WHERE id = %s",
                (latitude, longitude, current_user_id)
            )

        return jsonify({
            'message': 'Location updated successfully',
            'location': {
                'latitude': latitude,
                'longitude': longitude,
                'source': 'gps' if data and 'latitude' in data and 'longitude' in data else 'ip'
            }
        }), 200

    except Exception as e:
        import traceback
        print(f"Update location error: {e}")
        traceback.print_exc()
        return jsonify({'error': f'Failed to update location: {str(e)}'}), 500


@bp.route('/upload', methods=['POST'])
@token_required
def upload_image(current_user_id):
    """Upload user image(s). Maximum 5 images per user. Supports single or multiple file uploads."""
    try:
        # Get all files with key 'file' (supports multiple files)
        files = request.files.getlist('file')
        
        # Check if any file is present
        if not files or all(f.filename == '' for f in files):
            return jsonify({'error': 'No file provided'}), 400

        # Filter out empty files
        files = [f for f in files if f.filename != '']
        
        if not files:
            return jsonify({'error': 'No file selected'}), 400

        # Check current image count
        with Database() as db:
            current_images = db.query(
                "SELECT COUNT(*) as count FROM images WHERE user_id = %s",
                (current_user_id,)
            )

            image_count = current_images[0]['count'] if current_images else 0

            # Check if adding these files would exceed limit
            if image_count + len(files) > MAX_IMAGES_PER_USER:
                return jsonify({
                    'error': f'Maximum {MAX_IMAGES_PER_USER} images allowed. Current: {image_count}, Trying to add: {len(files)}'
                }), 400

            # Create user-specific upload directory
            upload_dir = Path('static') / 'uploads' / f'user_{current_user_id}'
            upload_dir.mkdir(parents=True, exist_ok=True)

            uploaded_images = []
            errors = []

            # Process each file
            for idx, file in enumerate(files):
                try:
                    # Validate file extension
                    if not allowed_file(file.filename):
                        errors.append(f"File {idx + 1} ({file.filename}): Invalid file type")
                        continue

                    # Validate MIME type
                    if file.content_type not in ALLOWED_MIME_TYPES:
                        errors.append(f"File {idx + 1} ({file.filename}): Invalid MIME type")
                        continue

                    # Read file data to check size
                    file_data = file.read()
                    file.seek(0)  # Reset file pointer for saving

                    # Validate file size
                    if len(file_data) > MAX_FILE_SIZE:
                        errors.append(f"File {idx + 1} ({file.filename}): File too large")
                        continue

                    # Generate UUID filename
                    file_ext = file.filename.rsplit('.', 1)[1].lower()
                    unique_filename = f"{uuid.uuid4()}.{file_ext}"

                    # Save file
                    file_path = upload_dir / unique_filename
                    file.save(str(file_path))

                    # Store relative path in database
                    relative_path = f"/static/uploads/user_{current_user_id}/{unique_filename}"

                    # Insert into database
                    image_id = db.query(
                        """INSERT INTO images (user_id, file_path)
                           VALUES (%s, %s) RETURNING id""",
                        (current_user_id, relative_path)
                    )

                    if image_id:
                        image_id = image_id[0] if isinstance(image_id, list) else image_id
                        if isinstance(image_id, dict):
                            image_id = image_id.get('id')
                        
                        uploaded_images.append({
                            'id': image_id,
                            'file_path': relative_path,
                            'filename': file.filename
                        })
                    else:
                        # If insert failed, delete the file
                        if file_path.exists():
                            file_path.unlink()
                        errors.append(f"File {idx + 1} ({file.filename}): Failed to save to database")

                except Exception as e:
                    errors.append(f"File {idx + 1} ({file.filename}): {str(e)}")

            # Return response
            if uploaded_images:
                response = {
                    'message': f'Successfully uploaded {len(uploaded_images)} image(s)',
                    'uploaded_images': uploaded_images
                }
                if errors:
                    response['errors'] = errors
                    response['message'] += f', {len(errors)} failed'
                return jsonify(response), 201
            else:
                return jsonify({
                    'error': 'Failed to upload any images',
                    'errors': errors
                }), 400

    except Exception as e:
        import traceback
        print(f"Upload image error: {e}")
        traceback.print_exc()
        return jsonify({'error': f'Failed to upload image: {str(e)}'}), 500


@bp.route('/images/<int:image_id>', methods=['DELETE'])
@token_required
def delete_image(current_user_id, image_id):
    """Delete user image by ID"""
    try:
        with Database() as db:
            # Verify image exists and belongs to current user
            image = db.query(
                """SELECT id, file_path, user_id 
                   FROM images WHERE id = %s AND user_id = %s""",
                (image_id, current_user_id)
            )
            
            if not image:
                return jsonify({'error': 'Image not found or you do not have permission to delete it'}), 404
            
            image_data = image[0]
            file_path = image_data['file_path']
            
            # Remove leading slash if present to get relative path
            if file_path.startswith('/'):
                file_path = file_path[1:]
            
            # Construct full file path
            full_file_path = Path(file_path)
            
            # Delete file from disk if it exists
            if full_file_path.exists():
                try:
                    full_file_path.unlink()
                except Exception as e:
                    print(f"Warning: Failed to delete file {full_file_path}: {e}")
                    # Continue with database deletion even if file deletion fails
            
            # Delete image record from database
            db.query(
                "DELETE FROM images WHERE id = %s AND user_id = %s",
                (image_id, current_user_id)
            )
            
            return jsonify({
                'message': 'Image deleted successfully',
                'deleted_image_id': image_id
            }), 200
    
    except Exception as e:
        import traceback
        print(f"Delete image error: {e}")
        traceback.print_exc()
        return jsonify({'error': f'Failed to delete image: {str(e)}'}), 500


@bp.route('/images/<int:image_id>/set-profile', methods=['PUT'])
@token_required
def set_profile_picture(current_user_id, image_id):
    """
    Set an image as the profile picture.
    Only one image can be the profile picture at a time.
    """
    try:
        with Database() as db:
            # Verify image exists and belongs to current user
            image = db.query(
                "SELECT id, user_id FROM images WHERE id = %s AND user_id = %s",
                (image_id, current_user_id)
            )
            
            if not image:
                return jsonify({'error': 'Image not found'}), 404
            
            # Clear existing profile picture
            db.query(
                "UPDATE images SET is_profile_pic = FALSE WHERE user_id = %s",
                (current_user_id,)
            )
            
            # Set new profile picture
            db.query(
                "UPDATE images SET is_profile_pic = TRUE WHERE id = %s",
                (image_id,)
            )
            
            return jsonify({
                'message': 'Profile picture updated',
                'profile_image_id': image_id
            }), 200
    
    except Exception as e:
        import traceback
        print(f"Set profile picture error: {e}")
        traceback.print_exc()
        return jsonify({'error': f'Failed to set profile picture: {str(e)}'}), 500

