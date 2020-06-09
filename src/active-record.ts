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

export abstract class ActiveRecord<T extends {}> {
  constructor(partial?: DeepPartial<T> | T) {
    getSchemaFor(
      this.constructor as Class<T>,
    ).proxyEntitiesProps((this as any) as T, { ...partial });
  }

  isNew(): boolean {
    return getEntityManager().isNew(this);
  }

  async save(): Promise<T> {
    return getEntityManager().save<T>(this as any);
  }

  async remove(): Promise<boolean> {
    return getEntityManager().removeEntity<T>(this as any);
  }

  async reload(): Promise<T> {
    return getEntityManager().reload<T>(this as any);
  }

  static create<T extends {}>(this: Class<T>, partial?: DeepPartial<T> | T): T {
    return new this(partial);
  }

  static merge<T extends {}>(this: Class<T>, entity: T, ...partials: any[]): T {
    return getEntityManager().merge(this, entity, ...partials);
  }

  static async find<T extends {}>(
    this: Class<T>,
    criteria?: SearchCriteria<T>,
    options?: SearchOptionsCriteria<T>,
  ): Promise<T[]> {
    return getEntityManager().find(this, criteria, options);
  }

  static async findAndCount<T extends {}>(
    this: Class<T>,
    criteria?: SearchCriteria<T>,
    options?: SearchOptionsCriteria<T>,
  ): Promise<[T[], number]> {
    return getEntityManager().findAndCount(this, criteria, options);
  }

  static async findById<T extends {}>(
    this: Class<T>,
    id: string | ObjectId,
  ): Promise<T | undefined> {
    return getEntityManager().findById(this, id);
  }

  static async findByIdOrFail<T extends {}>(
    this: Class<T>,
    id: string | ObjectId,
  ): Promise<T> {
    return getEntityManager().findByIdOrFail(this, id);
  }

  static async findOne<T extends {}>(
    this: Class<T>,
    criteria?: SearchCriteria<T>,
    options?: SearchOptionsCriteria<T>,
  ): Promise<T | undefined> {
    return getEntityManager().findOne(this, criteria, options);
  }

  static async findOneOrFail<T extends {}>(
    this: Class<T>,
    criteria?: SearchCriteria<T>,
    options?: SearchOptionsCriteria<T>,
  ): Promise<T> {
    return getEntityManager().findOneOrFail(this, criteria, options);
  }

  static async save<T extends {}>(this: Class<T>, entity: T): Promise<T> {
    return getEntityManager().save(entity);
  }

  static async update<T extends {}>(
    this: Class<T>,
    criteria: SearchCriteria<T>,
    update: DeepPartial<T> | T | UpdateCriteria<T>,
  ): Promise<UpdateWriteOpResult> {
    return getEntityManager().update(this, criteria, update);
  }

  static async insert<T extends {}>(
    this: Class<T>,
    partials: any[],
  ): Promise<T[]>;
  static async insert<T extends {}>(this: Class<T>, partials: any): Promise<T>;
  static async insert<T extends {}>(
    this: Class<T>,
    partials: any | any[],
  ): Promise<T | T[]> {
    return getEntityManager().insert(this, partials);
  }

  static async remove<T extends {}>(
    this: Class<T>,
    criteria: SearchCriteria<T>,
  ): Promise<DeleteWriteOpResultObject> {
    return getEntityManager().remove(this, criteria);
  }
}
