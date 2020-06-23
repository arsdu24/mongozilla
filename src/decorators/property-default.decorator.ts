import { KlassPropDecorator } from '../interfaces';
import { getSchemaFor, PropertySchema, Schema } from '../schema';
import { Class } from 'utility-types';

export function PropertyDefault(defValue: any): KlassPropDecorator {
  return <T extends object, K extends keyof T>(target: T, propName: K) => {
    const entitySchema: Schema<T> = getSchemaFor(
      target.constructor as Class<T>,
    );
    const propertySchema: PropertySchema<T> = entitySchema.getPropertySchema(
      propName,
    );

    propertySchema.setDefault(defValue);
  };
}
