from flask import request
from flask_socketio import join_room, leave_room, emit
from app import socketio
from app.jwt import decode_token
from app.db import Database


@socketio.on('connect')
def handle_connect():
    """Join user's personal room on connect."""
    token = request.args.get('token')
    if not token:
        return False
    
    payload = decode_token(token)
    if not payload:
        return False
    
    user_id = payload.get('user_id')
    join_room(f'user_{user_id}')
    emit('connected', {'user_id': user_id})


@socketio.on('disconnect')
def handle_disconnect():
    """Leave room on disconnect."""
    pass  # Room auto-cleaned by Flask-SocketIO


def send_notification(user_id: int, notif_type: str, source_user_id: int):
    """
    Save notification to DB and emit via WebSocket.
    Types: 'like', 'visit', 'message', 'match', 'unmatch'
    """
    # Map 'unlike' to 'unmatch' to match DB constraint
    db_type = 'unmatch' if notif_type == 'unlike' else notif_type
    
    with Database() as db:
        # Save to DB
        db.query(
            "INSERT INTO notifications (user_id, type, source_id) VALUES (%s, %s, %s)",
            (user_id, db_type, source_user_id)
        )
        
        # Get source user name
        user = db.query(
            "SELECT first_name FROM users WHERE id = %s",
            (source_user_id,)
        )
        name = user[0]['first_name'] if user else 'Someone'
    
    # Emit real-time notification
    socketio.emit('notification', {
        'type': notif_type,
        'from_user_id': source_user_id,
        'message': f"{name} {notif_type}d your profile" if notif_type != 'match' else f"You matched with {name}!"
    }, room=f'user_{user_id}')
