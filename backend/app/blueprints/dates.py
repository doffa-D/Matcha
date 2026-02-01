from flask import Blueprint, request, jsonify
from app.db import Database
from app.jwt import token_required
from app.sockets.events import send_notification
from datetime import datetime

bp = Blueprint('dates', __name__, url_prefix='/api/dates')


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


@bp.route('/<int:other_user_id>', methods=['POST'])
@token_required
def propose_date(current_user_id, other_user_id):
    """
    Propose a date to another user.
    Only works if users are connected (mutual like).
    
    Request body:
        {
            "date_time": "2026-02-14T19:00:00",
            "location": "Cafe Matcha",
            "activity": "Coffee"
        }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body required'}), 400
        
        # Validate required fields
        required_fields = ['date_time', 'location', 'activity']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'{field} is required'}), 400
        
        date_time_str = data['date_time'].strip()
        location = data['location'].strip()
        activity = data['activity'].strip()
        
        # Validate date_time format and future date
        try:
            date_time = datetime.fromisoformat(date_time_str.replace('Z', '+00:00'))
            if date_time < datetime.now():
                return jsonify({'error': 'Date must be in the future'}), 400
        except ValueError:
            return jsonify({'error': 'Invalid date_time format. Use ISO format (e.g., 2026-02-14T19:00:00)'}), 400
        
        # Validate lengths
        if len(location) > 255:
            return jsonify({'error': 'Location too long (max 255 characters)'}), 400
        if len(activity) > 100:
            return jsonify({'error': 'Activity too long (max 100 characters)'}), 400
        
        if current_user_id == other_user_id:
            return jsonify({'error': 'Cannot propose a date to yourself'}), 400
        
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
                return jsonify({'error': 'You must be connected to propose a date'}), 403
            
            # Check if blocked
            if is_blocked(db, current_user_id, other_user_id):
                return jsonify({'error': 'Cannot propose a date to blocked user'}), 403
            
            # Insert date proposal
            result = db.query("""
                INSERT INTO date_proposals (sender_id, receiver_id, date_time, location, activity)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id, created_at
            """, (current_user_id, other_user_id, date_time, location, activity))
            
            # Get the created proposal data
            if isinstance(result, dict):
                proposal_id = result.get('id')
                created_at = result.get('created_at')
            elif isinstance(result, list) and len(result) > 0:
                proposal_id = result[0].get('id')
                created_at = result[0].get('created_at')
            else:
                proposal_id = result
                created_at = datetime.now()
        
        # Send notification (outside DB transaction)
        send_notification(other_user_id, 'date_proposal', current_user_id)
        
        # Emit via WebSocket
        from app import socketio
        socketio.emit('new_date_proposal', {
            'id': proposal_id,
            'sender_id': current_user_id,
            'receiver_id': other_user_id,
            'date_time': date_time.isoformat(),
            'location': location,
            'activity': activity,
            'status': 'pending',
            'created_at': created_at.isoformat() if created_at else None
        }, room=f'user_{other_user_id}')
        
        return jsonify({
            'message': 'Date proposal sent',
            'data': {
                'id': proposal_id,
                'sender_id': current_user_id,
                'receiver_id': other_user_id,
                'date_time': date_time.isoformat(),
                'location': location,
                'activity': activity,
                'status': 'pending',
                'created_at': created_at.isoformat() if created_at else None
            }
        }), 201
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to propose date: {str(e)}'}), 500


@bp.route('/<int:proposal_id>/respond', methods=['PUT'])
@token_required
def respond_to_date(current_user_id, proposal_id):
    """
    Respond to a date proposal (accept or decline).
    Only the receiver can respond.
    
    Request body:
        {"status": "accepted"} or {"status": "declined"}
    """
    try:
        data = request.get_json()
        if not data or 'status' not in data:
            return jsonify({'error': 'Status is required'}), 400
        
        status = data['status'].strip().lower()
        if status not in ['accepted', 'declined']:
            return jsonify({'error': 'Status must be "accepted" or "declined"'}), 400
        
        with Database() as db:
            # Get the proposal
            proposal = db.query(
                """SELECT id, sender_id, receiver_id, date_time, location, activity, status
                   FROM date_proposals WHERE id = %s""",
                (proposal_id,)
            )
            
            if not proposal:
                return jsonify({'error': 'Date proposal not found'}), 404
            
            proposal = proposal[0] if isinstance(proposal, list) else proposal
            
            # Check if current user is the receiver
            if proposal['receiver_id'] != current_user_id:
                return jsonify({'error': 'Only the receiver can respond to this proposal'}), 403
            
            # Check if already responded
            if proposal['status'] != 'pending':
                return jsonify({'error': f'This proposal has already been {proposal["status"]}'}), 400
            
            # Update status
            db.query(
                """UPDATE date_proposals 
                   SET status = %s, updated_at = CURRENT_TIMESTAMP
                   WHERE id = %s""",
                (status, proposal_id)
            )
        
        # Send notification to sender
        send_notification(proposal['sender_id'], f'date_{status}', current_user_id)
        
        # Emit via WebSocket
        from app import socketio
        socketio.emit('date_proposal_updated', {
            'id': proposal_id,
            'status': status,
            'updated_at': datetime.now().isoformat()
        }, room=f'user_{proposal["sender_id"]}')
        
        return jsonify({
            'message': f'Date proposal {status}',
            'data': {
                'id': proposal_id,
                'status': status
            }
        }), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to respond to date: {str(e)}'}), 500


@bp.route('/conversation/<int:other_user_id>', methods=['GET'])
@token_required
def get_date_proposals(current_user_id, other_user_id):
    """
    Get all date proposals in a conversation with another user.
    Returns proposals in chronological order.
    """
    try:
        with Database() as db:
            # Check if connected
            if not are_connected(db, current_user_id, other_user_id):
                return jsonify({'error': 'You must be connected to view date proposals'}), 403
            
            # Check if blocked
            if is_blocked(db, current_user_id, other_user_id):
                return jsonify({'error': 'Cannot view date proposals with blocked user'}), 403
            
            # Get all proposals between these users
            proposals = db.query("""
                SELECT id, sender_id, receiver_id, date_time, location, activity, status, created_at, updated_at
                FROM date_proposals
                WHERE (sender_id = %s AND receiver_id = %s)
                   OR (sender_id = %s AND receiver_id = %s)
                ORDER BY created_at ASC
            """, (current_user_id, other_user_id, other_user_id, current_user_id))
            
            # Format response
            formatted = [
                {
                    'id': p['id'],
                    'sender_id': p['sender_id'],
                    'receiver_id': p['receiver_id'],
                    'date_time': p['date_time'].isoformat() if p['date_time'] else None,
                    'location': p['location'],
                    'activity': p['activity'],
                    'status': p['status'],
                    'is_mine': p['sender_id'] == current_user_id,
                    'created_at': p['created_at'].isoformat() if p['created_at'] else None,
                    'updated_at': p['updated_at'].isoformat() if p['updated_at'] else None
                }
                for p in proposals
            ]
            
            return jsonify({'proposals': formatted}), 200
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to get date proposals: {str(e)}'}), 500
