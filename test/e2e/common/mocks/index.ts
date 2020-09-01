import { Db, MongoClient } from 'mongodb';
import { userMocks } from './user.mocks';

const client: MongoClient = new MongoClient(process.env.MONGO_DB_URI || '', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function getDB(): Promise<Db> {
  if (!client.isConnected()) {
    await client.connect();
  }

  return client.db();
}

const initializeMocksDatabase = <T = object, C extends string = string>(
  mocks: T[],
  defCollectionName: C,
) => async (collection?: C) => {
  const db: Db = await getDB();

  const col = db.collection(collection || defCollectionName);

  await col.deleteMany({});

  await col.insertMany(mocks);
};

export function closeConnection() {
  return client.close();
}

export const initializeUsersDatabase = initializeMocksDatabase(
  userMocks,
  'users',
);

export { userMocks };
