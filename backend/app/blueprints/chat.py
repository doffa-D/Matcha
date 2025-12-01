from flask import Blueprint, request, jsonify
from app.db import Database
from app.jwt import token_required
from app.sockets.events import send_notification

bp = Blueprint('chat', __name__, url_prefix='/api/chat')


def are_connected(db, user_id_1, user_id_2):
    """
    Check if two users are connected (mutual like).
    Returns True if both users have liked each other.
    """
    # Check if user_1 liked user_2
    like_1_to_2 = db.query(
        "SELECT id FROM likes WHERE liker_id = %s AND liked_id = %s",
        (user_id_1, user_id_2)
    )
    # Check if user_2 liked user_1
    like_2_to_1 = db.query(
        "SELECT id FROM likes WHERE liker_id = %s AND liked_id = %s",
        (user_id_2, user_id_1)
    )
    return bool(like_1_to_2) and bool(like_2_to_1)


def is_blocked(db, user_id_1, user_id_2):
    """Check if either user has blocked the other."""
    result = db.query(
        """SELECT id FROM blocks 
           WHERE (blocker_id = %s AND blocked_id = %s)
              OR (blocker_id = %s AND blocked_id = %s)""",
        (user_id_1, user_id_2, user_id_2, user_id_1)
    )
    return bool(result)


@bp.route('/conversations', methods=['GET'])
@token_required
def get_conversations(current_user_id):
    """
    Get list of all conversations (connected users with message history).
    Returns users I'm connected with, sorted by last message time.
    """
    try:
        with Database() as db:
            # Get all users I'm connected with (mutual likes)
            connected_users = db.query("""
                SELECT DISTINCT u.id, u.username, u.first_name, u.last_name, 
                       u.last_online,
                       (SELECT file_path FROM images 
                        WHERE user_id = u.id 
                        ORDER BY is_profile_pic DESC, created_at ASC 
                        LIMIT 1) as profile_image
                FROM users u
                WHERE u.id IN (
                    -- Users I liked who also liked me
                    SELECT l1.liked_id 
                    FROM likes l1
                    INNER JOIN likes l2 ON l1.liked_id = l2.liker_id 
                                       AND l1.liker_id = l2.liked_id
                    WHERE l1.liker_id = %s
                )
                AND u.id NOT IN (
                    -- Exclude blocked users
                    SELECT blocked_id FROM blocks WHERE blocker_id = %s
                    UNION
                    SELECT blocker_id FROM blocks WHERE blocked_id = %s
                )
            """, (current_user_id, current_user_id, current_user_id))
            
            conversations = []
            for user in connected_users:
                # Get last message with this user
                last_msg = db.query("""
                    SELECT content, created_at, sender_id
                    FROM messages
                    WHERE (sender_id = %s AND receiver_id = %s)
                       OR (sender_id = %s AND receiver_id = %s)
                    ORDER BY created_at DESC
                    LIMIT 1
                """, (current_user_id, user['id'], user['id'], current_user_id))
                
                # Get unread count from this user
                unread = db.query("""
                    SELECT COUNT(*) as count FROM messages
                    WHERE sender_id = %s AND receiver_id = %s AND is_read = FALSE
                """, (user['id'], current_user_id))
                
                conversations.append({
                    'user': {
                        'id': user['id'],
                        'username': user['username'],
                        'first_name': user['first_name'],
                        'last_name': user['last_name'],
                        'profile_image': user['profile_image'],
                        'is_online': _is_online(user['last_online'])
                    },
                    'last_message': {
                        'content': last_msg[0]['content'] if last_msg else None,
                        'created_at': last_msg[0]['created_at'].isoformat() if last_msg else None,
                        'is_mine': last_msg[0]['sender_id'] == current_user_id if last_msg else None
                    } if last_msg else None,
                    'unread_count': unread[0]['count'] if unread else 0
                })
            
            # Sort by last message time (most recent first)
            conversations.sort(
                key=lambda c: c['last_message']['created_at'] if c['last_message'] else '',
                reverse=True
            )
            
            return jsonify({'conversations': conversations}), 200
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to get conversations: {str(e)}'}), 500


@bp.route('/messages/<int:other_user_id>', methods=['GET'])
@token_required
def get_messages(current_user_id, other_user_id):
    """
    Get message history with another user.
    Only works if users are connected (mutual like).
    
    Query params:
        limit: Number of messages (default 50, max 100)
        before_id: Get messages before this ID (for pagination)
    """
    try:
        limit = min(request.args.get('limit', 50, type=int), 100)
        before_id = request.args.get('before_id', type=int)
        
        with Database() as db:
            # Check if connected
            if not are_connected(db, current_user_id, other_user_id):
                return jsonify({'error': 'You must be connected to chat'}), 403
            
            # Check if blocked
            if is_blocked(db, current_user_id, other_user_id):
                return jsonify({'error': 'Cannot chat with blocked user'}), 403
            
            # Build query
            if before_id:
                messages = db.query("""
                    SELECT id, sender_id, receiver_id, content, is_read, created_at
                    FROM messages
                    WHERE ((sender_id = %s AND receiver_id = %s)
                        OR (sender_id = %s AND receiver_id = %s))
                      AND id < %s
                    ORDER BY created_at DESC
                    LIMIT %s
                """, (current_user_id, other_user_id, 
                      other_user_id, current_user_id, 
                      before_id, limit))
            else:
                messages = db.query("""
                    SELECT id, sender_id, receiver_id, content, is_read, created_at
                    FROM messages
                    WHERE (sender_id = %s AND receiver_id = %s)
                       OR (sender_id = %s AND receiver_id = %s)
                    ORDER BY created_at DESC
                    LIMIT %s
                """, (current_user_id, other_user_id, 
                      other_user_id, current_user_id, limit))
            
            # Mark messages from other user as read
            db.query("""
                UPDATE messages SET is_read = TRUE
                WHERE sender_id = %s AND receiver_id = %s AND is_read = FALSE
            """, (other_user_id, current_user_id))
            
            # Format response (reverse to get chronological order)
            formatted = [
                {
                    'id': m['id'],
                    'sender_id': m['sender_id'],
                    'receiver_id': m['receiver_id'],
                    'content': m['content'],
                    'is_read': m['is_read'],
                    'is_mine': m['sender_id'] == current_user_id,
                    'created_at': m['created_at'].isoformat() if m['created_at'] else None
                }
                for m in reversed(messages)
            ]
            
            return jsonify({
                'messages': formatted,
                'has_more': len(messages) == limit
            }), 200
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to get messages: {str(e)}'}), 500


@bp.route('/messages/<int:other_user_id>', methods=['POST'])
@token_required
def send_message(current_user_id, other_user_id):
    """
    Send a message to another user.
    Only works if users are connected (mutual like).
    
    Request body:
        {"content": "Message text"}
    """
    try:
        data = request.get_json()
        if not data or 'content' not in data:
            return jsonify({'error': 'Message content required'}), 400
        
        content = data['content'].strip()
        if not content:
            return jsonify({'error': 'Message cannot be empty'}), 400
        
        if len(content) > 2000:
            return jsonify({'error': 'Message too long (max 2000 characters)'}), 400
        
        if current_user_id == other_user_id:
            return jsonify({'error': 'Cannot message yourself'}), 400
        
        with Database() as db:
            # Check if other user exists
            other_user = db.query(
                "SELECT id, username FROM users WHERE id = %s",
                (other_user_id,)
            )
            if not other_user:
                return jsonify({'error': 'User not found'}), 404
            
            # Check if connected
            if not are_connected(db, current_user_id, other_user_id):
                return jsonify({'error': 'You must be connected to chat'}), 403
            
            # Check if blocked
            if is_blocked(db, current_user_id, other_user_id):
                return jsonify({'error': 'Cannot chat with blocked user'}), 403
            
            # Insert message
            message_id = db.query("""
                INSERT INTO messages (sender_id, receiver_id, content)
                VALUES (%s, %s, %s)
                RETURNING id, created_at
            """, (current_user_id, other_user_id, content))
            
            # Get the created message data
            if isinstance(message_id, dict):
                msg_id = message_id.get('id')
                created_at = message_id.get('created_at')
            else:
                msg_id = message_id
                created_at = None
        
        # Send notification (outside DB transaction)
        send_notification(other_user_id, 'message', current_user_id)
        
        # Emit message via WebSocket
        from app import socketio
        socketio.emit('new_message', {
            'id': msg_id,
            'sender_id': current_user_id,
            'receiver_id': other_user_id,
            'content': content,
            'created_at': created_at.isoformat() if created_at else None
        }, room=f'user_{other_user_id}')
        
        return jsonify({
            'message': 'Message sent',
            'data': {
                'id': msg_id,
                'sender_id': current_user_id,
                'receiver_id': other_user_id,
                'content': content,
                'created_at': created_at.isoformat() if created_at else None
            }
        }), 201
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to send message: {str(e)}'}), 500


@bp.route('/messages/<int:other_user_id>/read', methods=['PUT'])
@token_required
def mark_messages_read(current_user_id, other_user_id):
    """Mark all messages from a user as read."""
    try:
        with Database() as db:
            rows = db.query("""
                UPDATE messages SET is_read = TRUE
                WHERE sender_id = %s AND receiver_id = %s AND is_read = FALSE
            """, (other_user_id, current_user_id))
            
            return jsonify({
                'message': 'Messages marked as read',
                'count': rows if isinstance(rows, int) else 0
            }), 200
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to mark messages read: {str(e)}'}), 500


def _is_online(last_online):
    """Check if user is online (active within last 5 minutes)."""
    if not last_online:
        return False
    from datetime import datetime, timedelta
    threshold = datetime.utcnow() - timedelta(minutes=5)
    return last_online > threshold

