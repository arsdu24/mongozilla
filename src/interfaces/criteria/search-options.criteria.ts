import { ObjectId } from 'mongodb';
import { RawEntity } from '../entity-like.type';

export type SearchOptionsCriteria<T extends {}> = {
  $sort?: SearchSortCriteria<T>;
  $skip?: number;
  $limit?: number;
};

export type SearchSortCriteria<T extends {}> = {
  [P in keyof RawEntity<T>]?: RawEntity<T>[P] extends {}
    ? RawEntity<T>[P] extends ObjectId
      ? -1 | 1
      : SearchSortCriteria<RawEntity<T>[P]>
    : -1 | 1;
};
