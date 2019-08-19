const express = require("express");
const app = (exports.app = express());
const ca = require("chalk-animation");
const hb = require("express-handlebars");
const db = require("./db");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const csurf = require("csurf");
const {
    // requireLoggedInUser,
    requireLoggedOutUser,
    requireSignature,
    requireNoSignature
} = require("./middleware");
// --------------- DO NOT TOUCH ---------------
app.engine("handlebars", hb());
app.set("view engine", "handlebars");
// --------------- DO NOT TOUCH ---------------
app.use(express.static("./public"));

// --------------- SECURITY PROTECTION ---------------
app.use(
    cookieSession({
        secret: `I'm always hungry`,
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
// --------------- SECURITY PROTECTION ---------------

///// IMPORTING FROM PROFILE.JS /////
// const profileRouter = "./routers/profile";
// app.use(profileRouter);

//will go inside profile router, did user use a get or post request ? If not, it will continue reading code in index.js
///// IMPORTING FROM PROFILE.JS /////

//------------- HOMEPAGE ---------------
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
app.get("/register", requireLoggedOutUser, (req, res) => {
    res.render("register", {
        layout: "main"
    });
});

app.post("/register", requireLoggedOutUser, (req, res) => {
    db.hashedPassword(req.body.pass).then(hash => {
        return db
            .createUser(req.body.first, req.body.last, req.body.email, hash)
            .then(result => {
                req.session.userId = result.rows[0].id;
                req.session.first = result.rows[0].first;
                req.session.last = result.rows[0].last;
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
app.get("/login", requireLoggedOutUser, (req, res) => {
    res.render("login");
});

app.post("/login", requireLoggedOutUser, (req, res) => {
    db.getUser(req.body.email).then(results => {
        return db
            .checkPassword(req.body.pass, results.rows[0].pass)
            .then(result => {
                if (result == true) {
                    req.session.first = results.rows[0].first;
                    req.session.last = results.rows[0].last;
                    req.session.userId = results.rows[0].userid;
                    req.session.sigId = results.rows[0].sigid;

                    if (!req.session.sigId) {
                        res.redirect("/petition");
                    } else {
                        res.redirect("/thanks");
                    }
                } else {
                    res.render("login", {
                        error: 'pass is undefined'
                    });
                }
            });
    }).catch(err => {
        console.log("error in LOGIN POST:", err);
        res.render("login", {
            error: err
        });
    });
});

//------------- USER PROFILE ---------------
//////// EX IN ENCOUNTER: TAKE THESE TWO ROUTES AND TAKE THEM OUT OF INDEX.JS AND PUT THEM IN PROFILE.JS USING EXPRESS ROUTER ////////
//copy both these profile routes/delete them from index.js and put them in profile.js file and rewrite them to work with the router variable
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
            console.log("results.rows in get /edit:", results.rows);
            res.render("editprofile", {
                layout: "main",
                profile: results.rows[0] //sends info from db to the frontend (handlebars)
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
            .then(hash => {
                Promise.all([
                    db.updateUserWithPass(first, last, email, hash, userId),
                    db.updateProfile(age, city, url, userId)
                ]);
            })
            .then(() => {
                res.redirect("/petition");
            })
            .catch(err => {
                console.log("Error in IF - EDIT POST:", err);
            });
    } else {
        Promise.all([
            db.updateUserWithoutPass(userId, first, last, email),
            db.updateProfile(age, city, url, userId)
        ])
            .then(() => {
                res.redirect("/petition");
            })
            .catch(err => {
                console.log("Error in ELSE - EDIT POST:", err);
            });
    }
});

//------------- PETITION / SIGNATURE ---------------
// USING MIDDLEWARE FUNCTION IN /PETITION
//You can run multiple middleware functions in a get route (ivana tested it)
// app.get("/petition", requireNoSignature, (req, res) => {
//     res.render("petition", {
//         layout: "main"
//     });
// });

// code below would be deleted and moved to profile.js
app.get("/petition", requireNoSignature, (req, res) => {
    if (!req.session.sigId) {
        res.render("petition", {
            layout: "main"
        });
    } else {
        res.redirect("/thanks");
    }
});

app.post("/petition", requireNoSignature, (req, res) => {
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

//------------- DELETE ACCOUNT ---------------
// app.post("/delete", (req, res) => {
//     console.log("req.body:", req.body);
// });

//------------- THANK YOU PAGE ---------------
app.get("/thanks", requireSignature, (req, res) => {
    db.showSignature(req.session.sigId)
        .then(result => {
            db.totalSigners().then(data => {
                console.log("result for showSignature:", result);
                console.log("count for totalSigners:", data);
                res.render("thanks", {
                    layout: "main",
                    first: req.session.first,
                    signature: result.rows[0].signature,
                    count: data.rows[0].count
                });
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
app.get("/signers", requireSignature, (req, res) => {
    db.signers()
        .then(result => {
            console.log("result in get /signers:", result);
            res.render("signers", {
                layout: "main",
                signers: result.rows
            });
        })
        .catch(err => {
            console.log("error in signers:", err);
        });
});

app.get("/signers/:city", requireSignature, (req, res) => {
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

//---- DUMMY ROUTES - FOR SUPERTEST DEMO ONLY-----

// I.
app.get("/home", (req, res) => {
    res.send("<h1>home</h1>");
});

// II.
app.get("/home", (req, res) => {
    if (!req.session.whatever) {
        res.redirect("/registration");
    } else {
        res.send("<p>registration</p>");
    }
});

// III.
// SETTING A COOKIE  - see how to write a unit test to confirm a certain cookie has been set!
app.post("/welcome", (req, res) => {
    req.session.submitted = true;
    res.redirect("/registration");
});

//---- DUMMY ROUTES - FOR SUPERTEST DEMO ONLY-----

//if jest runs this file, then the server won't run
if (require.main == module) {
    app.listen(process.env.PORT || 8080, () =>
        console.log("Listening on 8080:")
    );
}
