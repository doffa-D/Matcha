from flask import Flask
from config import Config


def create_app():
    """Application factory pattern for Flask"""
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Register blueprints
    from app.blueprints.auth import bp as auth_bp
    from app.blueprints.profile import bp as profile_bp
    from app.blueprints.tags import bp as tags_bp
    from app.blueprints.users import bp as users_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(profile_bp)
    app.register_blueprint(tags_bp)
    app.register_blueprint(users_bp)
    return app

