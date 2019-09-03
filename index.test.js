//import super test - need to download supertest
// test.only() - only this specific test will run
const supertest = require("supertest");
//destructuring so i can have access to the methods directly
const { app }  = require("./index");
// console.log('app', app); //to make sure its defined
// requiring  cookie-session that lives in the '__mocks__ directory' - jest knows to look in there
const cookieSession = require("cookie-session");
jest.mock('./db');
const db = require('./db');

test('logged out users get redirected to register when they try to go to petition', () => {
    cookieSession.mockSessionOnce({
        userId: null
    });
    return supertest(app).get("/petition").then(res => {
        expect(res.statusCode).toBe(302);
        expect(res.headers.location).toBe('/register');
    });
});

test("logged in users get redirected to petition when they go to registration", () => {
    cookieSession.mockSessionOnce({
        userId: 1
    });
    return supertest(app).get('/register').then(res => {
        expect(res.statusCode).toBe(302);
        expect(res.headers.location).toBe('/petition');
    });
});

test("logged in users get redirected to petition when they go to login", () => {
    cookieSession.mockSessionOnce({
        userId: 1,
    });
    return supertest(app).get('/login').then(res => {
        expect(res.statusCode).toBe(302);
        expect(res.headers.location).toBe('/petition');
    });
});

test("logged in users who haven't signed get redirected to petition when they try to go to thank you page", () => {
    cookieSession.mockSessionOnce({
        userId: 1,
        sigId: null
    });
    return supertest(app).get('/thanks').then(res => {
        expect(res.statusCode).toBe(302);
        expect(res.headers.location).toBe('/petition');
    });
});

test("logged in users who haven't signed get redirected to petition when they try to go to signers page", () => {
    cookieSession.mockSessionOnce({
        userId: 1,
        sigId: null
    });
    return supertest(app).get('/signers').then(res => {
        expect(res.statusCode).toBe(302);
        expect(res.headers.location).toBe('/petition');
    });
});

// Write tests to confirm that your POST route for signing the petition is working correctly. You will want to confirm that
//
// When the input is good, the user is redirected to the thank you page

test.only('post /petition: when input is valid, user is redirected to thank you page', () => {
    cookieSession.mockSessionOnce({
        userId: 1,
        sigId: 1
    });

    db.signatures = jest.fn().mockImplementationOnce(() => Promise.resolve(2));

    return supertest(app)
        .post('/petition')
        .send()
        .then(res => {
            expect(res.headers.location).toBe('/thanks');
        });
});
