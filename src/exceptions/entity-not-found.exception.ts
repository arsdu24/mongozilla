import { Class } from 'utility-types';
import { MongoZillaException } from './mongozilla.exception';
import { SearchCriteria, SearchOptionsCriteria } from '../interfaces/criteria';

export class EntityNotFoundException<
  T extends object
> extends MongoZillaException<T> {
  constructor(
    readonly entity: Class<T>,
    readonly criteria: SearchCriteria<T> = {},
    readonly options: SearchOptionsCriteria<T> = {},
  ) {
    super(entity, `Entity not fount`, {
      criteria,
      options,
    });
  }
}
