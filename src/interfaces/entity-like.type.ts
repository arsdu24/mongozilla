import { ObjectId } from 'mongodb';

export type EntityLike<T extends {}> = T & {
  _id?: ObjectId;
  _stored?: boolean;
};
