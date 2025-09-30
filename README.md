# Backend Engineer Work Sample

## How I approached this project

Intially, I spent roughly 1/2 hour thinking about how I am going to implement the project that you asssigned to me. My plan was::

- try to keep "illusion" that I am building real app (implement gracefull shutdown, error handling, etc.)
- stick with Express.js (Personally, I enjoy using fastify)
- use testcontainers.com for dev and test setup (compared to docker-compose, you can spinup depedencies from the code, easily wait for them to become ready and have dynamic port => isolated runs)
- utilize OAS (OpenAPI Specification) to describe/document API and let it handle API input validation
- use simple `mongodb` to handle mongo stuff

I estimated that it will take me 3-4 hours and timeboxed myself to 5 hours. Unfortunately, I was dealing with issues on my local workstation that I had to setup for the project (Docker Desktop didn't get installed properly on my system and causing `testcontainers` to not work correctly). After 3+ hours fighting with not working `testcontainers`, I decided to go for plan "B" (as I was running out of time):

- I replaced testcontainers by simple `docker-compose.yml` requiring manual setup and static config :(
- Resulting project is not so well structured and polished as I would wish and its configuration (`config.js`) looks a bit weird

## Testing

`npm install`

`docker-compose up -d`

`npm run test`

I wrote only functional tests where Express application is listening on a static port and the app talks to MongoDB running in docker. 

I usually avoid mocking when possible. I will be more than happy to discuss various testing strategies.

Note: `npm run test` sadly does NOT finish properly but I didn't have time to look what is blocking gracefull exit.

## Running in dev

`npm install`

`docker-compose up -d`

`npm run start`

## API specification & validation

I used OpenAPI Specification to describe service API. Specifically, it is defined via jsdoc using `'swagger-jsdoc'` so the API spec is colocated with the API implementation.

On top of it, I use `express-openapi-validator` to utilize the API spec to validate incoming requests.

### APIs

1. `POST /users` - expects mandatory `fullname` and `email` in request body
1. `GET /users` - get list of users (`id`, `fullname`, `email`, `createdAd`), you can attache `?created=asc` or `?created=desc` query parameter to have the list sorted accordingly

## Questions / Concerns

I am looking forward to discuss the project with you and hear from you what would you do differently and why. 