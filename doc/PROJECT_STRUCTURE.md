# Flask Project Structure - Best Practices (Adapted for Matcha)

Based on Flask community best practices and the Application Factory Pattern, here's the recommended structure for the Matcha project:

## 📁 Recommended Project Structure

```
mathca/
├── app/
│   ├── __init__.py              # Application Factory (create_app function)
│   ├── db.py                    # Database wrapper class (Context Manager)
│   ├── auth.py                  # JWT decorator (@token_required)
│   │
│   ├── blueprints/              # Feature-based Blueprints
│   │   ├── __init__.py
│   │   ├── auth.py              # Authentication routes
│   │   │   # Routes: /api/auth/register, /api/auth/login, /api/auth/verify
│   │   │
│   │   ├── profile.py           # Profile management
│   │   │   # Routes: /api/profile/update, /api/profile/upload, /api/profile/location
│   │   │
│   │   ├── match.py             # Matching algorithm
│   │   │   # Routes: /api/match/suggestions, /api/match/search
│   │   │
│   │   ├── users.py             # User interactions
│   │   │   # Routes: /api/users/<id>, /api/like/<id>, /api/block/<id>
│   │   │
│   │   ├── chat.py              # Chat REST endpoints
│   │   │   # Routes: /api/chat/messages, /api/chat/send
│   │   │
│   │   └── notifications.py     # Notifications REST endpoints
│   │       # Routes: /api/notifications, /api/notifications/read
│   │
│   ├── utils/                   # Helper functions
│   │   ├── __init__.py
│   │   ├── email.py             # Email sending (SMTP)
│   │   ├── validation.py        # Input validation (email regex, password rules)
│   │   ├── geolocation.py       # IP geolocation helper
│   │   ├── file_upload.py       # Image upload validation (magic numbers)
│   │   └── matching.py          # Matching algorithm helpers (Haversine, scoring)
│   │
│   └── socketio/                # SocketIO event handlers
│       ├── __init__.py
│       ├── chat_events.py       # Chat socket events
│       └── notification_events.py  # Notification socket events
│
├── schema/
│   └── schema.sql               # Database schema (all CREATE TABLE statements)
│
├── scripts/
│   └── seed.py                  # Data seeding script (500 users)
│
├── static/
│   └── uploads/                 # User-uploaded images (UUID filenames)
│
├── config.py                    # Configuration classes (Dev, Prod, Test)
├── .env                         # Environment variables (DB credentials, JWT secret)
├── .env.example                 # Template for .env file
├── requirements.txt             # Python dependencies
├── app.py                       # Application entry point (runs create_app())
├── README.md                    # Project documentation
└── .gitignore                   # Git ignore rules
```

## 🏗️ Key Components Explained

### 1. **Application Factory Pattern** (`app/__init__.py`)
- Uses `create_app()` function to initialize Flask app
- Registers all Blueprints
- Initializes extensions (SocketIO, etc.)
- Loads configuration from `config.py`

### 2. **Blueprints** (`app/blueprints/`)
- Each Blueprint handles one feature domain
- Routes are organized by functionality
- URL prefixes: `/api/auth`, `/api/profile`, `/api/match`, etc.
- Keeps code modular and maintainable

### 3. **Database Layer** (`app/db.py`)
- Context Manager pattern (`with Database() as db:`)
- Parameterized queries only (prevents SQL injection)
- Returns dictionaries (not tuples) for JSON serialization

### 4. **Utils Directory** (`app/utils/`)
- Reusable helper functions
- Business logic separated from routes
- Easy to test independently

### 5. **SocketIO** (`app/socketio/`)
- Real-time event handlers separate from REST API
- Chat and notification events
- Authenticated via JWT on connection

## 📋 Why This Structure?

✅ **Modular**: Each feature is self-contained in a Blueprint  
✅ **Scalable**: Easy to add new features without touching existing code  
✅ **Testable**: Application Factory makes testing easier  
✅ **Maintainable**: Clear separation of concerns  
✅ **Flask Standard**: Follows Flask community best practices  
✅ **No ORM**: Perfect for raw SQL requirement  

## 🔄 Comparison with Django-style "Apps"

**Django Approach** (NOT for this project):
```
apps/
├── auth/
│   ├── models.py
│   ├── views.py
│   └── urls.py
├── profile/
│   └── ...
```

**Flask Blueprint Approach** (RECOMMENDED):
```
app/
├── blueprints/
│   ├── auth.py      # Routes only
│   └── profile.py   # Routes only
├── db.py            # Shared database layer
└── utils/           # Shared utilities
```

**Key Difference**: Flask Blueprints are lighter - they only organize routes, not models/views/urls like Django apps.

## 🚀 Next Steps

1. Create the directory structure
2. Set up `app/__init__.py` with Application Factory
3. Create `app/db.py` with Database class
4. Create first Blueprint (`auth.py`)
5. Register Blueprint in `create_app()`

This structure aligns with Flask best practices while meeting Matcha's requirements (no ORM, raw SQL, micro-framework).

