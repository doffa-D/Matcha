from datetime import datetime


def calculate_age(date_of_birth):
    """Calculate age from date_of_birth"""
    if not date_of_birth:
        return None
    today = datetime.utcnow().date()
    age = today.year - date_of_birth.year - ((today.month, today.day) < (date_of_birth.month, date_of_birth.day))
    return age


def is_online(last_online):
    """Check if user is online (within last 5 minutes)"""
    if not last_online:
        return False
    time_diff = datetime.utcnow() - last_online
    return time_diff.total_seconds() < 300  # 5 minutes