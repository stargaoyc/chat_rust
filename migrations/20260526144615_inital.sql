-- Add migration script here
-- postgres database initialization script
-- create user table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    ws_id BIGINT NOT NULL,
    fullname VARCHAR(64) NOT NULL UNIQUE,
    -- hashed argon2 password
    password_hash VARCHAR(97) NOT NULL,
    email VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- workspace for users
CREATE TABLE IF NOT EXISTS workspaces (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(32) NOT NULL UNIQUE,
    owner_id BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- add super user and default workspace
BEGIN;
INSERT INTO users (id, ws_id, fullname, email, password_hash)
VALUES (0, 0, 'Super User', 'superuser@example.com', '');
INSERT INTO workspaces (id, name, owner_id) VALUES (0, 'none', 0);
COMMIT;

-- add foreign key constraint for ws_id for users table
ALTER TABLE users
    ADD CONSTRAINT fk_users_ws_id FOREIGN KEY (ws_id) REFERENCES workspaces(id);

---- create index on email for user table
CREATE INDEX IF NOT EXISTS email_idx ON users (email);

-- create chat type
CREATE TYPE chat_type AS ENUM ('single', 'group', 'public_channel', 'private_channel');

-- create chat table
CREATE TABLE IF NOT EXISTS chats (
    id BIGSERIAL PRIMARY KEY,
    ws_id BIGINT NOT NULL REFERENCES workspaces(id),
    name VARCHAR(64),
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
    files TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- create index on chat_id for messages table
CREATE INDEX IF NOT EXISTS chat_id_idx ON messages (chat_id, created_at DESC);

-- create index on sender_id for messages table
CREATE INDEX IF NOT EXISTS sender_id_idx ON messages (sender_id, created_at DESC);
