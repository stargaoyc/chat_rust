-- insert workspaces
INSERT INTO workspaces (name, owner_id)
 VALUES ('Workspace 1', 0),
 ('Workspace 2', 0),
 ('Workspace 3', 0);

-- insert users, all users have the same password hash for "testpassword"
INSERT INTO users (ws_id, fullname, email, password_hash)
 VALUES (1, 'User 1', 'user1@example.com', '$argon2id$v=19$m=19456,t=2,p=1$0ISe167Zjk+2GhDRC6V5GA$qUao/3PiyUo5a417VYLO4h/mY1g8z10nEWoCgR1aKaw'),
 (1, 'User 2', 'user2@example.com', '$argon2id$v=19$m=19456,t=2,p=1$0ISe167Zjk+2GhDRC6V5GA$qUao/3PiyUo5a417VYLO4h/mY1g8z10nEWoCgR1aKaw'),
 (1, 'User 3', 'user3@example.com', '$argon2id$v=19$m=19456,t=2,p=1$0ISe167Zjk+2GhDRC6V5GA$qUao/3PiyUo5a417VYLO4h/mY1g8z10nEWoCgR1aKaw'),
 (1, 'User 4', 'user4@example.com', '$argon2id$v=19$m=19456,t=2,p=1$0ISe167Zjk+2GhDRC6V5GA$qUao/3PiyUo5a417VYLO4h/mY1g8z10nEWoCgR1aKaw'),
 (1, 'User 5', 'user5@example.com', '$argon2id$v=19$m=19456,t=2,p=1$0ISe167Zjk+2GhDRC6V5GA$qUao/3PiyUo5a417VYLO4h/mY1g8z10nEWoCgR1aKaw');

-- insert chats
INSERT INTO chats (ws_id, name, type, members)
    VALUES (1, 'general', 'public_channel', '{1,2,3,4,5}'),
    (1, 'private', 'private_channel', '{1,2,3}');

-- insert unnamed chat
INSERT INTO chats (ws_id, type, members)
    VALUES (1, 'single', '{1,2}'),
    (1, 'group', '{1,3,4}');
