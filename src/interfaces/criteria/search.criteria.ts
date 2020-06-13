import { ObjectId } from 'mongodb';
import { RawEntity } from '../entity-like.type';

enum QueryOperatorsEnum {
  EXISTS = '$exists',
  EQUAL = '$eq',
  NOT_EQUAL = '$ne',
  IN = '$in',
  NOT_IN = '$nin',
  GREATER_THEN = '$gt',
  GREATER_THEN_OR_EQUAL = '$gte',
  LESS_THEN = '$lt',
  LESS_THEN_OR_EQUAL = '$lte',
  ELEMENT_MATCH = '$elemMatch',
}

export type Query<T> = {
  [QueryOperatorsEnum.EXISTS]?: boolean;
  [QueryOperatorsEnum.EQUAL]?: T;
  [QueryOperatorsEnum.NOT_EQUAL]?: T;
  [QueryOperatorsEnum.IN]?: T extends any[] ? T : T[];
  [QueryOperatorsEnum.NOT_IN]?: T extends any[] ? T : T[];
  [QueryOperatorsEnum.GREATER_THEN]?: T;
  [QueryOperatorsEnum.GREATER_THEN_OR_EQUAL]?: T;
  [QueryOperatorsEnum.LESS_THEN]?: T;
  [QueryOperatorsEnum.LESS_THEN_OR_EQUAL]?: T;
  [QueryOperatorsEnum.ELEMENT_MATCH]?: SearchCriteria<T>;
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
  return Object.values(QueryOperatorsEnum).some((key) => key in criteria);
}
