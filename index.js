const express = require("express");
const app = express();
//////exporting app for usage in index.test.js//////
exports.app = app;
//////exporting app for usage in index.test.js//////
const ca = require("chalk-animation");
const hb = require("express-handlebars");
const db = require("./db"); //imports the db file
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const csurf = require("csurf");

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

////// 1. IMPORTING FROM MIDDLEWARE.JS /////
//importing as an object (destructuring syntax)
// We invoke this function in /petition.
// const { requireNoSignature } = require("./middleware");
////// IMPORTING FROM MIDDLEWARE.JS /////

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
app.get("/register", (req, res) => {
    //renders registration template on top of the layout
    res.render("register", {
        layout: "main"
    });
});

app.post("/register", (req, res) => {
    console.log("req.body:", req.body);
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
        //checkpassword(textenteredinloginform(req.body.pass), hashedpasswordfromdb(rows[0].pass))
        return db
            .checkPassword(req.body.pass, rows[0].pass)
            .then(function(result) {
                // console.log("result:", result);
                //result is a boolean value of true if the login is successful/passwords match
                if (result == true) {
                    req.session.first = rows[0].first;
                    req.session.last = rows[0].last;
                    //stores userId in cookie to show that user is logged in
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

//------------- DELETE ACCOUNT ---------------
// app.post("/delete", (req, res) => {
//     console.log("req.body:", req.body);
// });

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

//---- DUMMY ROUTES - FOR SUPERTEST DEMO ONLY-----

// I.
// app.get("/home", (req, res) => {
//     res.send("<h1>home</h1>");
// });

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
//
// app.listen(process.env.PORT || 8080, function() {
//     ca.rainbow("Listening on 8080:");
// });

//to make the test finish - otherwise, jest would restart the server
if (require.main == module) {
    app.listen(8080, () => ca.rainbow("Listening on 8080:"));
}

///////// EXPRESS ROUTER - MODULARIZED CODE  /////////
// app.get('/petition', requireNoSignature, (req, res) => {
//     res.sendStatus(200);
// });
//
// app.post('/petition', requireNoSignature, (req, res) => {
//     res.sendStatus(200);
// });
//
// app.get('/thanks', requireSignature, (req, res) => {
//     res.sendStatus(200);
// });
//
// app.get('/signers', requireSignature, (req, res) => {
//     res.sendStatus(200);
// });
//
// app.get('/signers/:city', requireSignature, (req, res) => {
//     res.sendStatus(200);
// });
//
// app.post('/signature/delete', (req, res) => {
//     res.sendStatus(200);
// });
//
// app.get('/logout', (req, res) => {
//     res.sendStatus(200);
// });
