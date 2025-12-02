from flask import Blueprint, request, jsonify
from app.db import Database
from app.jwt import token_required

bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')


@bp.route('', methods=['GET'])
@token_required
def get_notifications(current_user_id):
    """Get notifications list."""
    with Database() as db:
        notifs = db.query("""
            SELECT n.id, n.type, n.is_read, n.created_at,
                   u.id as from_id, u.username, u.first_name
            FROM notifications n
            LEFT JOIN users u ON n.source_user_id = u.id
            WHERE n.user_id = %s
            ORDER BY n.created_at DESC
            LIMIT 50
        """, (current_user_id,))
        
        return jsonify({
            'notifications': [
                {
                    'id': n['id'],
                    'type': n['type'],
                    'from_user': {'id': n['from_id'], 'username': n['username'], 'first_name': n['first_name']},
                    'is_read': n['is_read'],
                    'created_at': n['created_at'].isoformat() if n['created_at'] else None
                }
                for n in notifs
            ]
        }), 200


@bp.route('/unread/count', methods=['GET'])
@token_required
def get_unread_count(current_user_id):
    """Get unread count for badge."""
    with Database() as db:
        result = db.query(
            "SELECT COUNT(*) as count FROM notifications WHERE user_id = %s AND is_read = FALSE",
            (current_user_id,)
        )
        return jsonify({'unread_count': result[0]['count']}), 200


@bp.route('/<int:notif_id>/read', methods=['PUT'])
@token_required
def mark_read(current_user_id, notif_id):
    """Mark notification as read."""
    with Database() as db:
        db.query(
            "UPDATE notifications SET is_read = TRUE WHERE id = %s AND user_id = %s",
            (notif_id, current_user_id)
        )
        return jsonify({'message': 'Marked as read'}), 200