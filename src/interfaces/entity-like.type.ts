import { ObjectId } from 'mongodb';
import { DeepPartial } from 'utility-types';

export type EntityLike<T extends {}> = T & {
  _id?: ObjectId;
  _origin?: DeepPartial<T> | any;
};
