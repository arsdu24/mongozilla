import { Class } from 'utility-types';
import { Schema } from './schema';

const entitiesSchemaMap: Map<Class<any>, Schema<any>> = new Map();

export function getSchemaFor<T extends {}>(E: Class<T>): Schema<T> {
  let entitySchema: Schema<T> | undefined = entitiesSchemaMap.get(E);

  if (!entitySchema) {
    entitySchema = new Schema(E);

    entitiesSchemaMap.set(E, entitySchema);
  }

  return entitySchema;
}

export function listSchemas(): Schema<any>[] {
  return [...entitiesSchemaMap.values()];
}
