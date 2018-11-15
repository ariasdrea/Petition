DROP TABLE IF EXISTS signatures;
DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS users;

CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    first VARCHAR(200) NOT NULL,
    last VARCHAR(200) NOT NULL,
    email VARCHAR(200) NOT NULL UNIQUE CHECK (email <> ''),
    pass VARCHAR(200) NOT NULL,
    ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE signatures(
    id SERIAL PRIMARY KEY,
    signature TEXT NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id),
    ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_profiles(
    id SERIAL PRIMARY KEY,
    age INTEGER,
    city VARCHAR(200),
    url VARCHAR(300),
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id)
);

-- deleting
-- DELETE FROM singers WHERE name = "Taylor Swift";
--
-- UPDATE singers
-- SET name = 'Celine Dion', age = 100 (column name = value)
-- WHERE name = 'Taylor Swift'
