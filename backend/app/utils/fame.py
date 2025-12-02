def calculate_fame_rating(db, user_id):
    """
    Calculate fame rating (0.00 - 5.00) based on likes received.
    
    Args:
        db: Database connection
        user_id: User ID to calculate fame for
    
    Returns:
        Fame rating as float (0.00 - 5.00)
    """
    result = db.query(
        "SELECT COUNT(*) as count FROM likes WHERE liked_id = %s",
        (user_id,)
    )
    likes = result[0]['count'] if result else 0
    
    # Normalize: 10 likes = 1.0 rating, max 5.0
    rating = min(5.0, likes / 10.0)
    return round(rating, 2)


def update_user_fame(user_id):
    """
    Recalculate and save fame rating for a user.
    
    Args:
        user_id: User ID to update
    
    Returns:
        New fame rating
    """
    from app.db import Database
    
    with Database() as db:
        rating = calculate_fame_rating(db, user_id)
        db.query(
            "UPDATE users SET fame_rating = %s WHERE id = %s",
            (rating, user_id)
        )
    return rating




