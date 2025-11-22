from flask import Blueprint, request, jsonify
import bcrypt
import secrets
import re
from datetime import datetime, timedelta
from app.db import Database
from app.utils.email import send_verification_email
from app.jwt import generate_token


bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['email', 'username', 'first_name', 'last_name', 'password']
    if not data or not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    email = data['email'].strip().lower()
    username = data['username'].strip()
    first_name = data['first_name'].strip()
    last_name = data['last_name'].strip()
    password = data['password']
    
    # Email validation
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, email):
        return jsonify({'error': 'Invalid email format'}), 400
    
    # Password validation (minimum 8 characters)
    if len(password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters'}), 400
    
    # Hash password
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Generate verification token
    verification_token = secrets.token_urlsafe(32)
    
    try:
        with Database() as db:
            # Check if username/email already exists
            existing = db.query(
                "SELECT id FROM users WHERE username = %s OR email = %s",
                (username, email)
            )
            if existing:
                return jsonify({'error': 'Username or email already exists'}), 409
            
            # Insert user
            user_id = db.query(
                """INSERT INTO users (username, email, password_hash, first_name, last_name)
                   VALUES (%s, %s, %s, %s, %s) RETURNING id""",
                (username, email, password_hash, first_name, last_name)
            )
            
            # Insert verification token
            expires_at = datetime.utcnow() + timedelta(hours=24)
            db.query(
                """INSERT INTO tokens (user_id, token, type, expires_at)
                   VALUES (%s, %s, 'verification', %s)""",
                (user_id, verification_token, expires_at)
            )
            
        # Send verification email
        email_sent = send_verification_email(email, verification_token)
        if not email_sent:
            print(f"WARNING: Failed to send verification email to {email}")
        
        return jsonify({
            'message': 'Registration successful. Please verify your email.',
            'verification_token': verification_token  # Remove in production
        }), 201
    
    except Exception as e:
        import traceback
        print(f"Registration error: {e}")
        traceback.print_exc()
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500


@bp.route('/verify/<token>', methods=['GET'])
def verify_email(token):
    """Verify user email with token"""
    try:
        with Database() as db:
            # Find token
            token_data = db.query(
                """SELECT user_id, expires_at FROM tokens 
                   WHERE token = %s AND type = 'verification'""",
                (token,)
            )
            
            if not token_data:
                return jsonify({'error': 'Invalid verification token'}), 400
            
            token_info = token_data[0]
            
            # Check expiration
            if datetime.utcnow() > token_info['expires_at']:
                return jsonify({'error': 'Verification token expired'}), 400
            
            # Check if already verified
            user_check = db.query(
                "SELECT is_verified FROM users WHERE id = %s",
                (token_info['user_id'],)
            )
            
            if user_check and user_check[0]['is_verified']:
                return jsonify({'message': 'Account already verified'}), 200
            
            # Update user as verified
            db.query(
                "UPDATE users SET is_verified = TRUE WHERE id = %s",
                (token_info['user_id'],)
            )
            
            # Delete used token
            db.query("DELETE FROM tokens WHERE token = %s", (token,))
        
        return jsonify({'message': 'Email verified successfully'}), 200
    
    except Exception as e:
        import traceback
        print(f"Verification error: {e}")
        traceback.print_exc()
        return jsonify({'error': f'Verification failed: {str(e)}'}), 500



@bp.route('/login', methods=['POST'])
def login():
    """Login with username and password"""
    data = request.get_json()
    
    # Validate required fields
    if not data or 'username' not in data or 'password' not in data:
        return jsonify({'error': 'Username and password required'}), 400
    
    username = data['username'].strip()
    password = data['password']
    
    try:
        with Database() as db:
            # Find user by username
            user = db.query(
                "SELECT id, username, email, password_hash, is_verified FROM users WHERE username = %s",
                (username,)
            )
            
            if not user:
                return jsonify({'error': 'Invalid username or password'}), 401
            
            user_data = user[0]
            
            # Check if account is verified
            if not user_data['is_verified']:
                return jsonify({'error': 'Account not verified. Please check your email.'}), 403
            
            # Verify password
            if not bcrypt.checkpw(password.encode('utf-8'), user_data['password_hash'].encode('utf-8')):
                return jsonify({'error': 'Invalid username or password'}), 401
            
            # Update last_online timestamp
            db.query(
                "UPDATE users SET last_online = CURRENT_TIMESTAMP WHERE id = %s",
                (user_data['id'],)
            )
            
            # Generate JWT token
            token = generate_token(user_data['id'])
            
            return jsonify({
                'message': 'Login successful',
                'token': token,
                'user': {
                    'id': user_data['id'],
                    'username': user_data['username'],
                    'email': user_data['email']
                }
            }), 200
    
    except Exception as e:
        import traceback
        print(f"Login error: {e}")
        traceback.print_exc()
        return jsonify({'error': f'Login failed: {str(e)}'}), 500