import { ObjectId } from 'mongodb';
import { RawEntity } from '../entity-like.type';
import { NonFunctionKeys } from 'utility-types';

export type SearchOptionsCriteria<T extends object> = {
  $sort?: SearchSortCriteria<T>;
  $skip?: number;
  $limit?: number;
};

type RawEntitySearchSortCriteria<T extends object> = {
  [P in keyof RawEntity<T>]?: RawEntity<T>[P] extends object
    ? RawEntity<T>[P] extends ObjectId
      ? -1 | 1
      : SearchSortCriteria<RawEntity<T>[P]>
    : -1 | 1;
};

export type SearchSortCriteria<T extends object> = RawEntitySearchSortCriteria<
  Pick<T, NonFunctionKeys<T>>
>;
