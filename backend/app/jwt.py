import jwt
from functools import wraps
from flask import request, jsonify
from datetime import datetime, timedelta
from config import Config
from app.db import Database


def generate_token(user_id: int) -> str:
    """Generate JWT token for user"""
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(hours=Config.JWT_EXPIRATION_HOURS),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, Config.JWT_SECRET_KEY, algorithm=Config.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    """Decode JWT token without checking blacklist (for logout)"""
    try:
        payload = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=[Config.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def verify_token(token: str) -> dict:
    """Verify JWT token and return payload. Checks if token is blacklisted."""
    try:
        # First check if token is blacklisted
        with Database() as db:
            blacklisted = db.query(
                """SELECT id FROM tokens 
                   WHERE token = %s AND type = 'blacklist' AND expires_at > CURRENT_TIMESTAMP""",
                (token,)
            )
            if blacklisted:
                return None
        
        # Verify JWT signature and expiration
        payload = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=[Config.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def token_required(f):
    """Decorator to protect routes requiring authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Check Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(' ')[1]  # Bearer <token>
            except IndexError:
                return jsonify({'error': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        # Verify token (includes blacklist check)
        payload = verify_token(token)
        if not payload:
            return jsonify({'error': 'Token is invalid, expired'}), 401
        
        # Add user_id to kwargs for route handler
        kwargs['current_user_id'] = payload['user_id']
        
        return f(*args, **kwargs)
    
    return decorated