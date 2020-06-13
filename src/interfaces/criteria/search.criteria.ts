import { ObjectId } from 'mongodb';
import { RawEntity } from '../entity-like.type';

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

type IdSearchCriteria = ObjectId | string | Query<ObjectId | string>;

type TypedSearchCriteria<T> = T extends {} ? SearchCriteria<T> : Query<T>;

type RawEntitySearchCriteria<T extends {}> = {
  [P in keyof T]?: T extends ObjectId
    ? IdSearchCriteria
    : TypedSearchCriteria<T[P]>;
};

export type SearchCriteria<T extends {}> = RawEntitySearchCriteria<
  RawEntity<T>
>;

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
