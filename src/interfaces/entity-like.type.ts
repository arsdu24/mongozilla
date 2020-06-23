import { ObjectId } from 'mongodb';
import { DeepPartial, NonFunctionKeys } from 'utility-types';

export type RawEntity<T> = T extends object
  ? DeepPartial<Pick<T, NonFunctionKeys<T>>>
  : T;

export type EntityLike<T extends object> = T & {
  _id?: ObjectId;
  _origin?: RawEntity<T> | any;
  _isNew?: boolean;
};
