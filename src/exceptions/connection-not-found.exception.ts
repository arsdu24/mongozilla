import { Class } from 'utility-types';
import { MongoZillaException } from './mongozilla.exception';

export class ConnectionNotFoundException<
  T extends object
> extends MongoZillaException<T> {
  constructor(
    readonly entity: Class<T>,
    readonly connectionName: string,
    readonly context: any = {},
  ) {
    super(entity, `Cannot found connection '${connectionName}'`, context);
  }
}
