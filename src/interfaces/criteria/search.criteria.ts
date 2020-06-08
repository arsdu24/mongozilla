import {ObjectId} from 'mongodb';

export type Query<T> = {
  $exists?: boolean;
  $eq?: T;
  $ne?: T;
  $in?: T extends any[] ? T : T[];
  $nin?: T extends any[] ? T : T[];
  $gt?: T;
  $gte?: T;
  $lt?: T;
  $lte?: T;
};

export type SearchCriteria<T extends {}> = {
  [P in keyof T]?: T[P] extends ObjectId
    ? ObjectId | string | Query<ObjectId | string>
    : SearchCriteria<T[P]> | Query<T[P]>;
};

export function isSearchCriteria(
  criteria: any,
): criteria is SearchCriteria<any> {
  return [
    '$exists',
    '$eq',
    '$ne',
    '$in',
    '$nin',
    '$gt',
    '$gte',
    '$lt',
    '$lte',
  ].some((key) => key in criteria);
}
