import { ObjectId } from 'mongodb';

export type Query<T> = {
  $exists?: boolean;
  $eq?: T;
  $ne?: T;
  $in?: T extends any[] ? T : T[];
};

export type SearchCriteria<T extends {}> = {
  [P in keyof T]?: T[P] extends ObjectId
    ? ObjectId | string
    : SearchCriteria<T[P]> | Query<T[P]>;
};
