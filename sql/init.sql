-- postgres database initialization script
-- create user table
CREATE TABLE IF NOT EXISTS user (
    id BIGSERIAL PRIMARY KEY,
    fullname VARCHAR(64) NOT NULL UNIQUE,
    -- hashed argon2 password
    password VARCHAR(64) NOT NULL,
    email VARCHAR(64) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- create chat type
CREATE TYPE chat_type AS ENUM ('single', 'group', 'public_channel', 'private_channel');

-- create chat table
CREATE TABLE IF NOT EXISTS chats (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(128) NOT NULL UNIQUE,
    type chat_type NOT NULL,
    members BIGINT[] NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
);

-- create message table
CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    chat_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    images TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES user(id) ON DELETE CASCADE,
);

-- create index on chat_id for messages table
CREATE INDEX IF NOT EXISTS chat_id_idx ON messages (chat_id, created_at DESC);

-- create index on sender_id for messages table
CREATE INDEX IF NOT EXISTS sender_id_idx ON messages (sender_id);
