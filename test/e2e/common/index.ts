import { connect } from '../../../src';
import { closeConnection } from './mocks';

export * from './consts';
export * from './mocks';

export async function initMongoZilla() {
  await connect({
    uri: process.env.MONGO_DB_URI || '',
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}

let conn: any;

beforeAll(async () => {
  conn = await initMongoZilla();
});
afterAll(async () => {
  await closeConnection();

  if (conn) {
    await conn.close();
  }
});
