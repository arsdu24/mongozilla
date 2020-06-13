import { KlassPropDecorator } from '../interfaces';
import { getSchemaFor, PropertySchema, Schema } from '../schema';
import { Class } from 'utility-types';
import { ActiveRecord } from '../active-record';

export function ForeignKey<T extends ActiveRecord<T>>(
  foreignEntity: () => Class<T>,
  alias?: string,
): KlassPropDecorator {
  return <T extends {}, K extends keyof T>(target: T, propName: K) => {
    const entitySchema: Schema<T> = getSchemaFor(
      target.constructor as Class<T>,
    );
    const propertySchema: PropertySchema<T> = entitySchema.getPropertySchema(
      propName,
    );

    if (alias) {
      propertySchema.aliasFor(alias);
    }

    entitySchema.setForeignKey(foreignEntity, propertySchema);
  };
}
