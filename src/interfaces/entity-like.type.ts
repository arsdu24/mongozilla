import { ObjectId } from 'mongodb';
import {DeepPartial, NonFunctionKeys} from 'utility-types';

export type RawEntity<T> = T extends {}
  ? DeepPartial<Pick<T, NonFunctionKeys<T>>>
  : T;

export type EntityLike<T extends {}> = T & {
  _id?: ObjectId;
  _origin?: RawEntity<T> | any;
  _isNew?: boolean;
};
