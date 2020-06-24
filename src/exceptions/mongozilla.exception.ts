import { Class } from 'utility-types';

export class MongoZillaException<T extends object> extends Error {
  constructor(
    readonly entity: Class<T>,
    readonly message: string,
    readonly context: any = {},
  ) {
    super(message);
  }
}
