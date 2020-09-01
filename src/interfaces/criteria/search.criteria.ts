import { ObjectId } from 'mongodb';
import { NonFunctionKeys } from 'utility-types';

type Optional<T> = T | undefined;
type InferType<T> = T extends Optional<infer U> ? U : T;

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

enum LogicalOperatorsQueryOperatorsEnum {
  OR = '$or',
  AND = '$and',
}

type Query<T> = {
  [QueryOperatorsEnum.EXISTS]?: boolean;
  [QueryOperatorsEnum.EQUAL]?: T;
  [QueryOperatorsEnum.NOT_EQUAL]?: T;
  [QueryOperatorsEnum.IN]?: [T] extends [(infer U)[]] ? U[] : T[];
  [QueryOperatorsEnum.NOT_IN]?: [T] extends [(infer U)[]] ? U[] : T[];
  [QueryOperatorsEnum.GREATER_THEN]?: T;
  [QueryOperatorsEnum.GREATER_THEN_OR_EQUAL]?: T;
  [QueryOperatorsEnum.LESS_THEN]?: T;
  [QueryOperatorsEnum.LESS_THEN_OR_EQUAL]?: T;
};

type IdSearchCriteria = ObjectId | string | Query<ObjectId | string>;

type TypedSearchCriteria<T> = T extends object
  ? T extends (infer U)[]
    ? U extends object
      ? Query<T> & {
          [QueryOperatorsEnum.ELEMENT_MATCH]?: EntityBasedSearchQuery<U>;
        }
      : Query<T> | T
    : EntityBasedSearchQuery<T>
  : T extends boolean
  ? Query<boolean> | boolean
  : Query<T> | (T extends string ? string | RegExp : T);

type RawEntitySearchCriteria<T extends object> = {
  [P in keyof T]?: ObjectId extends InferType<T[P]>
    ? IdSearchCriteria
    : TypedSearchCriteria<T[P]>;
};

export type EntityBasedSearchQuery<T extends object> = RawEntitySearchCriteria<
  Pick<T, NonFunctionKeys<T>>
>;

export type LogicalOperatorsSearchCriteria<T extends object> = {
  [LogicalOperatorsQueryOperatorsEnum.OR]?: EntityBasedSearchQuery<T>[];
  [LogicalOperatorsQueryOperatorsEnum.AND]?: EntityBasedSearchQuery<T>[];
};

export type SearchCriteria<T extends object> =
  | EntityBasedSearchQuery<T>
  | LogicalOperatorsSearchCriteria<T>;

export function isSearchCriteria(
  criteria: any,
): criteria is SearchCriteria<any> {
  return Object.values(QueryOperatorsEnum).some(
    (key: string) => key in criteria,
  );
}

export function isLogicalOperatorsSearchCriteria(
  criteria: any,
): criteria is LogicalOperatorsSearchCriteria<any> {
  return Object.values(LogicalOperatorsQueryOperatorsEnum).some(
    (key: string) => key in criteria,
  );
}
