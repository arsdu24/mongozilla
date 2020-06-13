import { Class } from 'utility-types';
import { KlassPropDecorator } from '../../interfaces';
import { getSchemaFor, Schema } from '../../schema';
import { HasOneRelation } from '../../relations';
import { ActiveRecord } from '../../active-record';

export function HasOne<T extends ActiveRecord<T>>(
  type: () => Class<T>,
): KlassPropDecorator {
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
