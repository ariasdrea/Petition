-- if a change is made to the table, dropping the table will delete the old table and replace it with the new table
DROP TABLE IF EXISTS signatures;
DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS users;

-- For Registration
CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    first VARCHAR(200) NOT NULL,
    last VARCHAR(200) NOT NULL,
    email VARCHAR(200) NOT NULL UNIQUE CHECK (email <> ''),
    pass VARCHAR(200) NOT NULL,
    ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
--

CREATE TABLE signatures(
    id SERIAL PRIMARY KEY,
    signature TEXT NOT NULL,
    -- this links the signature to the correct user via id
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id),
    ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_profiles(
    id SERIAL PRIMARY KEY,
    age INTEGER,
    city VARCHAR(200),
    url VARCHAR(300),
    -- this links the age, city, etc to the correct user via id
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id)
);
