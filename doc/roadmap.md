This is the definitive, granular roadmap for the **Web Matcha** project. It is structured to prevent technical debt; do not skip steps.

### Phase 0: Architecture & Database (The Skeleton)
**Goal:** Establish a secure connection to the database using Raw SQL.

1.  **Project Initialization**
    * Set up a Python virtual environment (`venv`).
    * Install dependencies: `Flask`, `psycopg2-binary` (or `mysql-connector`), `python-dotenv`, `PyJWT`, `Flask-SocketIO`, `Faker`.
    * Create `.env` file for DB credentials and JWT secret key.
2.  **Database Wrapper (`db.py`)**
    * Create a class `Database`.
    * Implement `__enter__` and `__exit__` methods (Context Manager) to handle connections automatically.
    * **CRITICAL:** Implement a `query(sql, params)` method. It **must** accept a tuple for parameters to prevent SQL injection.
3.  **Schema Design (`schema.sql`)**
    * Write the SQL script to create tables:
        * `users` (include `lat`, `long`, `fame_rating`, `verified`).
        * `tokens` (for email verification/password reset).
        * `images` (limit 5 per user).
        * `tags` & `user_tags` (Many-to-Many relationship).
        * `likes`, `blocks`, `visits` (Interaction history).
        * `messages`, `notifications`.
    * 

[Image of relational database schema for dating app]


---

### Phase 1: Authentication (The Gatekeeper)
**Goal:** Secure user entry. No libraries like `Flask-Login`.

1.  **Registration**
    * **Endpoint:** `POST /api/auth/register`.
    * **Validation:** Check regex for email/password. Ensure age > 18.
    * **Logic:** Hash password (`bcrypt`). Insert into `users`. Generate a random string token.
    * **Email:** Send an HTML email containing `http://localhost/verify/<token>`.
2.  **Verification**
    * **Endpoint:** `GET /api/auth/verify/<token>`.
    * **Logic:** Check if token exists in DB. Update `users` table to set `verified = 1`.
3.  **Login**
    * **Endpoint:** `POST /api/auth/login`.
    * **Logic:** Verify hash. If valid, sign a **JWT** payload (`user_id`, `exp`). Return token to client.
4.  **Middleware/Decorator**
    * Create a `@token_required` wrapper function that checks the `Authorization` header on protected routes.

---

### Phase 2: User Profile (The Identity)
**Goal:** Users populate data required for the algorithm.

1.  **Onboarding**
    * **Endpoint:** `PUT /api/profile/update`.
    * **Fields:** Gender, Sexual Preference (Bi/Gay/Straight), Bio.
2.  **Tag Logic (Complex SQL)**
    * Input: List of strings `["#vegan", "#gym"]`.
    * **Logic:**
        * Loop through tags.
        * `INSERT IGNORE` into `tags` table.
        * Get `tag_id`.
        * Insert into `user_tags` table.
3.  **Image Handling**
    * **Endpoint:** `POST /api/profile/upload`.
    * **Security:** Check **Magic Numbers** (File headers) to ensure it is a real image. Rename file (UUID). Save to disk. Store path in DB.
4.  **Geolocation**
    * **Endpoint:** `PUT /api/profile/location`.
    * **Logic:** If frontend sends GPS -> Store it. If frontend sends null -> Use `ip-api.com` to resolve request IP to Lat/Long.

---

### Phase 3: Data Seeding (Mandatory Prerequisite)
**Goal:** You cannot build the matching algorithm without data.

1.  **The Script (`seed.py`)**
    * Initialize `Faker`.
    * **Loop 500 times:**
        * Create user (hashed password can be the same for all for speed).
        * **Crucial:** Generate `lat`/`long` within a 50km radius of a specific coordinate (e.g., Central Park or Paris) using random offsets.
        * Assign 1-5 random tags from a pre-defined list.
        * Insert random "Likes" between users to generate `fame_rating`.

---

### Phase 4: The Matching Algorithm (The Core)
**Goal:** The "Browsing" page.

1.  **Fame Rating System**
    * Define formula: `(Likes / Visits) + (Tags / 10)`. Implement a function to update this column.
2.  **The "Browsing" Query (`GET /api/match/suggestions`)**
    * **Filter:**
        * `WHERE gender = target_gender` (Handle Bisexual logic).
        * `AND id NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id = me)`.
    * **Score (SQL Math):**
        * Calculate Distance (Haversine formula).
        * Calculate Tag Overlap (Count matching `user_tags`).
        * Fetch Fame Rating.
    * **Sort:** Order by the weighted score of the above three factors.
3.  **Search/Filter**
    * Allow query params: `?min_age=20&max_dist=100`.
    * Append `AND` clauses to your base SQL query dynamically.

---

### Phase 5: Social Interactions
**Goal:** Connecting users.

1.  **Profile View**
    * `GET /api/users/<id>`.
    * Insert row into `visits` table.
    * Return profile data + boolean `liked_by_me` + boolean `connected`.
2.  **Liking & Matching**
    * `POST /api/like/<id>`.
    * Insert into `likes`.
    * **Check Match:** Query `SELECT * FROM likes WHERE liker_id = <target> AND liked_id = <me>`.
    * If result exists -> Update relationship status to "Matched".
3.  **Blocking**
    * `POST /api/block/<id>`.
    * Insert into `blocks`.
    * **Constraint:** Ensure this user ID never appears in search results again.

---

### Phase 6: Real-Time Features (SocketIO)
**Goal:** Chat and Notifications.

1.  **Initialization**
    * Client connects -> Authenticate via JWT -> Join Room `user_<my_id>`.
2.  **Notifications**
    * Create helper function `notify(target_id, type, message)`.
    * Saves to `notifications` table (Persistence).
    * Emits Socket event to `user_<target_id>` room (Real-time).
    * Trigger this on: Like, Visit, Match, Unmatch.
3.  **Chat**
    * **Constraint:** Check `if connected == True` before allowing message.
    * Save message to `messages` table.
    * Emit to recipient's room.

---

### Phase 7: Security Audit & Defense
**Goal:** Pass the evaluation.

1.  **Injection Audit:** Search user input code. Ensure **NO** f-strings in SQL execution.
2.  **XSS Audit:** Ensure the frontend (React/Vue) escapes HTML by default. If using backend templating (Jinja2), use `| safe` only where strictly necessary.
3.  **File Uploads:** Try to upload a `.php` or `.sh` file. Ensure the backend rejects it.
4.  **Data Privacy:** Ensure `/api/users/<id>` never returns the target's email or password hash.