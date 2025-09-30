import { describe, expect, test, beforeAll, afterAll, afterEach } from '@jest/globals';
import { Config } from '../src/config';
import { createApp, close } from '../src/app';
import { Express } from 'express';
import { Server } from 'http';
import supertest from 'supertest';
import { MongoClient } from 'mongodb';

let server: Server | null = null;
let client: MongoClient | null = null;

const PORT = 3000;
const DB_NAME = 'perspective-test'; // TODO: would be better to use random name

beforeAll(async () => {
  const config: Config = {
    mongo: {
      uri: 'mongodb://user:password@localhost:27017',
      dbName: DB_NAME,
    },
    httpServer: {
      port: PORT,
    },
  };

  client = new MongoClient(config.mongo.uri);
  await client.connect();

  const app: Express = await createApp(config);
  server = app.listen(PORT, () => {
    console.log(`Test Express server listening on http://localhost:${PORT}`);
  });
});

afterAll(async () => {
  if (server) {
    // TODO: refactor with promisify
    return new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) {
          reject(err);
        }
        resolve('');
      });
    }).then(() => {
      return close();
    });
  }
});

afterEach(async () => {
  const db = client.db(DB_NAME);
  // cleanup data after each test
  await db.collection('users').deleteMany({});
});

describe.only('your code', () => {
  test('listing empty users collection', async () => {
    const response = await supertest(`http://localhost:${PORT}`)
      .get('/users')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toEqual([]);
  });

  test('creating user fails with 400 when fullname is not send', async () => {
    const response = await supertest(`http://localhost:${PORT}`)
      .post('/users')
      .set('Content-Type', 'application/json')
      .send({ email: 'my-email@test.co' })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body.message).toEqual("request/body must have required property 'fullname'");
  });

  test('creating user fails with 400 when using invalid email', async () => {
    const response = await supertest(`http://localhost:${PORT}`)
      .post('/users')
      .set('Content-Type', 'application/json')
      .send({ email: 'invalid-email', fullname: 'My Name' })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body.message).toEqual(`request/body/email must match format "email"`);
  });

  test('creating user return 201 for valid user', async () => {
    await supertest(`http://localhost:${PORT}`)
      .post('/users')
      .set('Content-Type', 'application/json')
      .send({ email: 'my-email@test.co', fullname: 'My Name' })
      .expect('Content-Type', /json/)
      .expect(201);
  });

  test.only('listing created users - I can see my writes', async () => {
    await supertest(`http://localhost:${PORT}`)
      .post('/users')
      .set('Content-Type', 'application/json')
      .send({ email: 'my-email@test.co', fullname: 'My Name' })
      .expect('Content-Type', /json/)
      .expect(201);

    await supertest(`http://localhost:${PORT}`)
      .post('/users')
      .set('Content-Type', 'application/json')
      .send({ email: 'eduard@test.co', fullname: 'Eduard Second' })
      .expect('Content-Type', /json/)
      .expect(201);

    const response = await supertest(`http://localhost:${PORT}`)
      .get('/users')
      .expect('Content-Type', /json/)
      .expect(200);
    expect(response.body.length).toEqual(2);
    expect(response.body[0]).toEqual({
      fullname: 'My Name',
      email: 'my-email@test.co',
      createdAt: expect.any(String),
      id: expect.any(String),
    });
    expect(response.body[1]).toEqual({
      fullname: 'Eduard Second',
      email: 'eduard@test.co',
      createdAt: expect.any(String),
      id: expect.any(String),
    });
  });
});
