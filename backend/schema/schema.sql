CREATE TABLE users (

    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    bio TEXT,
    gender VARCHAR(50),
    sexual_preference VARCHAR(50),
    latitude DECIMAL(9, 6),
    longitude DECIMAL(9, 6),
    date_of_birth DATE,
    age INTEGER,
    fame_rating DECIMAL(4, 2) DEFAULT 0.00,
    is_verified BOOLEAN DEFAULT FALSE,
    last_online TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_gender ON users(gender);
CREATE INDEX idx_users_sexual_preference ON users(sexual_preference);
CREATE INDEX idx_users_location ON users(latitude, longitude);
CREATE INDEX idx_users_fame ON users(fame_rating DESC);
CREATE INDEX idx_users_verified ON users(is_verified);
CREATE INDEX idx_users_last_online ON users(last_online);
CREATE INDEX idx_users_date_of_birth ON users(date_of_birth);
CREATE INDEX idx_users_age ON users(age);


CREATE TABLE tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE, 
    type VARCHAR(20) NOT NULL CHECK (type IN ('verification', 'password_reset', 'blacklist')),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tokens_token ON tokens(token);
CREATE INDEX idx_tokens_user_id ON tokens(user_id);
CREATE INDEX idx_tokens_type ON tokens(type);
CREATE INDEX idx_tokens_expires ON tokens(expires_at);


CREATE TABLE images (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_path VARCHAR(500) NOT NULL,
    is_profile_pic BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_images_user_id ON images(user_id);
CREATE INDEX idx_images_profile_pic ON images(user_id, is_profile_pic) WHERE is_profile_pic = TRUE;


CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    tag_name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tags_tag_name ON tags(tag_name);


CREATE TABLE user_tags (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, tag_id)
);

CREATE INDEX idx_user_tags_user_id ON user_tags(user_id);
CREATE INDEX idx_user_tags_tag_id ON user_tags(tag_id);


CREATE TABLE visits (
    id SERIAL PRIMARY KEY,
    visitor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    visited_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    visit_count INTEGER DEFAULT 1
);

CREATE UNIQUE INDEX idx_visits_unique_daily ON visits (visitor_id, visited_id, DATE(timestamp));
CREATE INDEX idx_visits_visited_id ON visits(visited_id);
CREATE INDEX idx_visits_visitor_id ON visits(visitor_id);
CREATE INDEX idx_visits_timestamp ON visits(timestamp DESC);


-- After visits table (after line 89)

CREATE TABLE likes (
    id SERIAL PRIMARY KEY,
    liker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    liked_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_like UNIQUE (liker_id, liked_id),
    CONSTRAINT no_self_like CHECK (liker_id != liked_id)
);

CREATE INDEX idx_likes_liker_id ON likes(liker_id);
CREATE INDEX idx_likes_liked_id ON likes(liked_id);
CREATE INDEX idx_likes_created_at ON likes(created_at DESC);

CREATE TABLE blocks (
    id SERIAL PRIMARY KEY,
    blocker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_block UNIQUE (blocker_id, blocked_id),
    CONSTRAINT no_self_block CHECK (blocker_id != blocked_id)
);

CREATE INDEX idx_blocks_blocker_id ON blocks(blocker_id);
CREATE INDEX idx_blocks_blocked_id ON blocks(blocked_id);
CREATE INDEX idx_blocks_created_at ON blocks(created_at DESC);

CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_report UNIQUE (reporter_id, reported_id),
    CONSTRAINT no_self_report CHECK (reporter_id != reported_id)
);

CREATE INDEX idx_reports_reported_id ON reports(reported_id);
CREATE INDEX idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);



CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('like', 'visit', 'message', 'match', 'unlike')),
    source_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);


CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT no_self_message CHECK (sender_id != receiver_id)
);

CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_conversation ON messages(
    LEAST(sender_id, receiver_id), 
    GREATEST(sender_id, receiver_id), 
    created_at DESC
);
CREATE INDEX idx_messages_unread ON messages(receiver_id, is_read) WHERE is_read = FALSE;