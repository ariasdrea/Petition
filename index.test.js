const supertest = require("supertest");
const { app } = require("./index");
const cookieSession = require("cookie-session");
jest.mock("./db");
const db = require("./db");

test("logged out users get redirected to Register when they go to Petition", () => {
    cookieSession.mockSessionOnce({});
    return supertest(app)
        .get("/petition")
        .then((res) => {
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/register");
        });
});

test("logged in users who HAVE SIGNED petition get redirected to Thanks page when they go to Petition", () => {
    cookieSession.mockSessionOnce({
        userId: 1,
        sigId: "signed"
    });

    return supertest(app)
        .get("/petition")
        .then((res) => {
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/thanks");
        });
});

test("logged in users get redirected to Petition when they go to Registration", () => {
    cookieSession.mockSession({
        userId: 1
    });
    return supertest(app)
        .get("/register")
        .then((res) => {
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/petition");
        });
});

// mockSession userId lives on this route
test("logged in users get redirected to petition when they go to Login", () => {
    return supertest(app)
        .get("/login")
        .then((res) => {
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/petition");
        });
});

// mockSession userId lives on this route
test("logged in users who HAVEN'T SIGNED get redirected to Petition when they try to go to Thanks page", () => {
    return supertest(app)
        .get("/thanks")
        .then((res) => {
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/petition");
        });
});

// mockSession userId lives on this route
test("logged in users who HAVEN'T SIGNED get redirected to Petition when they try to go to Signers page", () => {
    return supertest(app)
        .get("/signers")
        .then((res) => {
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/petition");
        });
});

// Write tests to confirm that your POST route for signing the petition is working correctly. You will want to confirm that
//
// When the input is good, the user is redirected to the thank you page

// test.only("post /petition: when input is valid, user is redirected to thank you page", () => {
//     cookieSession.mockSessionOnce({
//         userId: 1,
//         sigId: 1
//     });

//     db.signatures = jest.fn().mockImplementationOnce(() => Promise.resolve(2));

//     return supertest(app)
//         .post("/petition")
//         .send()
//         .then((res) => {
//             expect(res.headers.location).toBe("/thanks");
//         });
// });
