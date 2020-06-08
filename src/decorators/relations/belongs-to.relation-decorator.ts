import { Class } from 'utility-types';
import { KlassPropDecorator } from '../../interfaces';
import { getSchemaFor, Schema } from '../../schema';
import { BelongsToRelation } from '../../relations';

export function BelongsTo(type: () => Class<any>): KlassPropDecorator {
  return <T extends {}, K extends keyof T>(target: T, propName: K) => {
    const entitySchema: Schema<T> = getSchemaFor(
      target.constructor as Class<T>,
    );

    entitySchema.registerRelation(
      propName,
      new BelongsToRelation(entitySchema, type),
    );
  };
}
