//import super test - need to download supertest
// test.only() - only this specific test will run
const supertest = require("supertest");
const { app } = require("./index");
console.log('app', app); //to make sure its defined
// requiring  cookie-session that lives in the '__mocks__ directory' - jest knows to look in there
const cookieSession = require("cookie-session");

test("GET /home returns as an h1 as response", () => {
    //supertest takes in the server as an argument
    return supertest(app)
        .get("/home")
        .then(res => {
            expect(res.statusCode).toBe(200);
            expect(res.text).toBe("<h1>home</h1>");
            expect(res.headers["content-type"]).toContain("text/html");
        });
});

test("GET /home with no cookies causes me to be redirected", () => {
    return supertest(app)
        .get("/home")
        .then(res => {
            // console.log("location header:", res.headers.location);
            //I want to check if I'm actually being redirected (status code 302)
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/registration");
        });
});

//test if we get the correct response when we do have a cookie.
test('GET /home request sends H1 as response when "whatever" cookie is sent!', () => {
    cookieSession.mockSessionOnce({
        whatever: true
    });
    return supertest(app)
        .get("/home")
        .then(res => {
            expect(res.statusCode).toBe(200);
        });
});

//now when we use supertest to make our request to the server, the fake cookie will automatically be sent along with the request (w/o us explicitely telling it to do so)

test('POST /welcome should set "submitted" cookie', () => {
    // send over an empty cookie as part of the request I make so that the server has an aempty cookie to put data into.
    //in this case, data refers to {submitted: true}
    let cookie = {};
    cookieSession.mockSessionOnce(cookie);
    //next step is to use supertest to make a POST request
    return supertest(app)
        .post("/welcome")
        .then(() => {
            //the cookie will be in the object variable (obj) we created up above
            console.log("cookie variable: ", cookie);
        });
});
// Me seal with MockSessionOnce in 2 cases.
//we need to receive a cookie as part of the response
//we will need to work with mockSessionOnce if we want to 1. send a test / dummy cookie as part of the request we make to the server AND
//2. if we want to see the cookie we receive as part of the response. We need to check that a cookie has been set.
