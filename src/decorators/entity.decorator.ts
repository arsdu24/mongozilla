import { Class } from 'utility-types';

import { ISchemaOptions } from '../interfaces';
import { getSchemaFor, Schema } from '../schema';

export function Entity(options?: ISchemaOptions): ClassDecorator {
  return <TFunction extends Function>(klass: TFunction) => {
    const entitySchema: Schema<any> = getSchemaFor(
      (klass as unknown) as Class<any>,
    );

    if (options) {
      entitySchema.mergeOptions(options);
    }
  };
}
