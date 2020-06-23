export interface Relation<T extends object> {
  isValid(): boolean;
  getPipeline(as: keyof T): any[];
  mapForeign(entity: T, prop: keyof T): T;
}
