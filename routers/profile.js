const express = require("express");
const router = express.Router();
const { requireNoSignature } = require("../middleware");
// router variable is a small version of express that has 'get' and 'post' methods (just like app does in index.js)

// not sure if it does use().

//////// ORIGINAL ROUTES FROM INDEX.JS ////////
// router.get("/profile", (req, res) => {
//     res.render("profile");
// });
//
// router.post("/profile", (req, res) => {
//     return db
//         .profile(req.body.age, req.body.city, req.body.url, req.session.userId)
//         .then(() => {
//             res.redirect("/petition");
//         })
//         .catch(err => {
//             console.log("error in PROFILE POST:", err);
//             res.redirect("/profile");
//         });
// });
//////// ORIGINAL ROUTES FROM INDEX.JS ////////

// good benefit of router - if you have routes that have different methods (get vs post) with same url, you can write this a little more succintly using express router.

// .route() - allows us to combine get and post metho'/profile'd.get().post()

//////// WRITING MULTIPLE ROUTES ////////
//you pass requireNoSignature right after get if you need that middleware only in get.
router
    .route("/profile")
    .get(requireNoSignature, (req, res) => {
        res.render("profile");
    })
    .post((req, res) => {
        return db
            .profile(
                req.body.age,
                req.body.city,
                req.body.url,
                req.session.userId
            )
            .then(() => {
                res.redirect("/petition");
            })
            .catch(err => {
                console.log("error in PROFILE POST:", err);
                res.redirect("/profile");
            });
    });
//////// WRITING MULTIPLE ROUTES ////////

module.exports = router; // we have to export it in order to use it in another file

//benefit of using router vs app. Keeping your code succint. APP has many uses (this file may do a lot of different things), router's job is strictly routes.
