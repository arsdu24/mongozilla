import { Collection, MongoClient, MongoClientOptions } from 'mongodb';

const connectionsMap: Map<string, Connection> = new Map();

class Connection {
  private readonly client: MongoClient;

  constructor(
    private readonly options: MongoClientOptions & {
      uri: string;
      name?: string;
    },
  ) {
    const { uri, name, ...rest } = options;

    this.client = new MongoClient(uri, rest);

    connectionsMap.set(name || 'default', this);
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  getCollection(collectionName: string): Collection {
    return this.client.db().collection(collectionName);
  }
}

export function getConnection(name = 'default'): Connection {
  const conn: Connection | undefined = connectionsMap.get(name);

  if (!conn) {
    throw new Error(`Cannot found connection by name '${name}'`);
  }

  return conn;
}

export async function connect(
  options: MongoClientOptions & { uri: string; name?: string },
): Promise<Connection> {
  const connection: Connection = new Connection(options);

  await connection.connect();

  return connection
}
