const spicedPg = require("spiced-pg");
let secrets;
process.env.NODE_ENV === 'production' ? secrets = process.env : secrets = require('./secrets');

const db = spicedPg(
    process.env.DATABASE_URL || `postgres:${secrets.dbUser}:${secrets.dbPass}@localhost:5432/petition`
);

// localhost 5432 - port we listen for db queries on
const bcrypt = require("./bcrypt");

exports.signatures = (signature, user_id) => {
    return db.query(
        `INSERT INTO signatures (signature, user_id)
        VALUES ($1, $2)
        RETURNING *`,
        [signature, user_id || null]
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
        );
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
        `SELECT users.first, users.last, users.email, up.age, up.city, up.url
        FROM users
        LEFT JOIN user_profiles AS up
        ON users.id = up.user_id
        WHERE users.id = $1`,
        [id]
    );
};

//DOING AN 'UPSERT' HERE (UPDATE & INSERT) - INSERT ROW IF IT DOESN'T EXIST AND UPDATE IF IT DOES
exports.updateProfile = (age, city, url, user_id) => {
    return db.query(
        `INSERT INTO user_profiles (age, city, url, user_id)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id)
        DO UPDATE SET age = $1, city = $2, url = $3`,
        [age, city, url, user_id]
    );
};

//UPDATE COMMAND SINCE USERS DEFINITELY HAVE A ROW IN TABLE
exports.updateUserWithPass = (user_id, first, last, email, pass) => {
    if (pass) {
        return db.query(
            `UPDATE users
            SET first = $2, last = $3, email = $4, pass = $5
            WHERE id = $1`,
            [user_id, first, last, email, pass]
        );
    }
};

//UPDATE COMMAND SINCE USERS DEFINITELY HAVE A ROW IN TABLE
//USER DID NOT SUBMIT PASSWORD, SO QUERY WILL NOT UPDATE PASSWORD
exports.updateUserWithoutPass = (user_id, first, last, email) => {
    return db.query(
        `UPDATE users
        SET first = $2, last = $3, email = $4
        WHERE id = $1`,
        [user_id, first, last, email]
    );
};

//
exports.deleteSig = id => {
    return db.query(
        `
        DELETE FROM signatures
        WHERE user_id = $1`,
        [id]
    );
};

exports.totalSigners = () => {
    return db.query(
        `SELECT COUNT(*)
        FROM signatures`
    );
};

exports.deleteAccount = id => {
    return db.query(`
        SELECT * FROM users
        INNER JOIN signatures
        ON users.id = signatures.user_id
        INNER JOIN user_profiles
        ON signatures.user_id = user_profiles.user_id
        `),
    [id];
};
