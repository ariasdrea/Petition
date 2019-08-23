const express = require("express");
// exporting app for jest
const app = (exports.app = express());
const hb = require("express-handlebars");
const db = require("./db");
const cookieSession = require("cookie-session");
const csurf = require("csurf");
const {
    requireLoggedInUser,
    requireLoggedOutUser,
    requireSignature,
    requireNoSignature
} = require("./middleware");

app.engine("handlebars", hb());
app.set("view engine", "handlebars");
app.use(express.static("./public"));

// --------------- SECURITY PROTECTION ---------------

let secrets;
process.env.NODE_ENV === 'production' ? secrets = process.env : secrets = require('./secrets');

app.use(
    cookieSession({
        secret: `${secrets.cookieSessionSecret}`,
        maxAge: 1000 * 60 * 60 * 24 * 14
    })
);

app.use(
    express.urlencoded({
        extended: false
    })
);

app.use(csurf());

//express adds to every response an object prop called locals. This middleware ensures token is available in all templates.
app.use((req, res, next) => {
    res.setHeader("X-Frame-Options", "DENY");
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.disable("x-powered-by");
// --------------- SECURITY PROTECTION ---------------

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

app.post("/register", (req, res) => {
    if (req.body.pass == '') {
        res.render("register", {
            layout: "main",
            passErr: 'Please provide a password'
        });
    } else {
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

    }
});

//------------- LOGIN ---------------
app.get("/login", requireLoggedOutUser, (req, res) => {
    res.render("login");
});

app.post("/login", (req, res) => {
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
app.get("/profile", requireLoggedInUser, (req, res) => {
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

// --------- EDIT PROFILE & POPULATE FIELDS ---------
app.get("/edit", requireLoggedInUser,  (req, res) => {
    const userId = req.session.userId;
    db.populateInfo(userId)
        .then(results => {
            res.render("editprofile", {
                layout: "main",
                profile: results.rows[0] //sends info from db to the frontend (handlebars)
            });
        })
        .catch(err => {
            console.log("error in EDIT GET:", err);
        });
});

app.post("/edit", (req, res) => {
    const userId = req.session.userId;
    let first = req.body.first;
    let last = req.body.last;
    let email = req.body.email;
    let age = req.body.age;
    let city = req.body.city;
    let url = req.body.homepage;

    if (req.body.password) {
        db.hashedPassword(req.body.password)
            .then(hash => {
                Promise.all([
                    db.updateUserWithPass(first, last, email, hash, userId),
                    db.updateProfile(age, city, url, userId)
                ]);
            })
            .then(() => {
                res.redirect("/thanks");
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
                res.redirect("/thanks");
            })
            .catch(err => {
                console.log("Error in ELSE - EDIT POST:", err);
            });
    }
});

//------------- PETITION / SIGNATURE ---------------
app.get("/petition", requireLoggedInUser, requireSignature, requireNoSignature, (req, res) => {
    res.render("petition", {
        layout: "main"
    });
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
app.get("/thanks", requireLoggedInUser, requireNoSignature, (req, res) => {
    //if they come from edit but haven't signed yet
    if (req.session.sigId) {
        Promise.all([
            db.getLatestInfo(req.session.userId),
            db.showSignature(req.session.sigId),
            db.totalSigners()
        ]).then(result => {
            result = [...result[0], ...result[1], ...result[2]];

            res.render("thanks", {
                layout: "main",
                first: result[0].first,
                signature: result[1].signature,
                count: result[2].count
            });
        });
    } else {
        res.redirect('/petition');
    }
});

app.post("/thanks", (req, res) => {
    res.redirect("/edit");
});

//------------- LIST OF SIGNERS ---------------
app.get("/signers", requireLoggedInUser, requireSignature, (req, res) => {
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

app.get("/signers/:city", requireLoggedInUser, requireSignature, (req, res) => {
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

//if jest runs this file, then the server won't run
if (require.main == module) {
    app.listen(process.env.PORT || 8080, () =>
        console.log("Listening on 8080:")
    );
}
