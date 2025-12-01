from flask import request
from flask_socketio import join_room, leave_room, emit
from app import socketio
from app.jwt import decode_token
from app.db import Database


# Store connected user IDs for quick lookup
connected_users = {}


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
    connected_users[request.sid] = user_id
    
    # Update last_online
    with Database() as db:
        db.query(
            "UPDATE users SET last_online = CURRENT_TIMESTAMP WHERE id = %s",
            (user_id,)
        )
    
    emit('connected', {'user_id': user_id})


@socketio.on('disconnect')
def handle_disconnect():
    """Leave room on disconnect."""
    user_id = connected_users.pop(request.sid, None)
    if user_id:
        # Update last_online on disconnect
        with Database() as db:
            db.query(
                "UPDATE users SET last_online = CURRENT_TIMESTAMP WHERE id = %s",
                (user_id,)
            )


@socketio.on('send_message')
def handle_send_message(data):
    """
    Handle real-time message sending via WebSocket.
    Data: {'receiver_id': int, 'content': str}
    """
    user_id = connected_users.get(request.sid)
    if not user_id:
        emit('error', {'message': 'Not authenticated'})
        return
    
    receiver_id = data.get('receiver_id')
    content = data.get('content', '').strip()
    
    if not receiver_id or not content:
        emit('error', {'message': 'Missing receiver_id or content'})
        return
    
    if len(content) > 2000:
        emit('error', {'message': 'Message too long'})
        return
    
    with Database() as db:
        # Check if connected (mutual like)
        like_1 = db.query(
            "SELECT id FROM likes WHERE liker_id = %s AND liked_id = %s",
            (user_id, receiver_id)
        )
        like_2 = db.query(
            "SELECT id FROM likes WHERE liker_id = %s AND liked_id = %s",
            (receiver_id, user_id)
        )
        
        if not (like_1 and like_2):
            emit('error', {'message': 'You must be connected to chat'})
            return
        
        # Check if blocked
        blocked = db.query(
            """SELECT id FROM blocks 
               WHERE (blocker_id = %s AND blocked_id = %s)
                  OR (blocker_id = %s AND blocked_id = %s)""",
            (user_id, receiver_id, receiver_id, user_id)
        )
        if blocked:
            emit('error', {'message': 'Cannot chat with blocked user'})
            return
        
        # Save message
        result = db.query("""
            INSERT INTO messages (sender_id, receiver_id, content)
            VALUES (%s, %s, %s)
            RETURNING id, created_at
        """, (user_id, receiver_id, content))
        
        msg_id = result['id'] if isinstance(result, dict) else result
        created_at = result.get('created_at') if isinstance(result, dict) else None
    
    # Create message payload
    message_data = {
        'id': msg_id,
        'sender_id': user_id,
        'receiver_id': receiver_id,
        'content': content,
        'created_at': created_at.isoformat() if created_at else None
    }
    
    # Send to receiver
    socketio.emit('new_message', message_data, room=f'user_{receiver_id}')
    
    # Confirm to sender
    emit('message_sent', message_data)
    
    # Send notification
    send_notification(receiver_id, 'message', user_id)


@socketio.on('typing')
def handle_typing(data):
    """Broadcast typing indicator to receiver."""
    user_id = connected_users.get(request.sid)
    if not user_id:
        return
    
    receiver_id = data.get('receiver_id')
    if receiver_id:
        socketio.emit('user_typing', {
            'user_id': user_id,
            'is_typing': data.get('is_typing', True)
        }, room=f'user_{receiver_id}')


def send_notification(user_id: int, notif_type: str, source_user_id: int):
    """
    Save notification to DB and emit via WebSocket.
    Types: 'like', 'visit', 'message', 'match', 'unlike'
    """
    with Database() as db:
        # Save to DB
        db.query(
            "INSERT INTO notifications (user_id, type, source_user_id) VALUES (%s, %s, %s)",
            (user_id, notif_type, source_user_id)
        )
        
        # Get source user name
        user = db.query(
            "SELECT first_name FROM users WHERE id = %s",
            (source_user_id,)
        )
        name = user[0]['first_name'] if user else 'Someone'
    
    # Build notification message
    messages = {
        'like': f"{name} liked your profile",
        'visit': f"{name} visited your profile",
        'message': f"{name} sent you a message",
        'match': f"You matched with {name}!",
        'unlike': f"{name} unliked your profile"
    }
    
    # Emit real-time notification
    socketio.emit('notification', {
        'type': notif_type,
        'from_user_id': source_user_id,
        'message': messages.get(notif_type, f"{name} interacted with you")
    }, room=f'user_{user_id}')
