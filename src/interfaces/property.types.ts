import { Class } from 'utility-types';
import { ObjectId } from 'mongodb';

export type PropertyTypes =
  | Class<string>
  | Class<number>
  | Class<Date>
  | Class<boolean>
  | Class<Record<string, any>>
  | Class<ObjectId>
  | PropertyTypes[];
