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
    }
    next();
}

function requireLoggedOutUser(req, res, next) {
    if (req.session.userId) {
        return res.redirect('/petition');
    }
    next();
}

function requireSignature(req, res, next) {
    if (!req.session.sigId) {
        return res.redirect('/petition');
    }
    next();
}

function requireNoSignature(req, res, next) {
    if (req.session.sigId) {
        return res.redirect('/thanks');
    }
    next();
}
