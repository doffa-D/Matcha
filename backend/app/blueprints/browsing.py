from flask import Blueprint, request, jsonify
from math import radians, cos, sin, asin, sqrt
from app.db import Database
from app.jwt import token_required
from app.utils.user_utils import is_online

bp = Blueprint('browsing', __name__, url_prefix='/api')


def calculate_distance_km(lat1, lon1, lat2, lon2):
    """
    Calculate distance between two points using Haversine formula.
    
    Args:
        lat1, lon1: First point (your location)
        lat2, lon2: Second point (other user's location)
    
    Returns:
        Distance in kilometers (float)
    
    Example:
        distance = calculate_distance_km(48.8566, 2.3522, 51.5074, -0.1278)
        # Returns: ~343 km (Paris to London)
    """
    # If any coordinate is missing, return a large number
    if None in [lat1, lon1, lat2, lon2]:
        return 9999.0
    
    # Convert to radians (required for math functions)
    lat1, lon1, lat2, lon2 = map(radians, [float(lat1), float(lon1), float(lat2), float(lon2)])
    
    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    
    # Earth's radius in kilometers
    earth_radius_km = 6371
    
    return earth_radius_km * c


def build_orientation_filter(my_gender, my_preference):
    """

    """
    # If no gender set, show everyone (can't filter)
    if not my_gender:
        return ""
    
    # Determine opposite gender
    opposite = 'Female' if my_gender == 'Male' else 'Male'
    
    # Default to Bisexual if preference not set
    if not my_preference:
        my_preference = 'Bisexual'
    
    if my_preference == 'Straight':
        # I'm straight: Show opposite gender who likes my gender (Straight or Bi)
        return f"""
            AND u.gender = '{opposite}'
            AND (u.sexual_preference = 'Straight' 
                 OR u.sexual_preference = 'Bisexual' 
                 OR u.sexual_preference IS NULL)
        """
    
    elif my_preference == 'Gay':
        # I'm gay: Show same gender who likes same gender (Gay or Bi)
        return f"""
            AND u.gender = '{my_gender}'
            AND (u.sexual_preference = 'Gay' 
                 OR u.sexual_preference = 'Bisexual' 
                 OR u.sexual_preference IS NULL)
        """
    
    else:  # Bisexual
        # I'm bi: Show anyone who could be interested in my gender
        return f"""
            AND (
                (u.gender = '{opposite}' 
                 AND (u.sexual_preference IN ('Straight', 'Bisexual') OR u.sexual_preference IS NULL))
                OR
                (u.gender = '{my_gender}' 
                 AND (u.sexual_preference IN ('Gay', 'Bisexual') OR u.sexual_preference IS NULL))
            )
        """



def count_common_tags(db, user_id_1, user_id_2):
    """
    Count how many tags two users have in common.
    
    Args:
        db: Database connection
        user_id_1: First user's ID
        user_id_2: Second user's ID
    
    Returns:
        Number of common tags (int)
    
    Example:
        User 1 tags: #music, #travel, #food
        User 2 tags: #travel, #food, #sports
        Common: #travel, #food → Returns 2
    """
    result = db.query(
        """
        SELECT COUNT(*) as count
        FROM user_tags ut1
        INNER JOIN user_tags ut2 ON ut1.tag_id = ut2.tag_id
        WHERE ut1.user_id = %s AND ut2.user_id = %s
        """,
        (user_id_1, user_id_2)
    )
    return result[0]['count'] if result else 0


def get_user_tags(db, user_id):
    """
    Get all tags for a user.
    
    Returns:
        List of tag names, e.g., ['#music', '#travel']
    """
    tags = db.query(
        """
        SELECT t.tag_name 
        FROM tags t
        INNER JOIN user_tags ut ON t.id = ut.tag_id
        WHERE ut.user_id = %s
        ORDER BY t.tag_name
        """,
        (user_id,)
    )
    return [t['tag_name'] for t in tags]


def get_profile_image(db, user_id):
    """
    Get the first image for a user (profile picture).
    
    Returns:
        Image path string or None
    """
    images = db.query(
        "SELECT file_path FROM images WHERE user_id = %s ORDER BY created_at ASC LIMIT 1",
        (user_id,)
    )
    return images[0]['file_path'] if images else None


def is_blocked(db, user_id_1, user_id_2):
    """
    Check if there's a block between two users (in either direction).
    
    Returns:
        True if blocked, False otherwise
    """
    result = db.query(
        """
        SELECT id FROM blocks 
        WHERE (blocker_id = %s AND blocked_id = %s)
           OR (blocker_id = %s AND blocked_id = %s)
        """,
        (user_id_1, user_id_2, user_id_2, user_id_1)
    )
    return len(result) > 0 if result else False


def get_current_user_info(db, user_id):
    """
    Get current user's gender, preference, and location for matching.
    
    Returns:
        Dictionary with user info or None if not found
    """
    result = db.query(
        """
        SELECT gender, sexual_preference, latitude, longitude
        FROM users WHERE id = %s
        """,
        (user_id,)
    )
    return result[0] if result else None


def get_blocked_user_ids(db, user_id):
    """
    Get list of user IDs that are blocked (in either direction).
    
    Returns:
        Set of blocked user IDs
    """
    blocks = db.query(
        """
        SELECT blocker_id, blocked_id FROM blocks
        WHERE blocker_id = %s OR blocked_id = %s
        """,
        (user_id, user_id)
    )
    
    blocked_ids = set()
    if blocks:
        for block in blocks:
            blocked_ids.add(block['blocker_id'])
            blocked_ids.add(block['blocked_id'])
    
    # Remove current user from the set
    blocked_ids.discard(user_id)
    
    return blocked_ids


def apply_filters(users, min_age=None, max_age=None, max_distance=None, 
                  min_fame=None, max_fame=None):
    """
    Filter users based on criteria.
    
    Args:
        users: List of user dictionaries
        min_age, max_age: Age range filter
        max_distance: Maximum distance in km
        min_fame, max_fame: Fame rating range
    
    Returns:
        Filtered list of users
    """
    filtered = []
    
    for user in users:
        # Age filter
        if min_age and user.get('age') and user['age'] < min_age:
            continue
        if max_age and user.get('age') and user['age'] > max_age:
            continue
        
        # Distance filter
        if max_distance and user.get('distance_km') and user['distance_km'] > max_distance:
            continue
        
        # Fame filter
        if min_fame and user.get('fame_rating') and user['fame_rating'] < min_fame:
            continue
        if max_fame and user.get('fame_rating') and user['fame_rating'] > max_fame:
            continue
        
        filtered.append(user)
    
    return filtered


def sort_users(users, sort_by='distance', order='asc'):
    """
    Sort users by specified field.
    
    Args:
        users: List of user dictionaries
        sort_by: 'distance', 'age', 'fame_rating', 'common_tags'
        order: 'asc' or 'desc'
    
    Returns:
        Sorted list of users
    """
    # Map sort field to dictionary key
    field_map = {
        'distance': 'distance_km',
        'age': 'age',
        'fame_rating': 'fame_rating',
        'common_tags': 'common_tags_count'
    }
    
    field = field_map.get(sort_by, 'distance_km')
    reverse = (order == 'desc')
    
    # Handle None values (put them at the end)
    def sort_key(user):
        value = user.get(field)
        if value is None:
            return float('inf') if not reverse else float('-inf')
        return value
    
    return sorted(users, key=sort_key, reverse=reverse)

    
@bp.route('/browsing', methods=['GET'])
@token_required
def get_suggestions(current_user_id):
    """
    Get suggested profiles for the current user.
    
    Supports two modes:
    1. BROWSING MODE (default): Uses orientation filter for matching algorithm
    2. SEARCH MODE: When 'gender' param is provided, skips orientation filter
    
    Query Parameters:
        # Search Mode (skips orientation filter when provided)
        gender: 'Male' | 'Female' | 'all' - Explicit gender filter (activates search mode)
        
        # Common filters
        sort: 'distance' | 'age' | 'fame_rating' | 'common_tags' (default: distance)
        order: 'asc' | 'desc' (default: asc for distance, desc for others)
        min_age: Minimum age filter
        max_age: Maximum age filter
        max_distance: Maximum distance in km
        min_fame: Minimum fame rating
        max_fame: Maximum fame rating
        tags: Comma-separated tag IDs to filter by
        page: Page number (default: 1)
        limit: Results per page (default: 20, max: 50)
    
    Returns:
        {
            "users": [...],
            "pagination": {"page": 1, "limit": 20, "total": 100, "pages": 5},
            "mode": "browsing" | "search"
        }
    """
    try:
        # =====================================================================
        # STEP 1: Get query parameters
        # =====================================================================
        
        # Search mode parameter (explicit gender filter)
        gender_filter = request.args.get('gender')  # 'Male', 'Female', 'all', or None
        
        # Common parameters
        sort_by = request.args.get('sort', 'distance')
        order = request.args.get('order', 'asc' if sort_by == 'distance' else 'desc')
        min_age = request.args.get('min_age', type=int)
        max_age = request.args.get('max_age', type=int)
        max_distance = request.args.get('max_distance', type=int)
        min_fame = request.args.get('min_fame', type=float)
        max_fame = request.args.get('max_fame', type=float)
        tag_ids_str = request.args.get('tags', '')
        page = request.args.get('page', 1, type=int)
        limit = min(request.args.get('limit', 20, type=int), 50)  # Max 50
        
        # Determine mode: search (explicit gender) or browsing (orientation filter)
        is_search_mode = gender_filter is not None
        
        # Parse tag IDs if provided
        filter_tag_ids = []
        if tag_ids_str:
            filter_tag_ids = [int(t) for t in tag_ids_str.split(',') if t.strip().isdigit()]
        import logging
        logging.basicConfig(level=logging.INFO)

        logging.info(f"filter_tag_ids: {filter_tag_ids}")
        with Database() as db:
            # =================================================================
            # STEP 2: Get current user's info
            # =================================================================
            me = get_current_user_info(db, current_user_id)
            print(f"me: {me}")
            import logging
            logging.basicConfig(level=logging.INFO)
            logging.info(f"me: {me}")
            if not me:
                return jsonify({'error': 'User not found'}), 404
            
            my_lat = me['latitude']
            my_lon = me['longitude']
            
            # =================================================================
            # STEP 3: Get blocked users (to exclude)
            # =================================================================
            blocked_ids = get_blocked_user_ids(db, current_user_id)
            
            # =================================================================
            # STEP 4: Build filter based on mode
            # =================================================================
            if is_search_mode:
                # SEARCH MODE: Use explicit gender filter (no orientation matching)
                if gender_filter == 'all':
                    gender_sql_filter = ""  # No gender filter
                elif gender_filter in ['Male', 'Female']:
                    gender_sql_filter = f"AND u.gender = '{gender_filter}'"
                else:
                    gender_sql_filter = ""  # Invalid value, show all
            else:
                # BROWSING MODE: Use orientation-based matching
                gender_sql_filter = build_orientation_filter(
                    me['gender'], 
                    me['sexual_preference']
                )
            
            # =================================================================
            # STEP 5: Get all potential matches from database
            # =================================================================
            query = f"""
                SELECT id, username, first_name, last_name, age, gender, bio,
                       fame_rating, latitude, longitude, last_online,
                       sexual_preference, is_verified
                FROM users u
                WHERE u.id != %s
                  AND u.is_verified = true
                  {gender_sql_filter}
                ORDER BY u.id
            """
            
            all_users = db.query(query, (current_user_id,))
            
            if not all_users:
                all_users = []
            
            # =================================================================
            # STEP 6: Process each user (add distance, tags, check blocks)
            # =================================================================
            processed_users = []
            
            for user in all_users:
                # Skip blocked users
                if user['id'] in blocked_ids:
                    continue
                
                # Calculate distance
                distance = calculate_distance_km(
                    my_lat, my_lon,
                    user['latitude'], user['longitude']
                )
                
                # Count common tags
                common_tags = count_common_tags(db, current_user_id, user['id'])
                
                # Skip if tag filter is set and user doesn't have required tags
                if filter_tag_ids:
                    user_tag_ids = db.query(
                        "SELECT tag_id FROM user_tags WHERE user_id = %s",
                        (user['id'],)
                    )
                    user_tag_set = {t['tag_id'] for t in user_tag_ids} if user_tag_ids else set()
                    if not any(tid in user_tag_set for tid in filter_tag_ids):
                        continue
                
                # Get user's tags and profile image
                tags = get_user_tags(db, user['id'])
                profile_image = get_profile_image(db, user['id'])
                
                # Build user object
                processed_users.append({
                    'id': user['id'],
                    'username': user['username'],
                    'first_name': user['first_name'],
                    'last_name': user['last_name'],
                    'age': user['age'],
                    'gender': user['gender'],
                    'bio': user['bio'],
                    'fame_rating': float(user['fame_rating']) if user['fame_rating'] else 0.0,
                    'distance_km': round(distance, 1),
                    'common_tags_count': common_tags,
                    'tags': tags,
                    'profile_image': profile_image,
                    'is_online': is_online(user['last_online']),
                    'last_online': user['last_online'].isoformat() if user['last_online'] else None
                })
            
            # =================================================================
            # STEP 7: Apply filters
            # =================================================================
            filtered_users = apply_filters(
                processed_users,
                min_age=min_age,
                max_age=max_age,
                max_distance=max_distance,
                min_fame=min_fame,
                max_fame=max_fame
            )
            
            # =================================================================
            # STEP 8: Sort users
            # =================================================================
            sorted_users = sort_users(filtered_users, sort_by=sort_by, order=order)
            
            # =================================================================
            # STEP 9: Paginate results
            # =================================================================
            total = len(sorted_users)
            total_pages = (total + limit - 1) // limit  # Ceiling division
            start = (page - 1) * limit
            end = start + limit
            page_users = sorted_users[start:end]
            
            # =================================================================
            # STEP 10: Return response
            # =================================================================
            return jsonify({
                'users': page_users,
                'pagination': {
                    'page': page,
                    'limit': limit,
                    'total': total,
                    'pages': total_pages
                },
                'mode': 'search' if is_search_mode else 'browsing'
            }), 200
            
    except Exception as e:
        import traceback
        print(f"Browsing error: {e}")
        traceback.print_exc()
        return jsonify({'error': f'Failed to get suggestions: {str(e)}'}), 500

