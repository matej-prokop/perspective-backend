import { Router, Request, Response } from 'express';
import { Db, Collection, WithId, Document, MongoServerError } from 'mongodb';

const MONGO_DUPLIACATE_KEY_ERROR_CODE = 11000;

interface UserDocument extends Document {
  fullname: string;
  email: string;
  createdAt: Date;
}

export async function ensureIndexes(db: Db) {
  const userCollection: Collection<UserDocument> = db.collection('users');

  // for sorting by creation date (newest first)
  await userCollection.createIndex({ createdAt: -1 });

  // ensuring emails are unique among users
  await userCollection.createIndex({ email: 1 }, { unique: true });
}

export function getUserRouter(db: Db): Router {
  const router = Router();

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
  router.post('/users', async (req: Request, res: Response) => {
    const { fullname, email } = req.body;

    const userCollection: Collection<UserDocument> = db.collection('users');

    try {
      const result = await userCollection.insertOne({
        fullname,
        email,
        createdAt: new Date(),
      });

      // TODO: send reponse... do we want to send ID or entrire user back?
      res.status(201).send({
        userId: result.insertedId,
      });
    } catch (error) {
      if (error instanceof MongoServerError && error.code === MONGO_DUPLIACATE_KEY_ERROR_CODE) {
        return res.status(409).json({ message: 'User with provided email already exists.' });
      }

      // let express error middleware handle unexpected errors
      throw error;
    }
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
  router.get('/users', async (req: Request, res: Response) => {
    const userCollection: Collection<UserDocument> = db.collection('users');
    const users: WithId<UserDocument>[] = await userCollection.find({}).toArray();

    res.status(200).json(
      users.map((user: UserDocument) => ({
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        createdAt: user.createdAt,
      })),
    );
  });

  return router;
}
