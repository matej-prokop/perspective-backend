import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import swaggerJsdoc from 'swagger-jsdoc';
import * as OpenApiValidator from 'express-openapi-validator';

import { Config } from './config';
import { getUserRouter, ensureIndexes } from './users.router';
import * as MongoClient from './mongo';

// OpenAPI specification
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Users API',
      version: '1.0.0',
      description: 'A simple users API',
    },
    components: {
      schemas: {
        User: {
          type: 'object',
          required: ['fullname', 'email'],
          properties: {
            fullname: { type: 'string' },
            email: { type: 'string', format: 'email' },
          },
        },
        UserResponse: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            fullname: { type: 'string' },
            email: { type: 'string' },
            created: { type: 'number', description: 'Unix timestamp' },
          },
        },
      },
    },
  },
  apis: ['./src/users.router.ts'], // path to the API docs
};

const openApiSpecification = swaggerJsdoc(swaggerOptions);

export async function createApp(config: Config): Promise<Express> {
  const app: Express = express();

  app.use(cors()).use(express.json()).options('*', cors());

  app.use(
    OpenApiValidator.middleware({
      apiSpec: openApiSpecification as any,
      validateRequests: true,
    }),
  );

  const { db } = await MongoClient.connectToDb({
    uri: config.mongo.uri,
    dbName: config.mongo.dbName,
  });

  await ensureIndexes(db);

  app.use('/', getUserRouter(db));

  app.use((err: any, req: Request, res: Response, next: Function) => {
    const status = err.status || 500;
    let message = err.message;
    let errors = err.errors;

    if (status === 500) {
      console.error('An unexpected error occured', err);
      // TODO: We should report this error in staging & production (to Sentry, etc.)

      // Intentionally hide error details from the client. Ideally, there should be a request ID returned to the user which can be used to correlated the failure
      message = 'Internal Server Error';
      errors = [];
    }

    res.status(status).json({ message, errors });
  });

  return app;
}

export async function close() {
  await MongoClient.closeDb();
}
