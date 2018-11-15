const bcrypt = require("bcryptjs");
const { promisify } = require("util");

const genSalt = promisify(bcrypt.genSalt);
const hash = promisify(bcrypt.hash);
const compare = promisify(bcrypt.compare);

exports.hash = function(password) {
    return genSalt().then(salt => {
        console.log(salt);
        return hash(password, salt);
    });
};

exports.compare = compare;

// bcrypt has 3 methods
// gensalt generates a random string
// compare - you pass a plain text password and a hash and it tells you if they match
// they all take callbacks so we're using promisify

// register.handlebars
// get route that renders the templates
// post route - will do a data base insert query. if it works you redirect somewhere
// else, you rerender the same template with an error message.
// b/f doing db query, you have to hash the password b/c that's what you want to put in the database
//req.body.password doesn't go in the database but you need to use it

// bcrypt.then the database insert
// if it works redirect to the petition
//
// // all routes
// // get petition
// if(!req.session.userId) {
//     res.redirect('/register');
// }
