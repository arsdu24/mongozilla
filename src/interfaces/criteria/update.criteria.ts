import { DeepPartial } from 'utility-types';

export type KeysWith<T, X> = {
  [P in keyof T]?: X;
};

export type UpdateCriteria<T extends {}> = {
  $inc?: KeysWith<T, number>;
  $set?: DeepPartial<T> | T;
  $unset?: DeepPartial<T> | T;
};

export function isUpdateCriteria(
  criteria: any,
): criteria is UpdateCriteria<any> {
  return ['$inc', '$set', '$unset'].some((key) => key in criteria);
}
