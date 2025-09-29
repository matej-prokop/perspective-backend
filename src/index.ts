import express, {Express, Request, Response} from 'express';
import cors from 'cors';
import swaggerJsdoc from 'swagger-jsdoc';
import * as OpenApiValidator from 'express-openapi-validator';

const app: Express = express();

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
            email: { type: 'string', format: 'email' }
          }
        },
        UserResponse: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            fullname: { type: 'string' },
            email: { type: 'string' },
            created: { type: 'number', description: 'Unix timestamp' }
          }
        }
      }
    }
  },
  apis: ['./src/index.ts'], // path to the API docs
};

const openApiSpecification = swaggerJsdoc(swaggerOptions);

app.use(cors())
  .use(express.json())
  .options('*', cors());


app.use(
  OpenApiValidator.middleware({
    apiSpec: openApiSpecification as any,
    validateRequests: true,
  }),
);

/**
 * @openapi
 * /users:
 *   post:
 *     summary: Create a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 */
app.post('/users', (req: Request, res: Response) => {
  res.status(201).send({});
});

/**
 * @openapi
 * /users:
 *   get:
 *     summary: Retrieve all users
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserResponse'
 */
app.get('/users', (req: Request, res: Response) => {
  res.status(200).send([]);
});

app.use((err: any, req: Request, res: Response, next: Function) => {
  const status = err.status || 500;
  let message = err.message;
  let errors = err.errors;

  if(status === 500) {
    console.error("An unexpected error occured", err);
    // TODO: We should report this error in staging & production (to Sentry, etc.)

    // We intentionally hide error details from the client. Ideally, there should be a request ID returned to the user which can be used to correlated the failure
    message = 'Internal Server Error';
    errors = [];
  } 

  res.status(status).json({ message, errors });
});

const port = process.env.PORT || 3111;
app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
