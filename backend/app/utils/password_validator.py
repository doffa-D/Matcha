
COMMON_DICTIONARY_WORDS = {
    # Common passwords
    'password', 'admin', 'qwerty', 'abc123', 'letmein', 'welcome', 'monkey',
    'dragon', 'master', 'sunshine', 'princess', 'login', 'hello',
    # Common passwords with numbers
    'password123', 'admin123', 'qwerty123', 'welcome123', 'letmein123',
    'password1', 'admin1', 'qwerty1', 'password12', 'admin12', 'welcome1',
    # Common English dictionary words
    'world', 'computer', 'internet', 'website', 'email', 'phone',
    'house', 'home', 'car', 'friend', 'family', 'love', 'time', 'work',
    'school', 'student', 'teacher', 'people', 'person', 'woman', 'man',
    'good', 'bad', 'happy', 'sad', 'new', 'old'
}


def contains_dictionary_word(password):
    """Check if password contains dictionary words"""
    password_lower = password.lower()
    # Check if any dictionary word (min 4 chars) is in the password
    return any(word in password_lower for word in COMMON_DICTIONARY_WORDS if len(word) >= 4)

