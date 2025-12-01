-- Migration: Add chat (messages table) and profile picture flag
-- Run this after deploying new code

-- Add is_profile_pic column to images table if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'images' AND column_name = 'is_profile_pic'
    ) THEN
        ALTER TABLE images ADD COLUMN is_profile_pic BOOLEAN DEFAULT FALSE;
        CREATE INDEX idx_images_profile_pic ON images(user_id, is_profile_pic) WHERE is_profile_pic = TRUE;
    END IF;
END $$;


-- Create messages table if not exists
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT no_self_message CHECK (sender_id != receiver_id)
);

-- Create indexes for messages (if table was just created)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'idx_messages_sender_id'
    ) THEN
        CREATE INDEX idx_messages_sender_id ON messages(sender_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'idx_messages_receiver_id'
    ) THEN
        CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'idx_messages_conversation'
    ) THEN
        CREATE INDEX idx_messages_conversation ON messages(
            LEAST(sender_id, receiver_id), 
            GREATEST(sender_id, receiver_id), 
            created_at DESC
        );
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'idx_messages_unread'
    ) THEN
        CREATE INDEX idx_messages_unread ON messages(receiver_id, is_read) WHERE is_read = FALSE;
    END IF;
END $$;


-- Update notifications table constraint to include all types
-- First drop the old constraint if exists, then add new one
DO $$
BEGIN
    -- Try to drop old constraint
    ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
    
    -- Add new constraint with all notification types
    ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
        CHECK (type IN ('like', 'visit', 'message', 'match', 'unlike'));
EXCEPTION
    WHEN others THEN
        NULL; -- Ignore if constraint already correct
END $$;


-- Done
SELECT 'Migration 002 complete: Added messages table and is_profile_pic column' as status;

