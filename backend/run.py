import os
from werkzeug.serving import run_simple
from app import create_app

app = create_app()

if __name__ == '__main__':
    debug_mode = os.getenv('FLASK_ENV') == 'development' or os.getenv('FLASK_DEBUG', '0') == '1'
    
    # Use stat reloader (polling) for Docker on Windows - more reliable than inotify
    # Werkzeug will automatically set WERKZEUG_RUN_MAIN in child process
    reloader_type = os.getenv('WERKZEUG_RELOADER_TYPE', 'stat') if debug_mode else None
    
    run_simple(
        hostname='0.0.0.0',
        port=5000,
        application=app,
        use_reloader=debug_mode,
        reloader_type=reloader_type,
        use_debugger=debug_mode
    )




