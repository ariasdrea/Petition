//next is a function we have to call in every single middleware function we ever write. if we don't call next, we get trapped in the middleware function

module.exports = {
    requireLoggedInUser,
    requireLoggedOutUser,
    requireSignature,
    requireNoSignature
};

function requireLoggedInUser(req, res, next) {
    if (!req.session.userId && req.url != '/register' && req.url != '/login') {
        return res.redirect('/register');
    } else {
        next();
    }
}

function requireLoggedOutUser (req, res, next) {
    if (req.session.userId) {
        return res.redirect('/petition');
    } else {
        next();
    }
}

function requireSignature(req, res, next) {
    if (!req.session.sigId && req.url !='/petition') {
        return res.redirect('/petition');
    } else {
        next();
    }
}

function requireNoSignature(req, res, next) {
    if (req.session.sigId && req.url !='/thanks') {
        return res.redirect('/thanks');
    } else {
        next();
    }
}
