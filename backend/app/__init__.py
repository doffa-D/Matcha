from flask import Flask
from flask_socketio import SocketIO
from flask_cors import CORS
from config import Config
import os

# Global SocketIO instance
socketio = SocketIO()


def create_app():
    """Application factory pattern for Flask"""
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    static_folder = os.path.join(backend_dir, 'static')
    
    app = Flask(__name__, static_folder=static_folder, static_url_path='/static')
    app.config.from_object(Config)
    
    # Enable CORS for frontend
    CORS(app, resources={r"/api/*": {"origins": Config.CORS_ORIGINS}}, supports_credentials=True)
    
    # Initialize SocketIO
    socketio.init_app(app, cors_allowed_origins="*")
    
    # Register blueprints
    from app.blueprints.auth import bp as auth_bp
    from app.blueprints.profile import bp as profile_bp
    from app.blueprints.tags import bp as tags_bp
    from app.blueprints.users import bp as users_bp
    from app.blueprints.browsing import bp as browsing_bp
    from app.blueprints.notifications import bp as notifications_bp
    from app.blueprints.chat import bp as chat_bp
    from app.blueprints.dates import bp as dates_bp

    app.register_blueprint(notifications_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(profile_bp)
    app.register_blueprint(tags_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(browsing_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(dates_bp)
    
    # Register Socket.IO events
    from app.sockets import events
    
    return app
