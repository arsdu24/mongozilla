import { ObjectId } from 'mongodb';
import { DeepPartial } from 'utility-types';
import { nowDate, someId } from '../consts';

export interface IUser {
  id: ObjectId;
  name: string;
  age: number;
  isAdmin: boolean;
  createdAt: Date;
}

export const userMocks: DeepPartial<IUser & { _id: ObjectId }>[] = [
  {
    _id: someId,
    name: 'MongoZilla',
    age: 21,
    isAdmin: true,
    createdAt: nowDate,
  },
];
