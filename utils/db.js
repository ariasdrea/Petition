const spicedPg = require("spiced-pg");
//DATABASE URL ON LOCAL MACHINE

// DATABASE URL FOR HEROKU
const db = spicedPg(
    process.env.DATABASE_URL ||
        "postgres:postgres:postgres@localhost:5432/petition"
);

const bcrypt = require("./bcrypt");

exports.signatures = (signature, user_id) => {
    return db.query(
        `INSERT INTO signatures (signature, user_id)
            VALUES ($1, $2)
            RETURNING *`,
        [signature || null, user_id || null]
    );
};

// LIST OF SIGNERS
exports.signers = () => {
    return db
        .query(
            `SELECT first, last, age, city, url FROM signatures
            LEFT JOIN users
            ON users.id = signatures.user_id
            LEFT JOIN user_profiles
            ON user_profiles.user_id = signatures.user_id`
        )
        .then(signer => {
            return signer;
        });
};

exports.cities = city => {
    return db.query(
        `SELECT first, last, age, url FROM signatures
        LEFT JOIN users
        ON users.id = signatures.user_id
        LEFT JOIN user_profiles
        ON user_profiles.user_id = signatures.user_id
        WHERE LOWER(city) = LOWER($1)`,
        [city]
    );
};

// SHOWS SIG
exports.showSignature = id => {
    return db.query(`SELECT signature FROM signatures WHERE id = $1`, [id]);
};

//REGISTER USERS
exports.createUser = (first, last, email, pass) => {
    return db.query(
        `INSERT INTO users (first, last, email, pass)
        VALUES ($1, $2, $3, $4)
        RETURNING id, first, last`,
        [first || null, last || null, email || null, pass || null]
    );
};

// GET USER BY EMAIL ADDRESS
exports.getUser = email => {
    return db
        .query(
            `SELECT first, last, users.id AS userId, signatures.id AS sigId, pass
         FROM users
         LEFT JOIN signatures
         ON users.id = signatures.user_id
         WHERE email = $1`,
            [email]
        )
        .then(result => {
            return result.rows;
        });
};

// HASHING PASSWORDS
exports.hashedPassword = pass => {
    return bcrypt.hash(pass);
};

// CHECK/COMPARE PASSWORDS
exports.checkPassword = (pass, hash) => {
    return bcrypt.compare(pass, hash);
};

// PROFILE PAGE
exports.profile = (age, city, url, user_id) => {
    return db.query(
        `INSERT INTO user_profiles(age, city, url, user_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *`,
        [age || null, city || null, url || null, user_id || null]
    );
};

//SHOW USER INFO IN EDIT PROFILE
exports.populateInfo = id => {
    return db.query(
        `SELECT u.first, u.last, u.email, up.age, up.city, up.url
        FROM users AS u
        LEFT JOIN user_profiles AS up
        ON u.id = up.user_id
        WHERE u.id = $1`,
        [id]
    );
};

exports.updateProfile = (age, city, url, user_id) => {
    return db.query(
        `INSERT INTO user_profiles (age, city, url, user_id)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id)
        DO UPDATE SET age = $1, city = $2, url = $3`,
        [age, city, url, user_id]
    );
};

exports.updateUserWithPass = (user_id, first, last, email, pass) => {
    if (pass) {
        return db.query(
            `UPDATE users
            SET first = $2, last = $3, email = $4, pass = $5
            WHERE id = $1`,
            [user_id, first, last, email]
        );
    }
};

exports.updateUserWithoutPass = (user_id, first, last, email) => {
    return db.query(
        `UPDATE users
        SET first = $2, last = $3, email = $4
        WHERE id = $1`,
        [user_id, first, last, email]
    );
};
exports.deleteSig = id => {
    return db.query(
        `
        DELETE FROM signatures
        WHERE user_id = $1`,
        [id]
    );
};
