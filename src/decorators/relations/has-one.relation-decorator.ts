import { Class } from 'utility-types';
import { KlassPropDecorator } from '../../interfaces';
import { getSchemaFor, Schema } from '../../schema';
import { HasOneRelation } from '../../relations';

export function HasOne(type: () => Class<any>): KlassPropDecorator {
  return <T extends {}, K extends keyof T>(target: T, propName: K) => {
    const entitySchema: Schema<T> = getSchemaFor(
      target.constructor as Class<T>,
    );

    entitySchema.registerRelation(
      propName,
      new HasOneRelation(entitySchema, type),
    );
  };
}
