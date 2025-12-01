from flask import Flask
from flask_socketio import SocketIO
from config import Config

# Global SocketIO instance
socketio = SocketIO()


def create_app():
    """Application factory pattern for Flask"""
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Initialize SocketIO
    socketio.init_app(app, cors_allowed_origins="*")
    
    # Register blueprints
    from app.blueprints.auth import bp as auth_bp
    from app.blueprints.profile import bp as profile_bp
    from app.blueprints.tags import bp as tags_bp
    from app.blueprints.users import bp as users_bp
    from app.blueprints.browsing import bp as browsing_bp
    from app.blueprints.notifications import bp as notifications_bp

    app.register_blueprint(notifications_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(profile_bp)
    app.register_blueprint(tags_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(browsing_bp)
    
    # Register Socket.IO events
    from app.sockets import events
    
    return app
