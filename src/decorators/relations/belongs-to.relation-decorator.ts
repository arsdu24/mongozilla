import { Class } from 'utility-types';
import { KlassPropDecorator } from '../../interfaces';
import { getSchemaFor, Schema } from '../../schema';
import { BelongsToRelation } from '../../relations';
import { ActiveRecord } from '../../active-record';

export function BelongsTo<T extends ActiveRecord<T>>(
  type: () => Class<T>,
): KlassPropDecorator {
  return <T extends object, K extends keyof T>(target: T, propName: K) => {
    const entitySchema: Schema<T> = getSchemaFor(
      target.constructor as Class<T>,
    );

    entitySchema.registerRelation(
      propName,
      new BelongsToRelation(entitySchema, type),
    );
  };
}
