import { Collection, MongoClient, MongoClientOptions } from 'mongodb';
import { ConnectionNotFoundException } from './exceptions';
import { Class } from 'utility-types';
import { getSchemaFor } from './schema';

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

export function getEntityConnection<T extends object>(
  entity: Class<T>,
): Connection {
  const connectionName: string = getSchemaFor(entity).getConnectionName();
  const conn: Connection | undefined = connectionsMap.get(connectionName);

  if (!conn) {
    throw new ConnectionNotFoundException(entity, connectionName, {
      connectionsMap,
    });
  }

  return conn;
}

export async function connect(
  options: MongoClientOptions & { uri: string; name?: string },
): Promise<Connection> {
  const connection: Connection = new Connection(options);

  await connection.connect();

  return connection;
}
