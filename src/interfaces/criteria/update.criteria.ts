import {RawEntity} from "../entity-like.type";

export type KeysWith<T, X> = {
  [P in keyof T]?: X;
};

export type UpdateCriteria<T extends {}> = {
  $inc?: KeysWith<T, number>;
  $set?: RawEntity<T> | T;
  $unset?: RawEntity<T> | T;
};

export function isUpdateCriteria(
  criteria: any,
): criteria is UpdateCriteria<any> {
  return ['$inc', '$set', '$unset'].some((key) => key in criteria);
}
