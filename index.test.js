//import super test
// downlaod supertest package
const supertest = require("supertest");
const { app } = require("./index");
//here we're requiring the fake cookie-session -- the one that lives in the '__mocks__ directory'
const cookieSession = require("cookie-session"); //fake cookie session

test("GET /home returns as an h1 as response", () => {
    //returns a promise
    //supertest takes in the server as an argument
    return supertest(app)
        .get("/home")
        .then(res => {
            console.log("res: ", res);
            console.log("headers:", res.headers);
            expect(res.statusCode).toBe(200);
            expect(res.text).toBe("<h1>home</h1>");
            expect(res.headers["content-type"]).toContain("text/html");
        });
    //app has it 'get' and 'post'methods.
});

// .get() - makes the request
// .then() - res represents the response I'm getting from the server

// test.only() - only this specific test will run
test("GET /home with no cookies causes me to be redirected", () => {
    return supertest(app)
        .get("/home")
        .then(res => {
            //we might not remember what the location header is
            // console.log("location header:", res.headers.location);
            //I want to check if I'm actually being redirected (status code 302)
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/registration");
        });
});

//test if we get the correct response when we do have a cookie.
test.only('GET /home request sends H1 as response when "whatever" cookie is sent!', () => {
    //we mock the modules/npmpackages that we have to use but did not create ourselves!
    // we don't wanna test cookie session! - we just want to test the route
    //mockSessionOnce is a method of cookieSession // this is the function we neex to invoke to create a fake cookie (i.e fake cookie)
    cookieSession.mockSessionOnce({
        //the name of the cookie 'whatever' needs to be truthy
        whatever: true
    });
    return supertest(app)
        .get("/home")
        .then(res => {
            console.log("body of response:", res.text);
        });
});

//now when we use supertest to make our request to the server, the fake cookie will automatically be sent along with the request (w/o us explicitely telling it to do so)
