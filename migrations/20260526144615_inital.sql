-- Add migration script here
-- postgres database initialization script
-- create user table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    fullname VARCHAR(64) NOT NULL UNIQUE,
    -- hashed argon2 password
    password VARCHAR(64) NOT NULL,
    email VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- create index on email for user table
CREATE INDEX IF NOT EXISTS email_idx ON users (email);

-- create chat type
CREATE TYPE chat_type AS ENUM ('single', 'group', 'public_channel', 'private_channel');

-- create chat table
CREATE TABLE IF NOT EXISTS chats (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(128) NOT NULL UNIQUE,
    type chat_type NOT NULL,
    members BIGINT[] NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- create message table
CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    chat_id BIGINT NOT NULL REFERENCES chats(id),
    sender_id BIGINT NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    images TEXT[],
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- create index on chat_id for messages table
CREATE INDEX IF NOT EXISTS chat_id_idx ON messages (chat_id, created_at DESC);

-- create index on sender_id for messages table
CREATE INDEX IF NOT EXISTS sender_id_idx ON messages (sender_id, created_at DESC);
