import { KlassPropDecorator } from '../interfaces';
import { getSchemaFor, PropertySchema, Schema } from '../schema';
import { Class } from 'utility-types';

export function PrimaryKey(): KlassPropDecorator {
  return <T extends object, K extends keyof T>(target: T, propName: K) => {
    const entitySchema: Schema<T> = getSchemaFor(
      target.constructor as Class<T>,
    );
    const propertySchema: PropertySchema<T> = entitySchema.getPropertySchema(
      propName,
    );

    entitySchema.setPrimaryKey(propertySchema);
    propertySchema.aliasFor('_id');
  };
}
