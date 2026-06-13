-- Add migration script here



-- workspace for users
CREATE TABLE IF NOT EXISTS workspaces (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(32) NOT NULL UNIQUE,
    owner_id BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users
    ADD COLUMN ws_id BIGINT REFERENCES workspaces(id);

-- add super user and default workspace
BEGIN;
INSERT INTO users (id, fullname, email, password_hash)
VALUES (0, 'Super User', 'superuser@example.com', '');
INSERT INTO workspaces (id, name, owner_id) VALUES (0, 'none', 0);
UPDATE users SET ws_id = 0 WHERE id = 0;
COMMIT;


ALTER TABLE users
    ALTER COLUMN ws_id SET NOT NULL;
