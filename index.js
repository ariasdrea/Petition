const express = require("express");
const app = express();
const ca = require("chalk-animation");
const hb = require("express-handlebars");
const db = require("./db");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const csurf = require("csurf");

// ------------ DO NOT TOUCH ------------
app.engine("handlebars", hb());
app.set("view engine", "handlebars");
// ------------ DO NOT TOUCH ------------
app.use(express.static("./public"));

// --------- SECURITY PROTECTION -----------
app.use(
    cookieSession({
        secret: `always hungry`,
        maxAge: 1000 * 60 * 60 * 24 * 14
    })
);
app.use(
    bodyParser.urlencoded({
        extended: false
    })
);

app.use(csurf());

//express adds to every response an object prop called locals. This middleware ensures token is available in all templates.
app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use((req, res, next) => {
    res.setHeader("X-Frame-Options", "DENY");
    next();
});

app.disable("x-powered-by");
// --------- SECURITY PROTECTION -----------

//------------- HOMEPAGE ROUTES ---------------
app.get("/", (req, res) => {
    res.redirect("/about");
});

app.get("/about", (req, res) => {
    res.render("about");
});

app.post("/about", (req, res) => {
    res.redirect("/register");
});

//------------- REGISTER ---------------
app.get("/register", (req, res) => {
    res.render("register", {
        layout: "main"
    });
});

app.post("/register", (req, res) => {
    db.hashedPassword(req.body.pass).then(function(hash) {
        return db
            .createUser(req.body.first, req.body.last, req.body.email, hash)
            .then(result => {
                req.session.userId = result.rows[0].id;
                req.session.first = result.rows[0].first;
                req.session.last = result.rows[0].last;
            })
            .then(() => {
                res.redirect("/profile");
            })
            .catch(err => {
                res.render("register", {
                    layout: "main",
                    error: err
                });
            });
    });
});

//------------- LOGIN ---------------
app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", (req, res) => {
    db.getUser(req.body.email).then(rows => {
        return db
            .checkPassword(req.body.pass, rows[0].pass)
            .then(function(result) {
                if (result == true) {
                    req.session.first = rows[0].first;
                    req.session.last = rows[0].last;
                    req.session.userId = rows[0].userid;
                    req.session.sigId = rows[0].sigid;
                    if (!req.session.sigId) {
                        res.redirect("/petition");
                    } else {
                        res.redirect("/thanks");
                    }
                }
            })
            .catch(function(err) {
                console.log("error in LOGIN POST:", err);
                res.redirect("/login");
            });
    });
});

//------------- USER PROFILE ---------------
app.get("/profile", (req, res) => {
    res.render("profile");
});

app.post("/profile", (req, res) => {
    return db
        .profile(req.body.age, req.body.city, req.body.url, req.session.userId)
        .then(() => {
            res.redirect("/petition");
        })
        .catch(err => {
            console.log("error in PROFILE POST:", err);
            res.redirect("/profile");
        });
});

// EDIT PROFILE & POPULATE FIELDS
app.get("/edit", function(req, res) {
    const userId = req.session.userId;
    db.populateInfo(userId)
        .then(function(results) {
            res.render("editprofile", {
                layout: "main",
                profile: results.rows[0]
            });
        })
        .catch(function(err) {
            console.log("error in EDIT GET:", err);
        });
});

app.post("/edit", function(req, res) {
    const userId = req.session.userId;
    let first = req.body.first;
    let last = req.body.last;
    let email = req.body.email;
    let pass = req.body.password;
    let age = req.body.age;
    let city = req.body.city;
    let url = req.body.homepage;

    if (pass) {
        db.hashedPassword(pass)
            .then(function(hash) {
                Promise.all([
                    db.updateUserWithPass(first, last, email, hash, userId),
                    db.updateProfile(age, city, url, userId)
                ]);
            })
            .then(function() {
                res.redirect("/petition");
            })
            .catch(function(err) {
                console.log("Error in IF - EDIT POST:", err);
            });
    } else {
        Promise.all([
            db.updateUserWithoutPass(userId, first, last, email),
            db.updateProfile(age, city, url, userId)
        ])
            .then(function() {
                res.redirect("/petition");
            })
            .catch(function(err) {
                console.log("Error in ELSE - EDIT POST:", err);
            });
    }
});

//------------- PETITION / SIGNATURE ---------------
app.get("/petition", (req, res) => {
    if (!req.session.sigId) {
        res.render("petition", {
            layout: "main"
        });
    } else {
        res.redirect("/thanks");
    }
});

app.post("/petition", (req, res) => {
    db.signatures(req.body.signature, req.session.userId)
        .then(result => {
            req.session.sigId = result.rows[0].id;
            res.redirect("/thanks");
        })
        .catch(err => {
            console.log("error in PETITION POST:", err);
            res.render("petition", {
                layout: "main",
                error: "error"
            });
        });
});

//------------- DELETE SIGNATURE ---------------

app.post("/signature/delete", (req, res) => {
    console.log("req.session.userId in DELETE POST:", req.session.userId);

    return db
        .deleteSig(req.session.userId)
        .then(() => {
            req.session.sigId = null;
            res.redirect("/petition");
        })
        .catch(err => {
            console.log("error in DELETE SIG POST:", err);
            res.redirect("/thanks");
        });
});

//------------- THANK YOU PAGE ---------------
app.get("/thanks", (req, res) => {
    db.showSignature(req.session.sigId)
        .then(result => {
            res.render("thanks", {
                layout: "main",
                first: req.session.first,
                signature: result.rows[0].signature
            });
        })
        .catch(err => {
            console.log("error in showsignature:", err);
        });
});

app.post("/thanks", (req, res) => {
    res.redirect("/edit");
});

//------------- LIST OF SIGNERS ---------------
app.get("/signers", (req, res) => {
    db.signers()
        .then(result => {
            res.render("signers", {
                layout: "main",
                signers: result.rows
            });
        })
        .catch(err => {
            console.log("error in signers:", err);
        });
});

app.get("/signers/:city", (req, res) => {
    db.cities(req.params.city).then(result => {
        res.render("cities", {
            layout: "main",
            citysigner: result.rows,
            city: req.params.city
        }).catch(err => {
            console.log("err in db.cities:", err);
            res.redirect("/signers");
        });
    });
});

//------------- LOGOUT FEATURE ---------------
app.get("/logout", (req, res) => {
    req.session = null;
    res.redirect("/register");
});

app.listen(process.env.PORT || 8080, function() {
    ca.rainbow("Listening:");
});
