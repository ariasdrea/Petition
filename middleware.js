//Will check for signatureId
//next is a function we have to call in every single middleware function we ever write. if we don't call next, we get trapped in the middleware function

//export it as an object b/c it allows us to export multiple functions at the same time.
module.exports = {
    requireNoSignature
};

function requireNoSignature(req, res, next) {
    if (req.session.signatureId) {
        //if signatureId exists, this if block will run
        // if it doesn't exist, then it will be undefined which is falsey and proceed to else statement
        res.redirect("/petition/signed"); //thank you route
    } else {
        next();
    }
}

//if we don't call next, if user has sigId we will redirect them to thank you route. But if there is no sigId, if block will not run and server won't move on to the rest of the code.

/////////////////////////////////////////////

// module.exports = {
//     requireLoggedInUser,
//     requireLoggedOutUser,
//     requireSignature,
//     requireNoSignature
// };
//
// function requireLoggedInUser(req, res, next) {
//     if (!req.session.userId && req.url != '/register' && req.url != '/login') {
//         return res.redirect('/register');
//     }
//     next();
// }
//
// function requireLoggedOutUser(req, res, next) {
//     if (req.session.userId) {
//         return res.redirect('/petition');
//     }
//     next();
// }
//
// function requireSignature(req, res, next) {
//     if (!req.session.sigId) {
//         return res.redirect('/petition');
//     }
//     next();
// }
//
// function requireNoSignature(req, res, next) {
//     if (req.session.sigId) {
//         return res.redirect('/thanks');
//     }
//     next();
// }
