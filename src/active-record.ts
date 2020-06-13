import { Class, DeepPartial } from 'utility-types';
import { getEntityManager } from './entity-manager';
import {
  SearchCriteria,
  SearchOptionsCriteria,
  UpdateCriteria,
} from './interfaces/criteria';
import { getSchemaFor } from './schema';
import {
  DeleteWriteOpResultObject,
  ObjectId,
  UpdateWriteOpResult,
} from 'mongodb';
import { RawEntity } from './interfaces';

export abstract class ActiveRecord<T extends {}> {
  constructor(partial?: RawEntity<T>) {
    getSchemaFor(
      this.constructor as Class<any>,
    ).proxyEntitiesProps((this as any) as any, { ...partial });
  }

  isNew(): boolean {
    return getEntityManager().isNew(this);
  }

  async save(): Promise<this> {
    return getEntityManager().save<this>(this as any);
  }

  async remove(): Promise<boolean> {
    return getEntityManager().removeEntity<this>(this as any);
  }

  async reload(): Promise<this> {
    return getEntityManager().reload<this>(this as any);
  }

  static create<T extends ActiveRecord<T>, C extends T>(
    this: Class<T>,
    partial?: DeepPartial<C> | C,
  ): T {
    return new this(partial);
  }

  static merge<T extends ActiveRecord<T>>(
    this: Class<T>,
    entity: T,
    ...partials: any[]
  ): T {
    return getEntityManager().merge(this, entity, ...partials);
  }

  static async find<T extends ActiveRecord<T>>(
    this: Class<T>,
    criteria?: SearchCriteria<T>,
    options?: SearchOptionsCriteria<T>,
  ): Promise<T[]> {
    return getEntityManager().find(this, criteria, options);
  }

  static async findAndCount<T extends ActiveRecord<T>>(
    this: Class<T>,
    criteria?: SearchCriteria<T>,
    options?: SearchOptionsCriteria<T>,
  ): Promise<[T[], number]> {
    return getEntityManager().findAndCount(this, criteria, options);
  }

  static async count<T extends ActiveRecord<T>>(
    this: Class<T>,
    criteria: SearchCriteria<T>,
  ): Promise<number> {
    return getEntityManager().count(this, criteria);
  }

  static async distinct<T extends ActiveRecord<T>>(
    this: Class<T>,
    distinct: string,
    criteria?: SearchCriteria<T>,
  ): Promise<any[]> {
    return getEntityManager().distinct(this, distinct, criteria);
  }

  static async findById<T extends ActiveRecord<T>>(
    this: Class<T>,
    id: string | ObjectId,
  ): Promise<T | undefined> {
    return getEntityManager().findById(this, id);
  }

  static async findByIdOrFail<T extends ActiveRecord<T>>(
    this: Class<T>,
    id: string | ObjectId,
  ): Promise<T> {
    return getEntityManager().findByIdOrFail(this, id);
  }

  static async findOne<T extends ActiveRecord<T>>(
    this: Class<T>,
    criteria?: SearchCriteria<T>,
    options?: SearchOptionsCriteria<T>,
  ): Promise<T | undefined> {
    return getEntityManager().findOne(this, criteria, options);
  }

  static async findOneOrFail<T extends ActiveRecord<T>>(
    this: Class<T>,
    criteria?: SearchCriteria<T>,
    options?: SearchOptionsCriteria<T>,
  ): Promise<T> {
    return getEntityManager().findOneOrFail(this, criteria, options);
  }

  static async save<T extends ActiveRecord<T>>(
    this: Class<T>,
    entity: T,
  ): Promise<T> {
    return getEntityManager().save(entity);
  }

  static async update<T extends ActiveRecord<T>>(
    this: Class<T>,
    criteria: SearchCriteria<T>,
    update: DeepPartial<T> | T | UpdateCriteria<T>,
  ): Promise<UpdateWriteOpResult> {
    return getEntityManager().update(this, criteria, update);
  }

  static async insert<T extends ActiveRecord<T>>(
    this: Class<T>,
    partials: any[],
  ): Promise<T[]>;
  static async insert<T extends ActiveRecord<T>>(
    this: Class<T>,
    partials: any,
  ): Promise<T>;
  static async insert<T extends ActiveRecord<T>>(
    this: Class<T>,
    partials: any | any[],
  ): Promise<T | T[]> {
    return getEntityManager().insert(this, partials);
  }

  static async remove<T extends ActiveRecord<T>>(
    this: Class<T>,
    criteria: SearchCriteria<T>,
  ): Promise<DeleteWriteOpResultObject> {
    return getEntityManager().remove(this, criteria);
  }

  static async aggregate<T extends ActiveRecord<T>, X = any>(
    this: Class<T>,
    pipeline: any[],
  ): Promise<X[]> {
    return getEntityManager().aggregate(this, pipeline);
  }
}
