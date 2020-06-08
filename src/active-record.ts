import { Class, DeepPartial } from 'utility-types';
import { getEntityManager } from './entity-manager';
import { SearchCriteria, SearchOptionsCriteria } from './interfaces/criteria';
import { getSchemaFor } from './schema';
import { ObjectId } from 'mongodb';

export abstract class ActiveRecord<T extends {}> {
  constructor(partial?: DeepPartial<T> | T) {
    const partials: DeepPartial<T>[] = [
      getSchemaFor((new.target as unknown) as Class<T>).getDefaultValues(),
      partial as DeepPartial<T>,
    ].filter((partial: DeepPartial<T> | undefined): partial is DeepPartial<
      T
    > => {
      return !!partial;
    });

    return getEntityManager().merge(new.target, this as any, ...partials);
  }

  isNew(): boolean {
    return getEntityManager().isNew(this);
  }

  async save(): Promise<T> {
    return getEntityManager().save<T>(this as any);
  }

  async remove(): Promise<boolean> {
    return getEntityManager().remove<T>(this as any);
  }

  async reload(): Promise<T> {
    return getEntityManager().reload<T>(this as any);
  }

  static create<T extends ActiveRecord<any>>(
    this: Class<T>,
    partial?: DeepPartial<T> | T,
  ): T {
    return new this(partial);
  }

  static merge<T extends ActiveRecord<any>>(
    this: Class<T>,
    entity: T,
    ...partials: (DeepPartial<T> | T)[]
  ): T {
    return getEntityManager().merge(this, entity, ...partials);
  }

  static async find<T extends ActiveRecord<any>>(
    this: Class<T>,
    criteria?: SearchCriteria<T>,
    options?: SearchOptionsCriteria<T>,
  ): Promise<T[]> {
    return getEntityManager().find(this, criteria, options);
  }

  static async findById<T extends ActiveRecord<any>>(
    this: Class<T>,
    id: string | ObjectId,
  ): Promise<T | undefined> {
    return getEntityManager().findById(this, id);
  }

  static async findByIdOrFail<T extends ActiveRecord<any>>(
    this: Class<T>,
    id: string | ObjectId,
  ): Promise<T | undefined> {
    return getEntityManager().findByIdOrFail(this, id);
  }

  static async findOne<T extends ActiveRecord<any>>(
    this: Class<T>,
    criteria?: SearchCriteria<T>,
    options?: SearchOptionsCriteria<T>,
  ): Promise<T | undefined> {
    return getEntityManager().findOne(this, criteria, options);
  }

  static async findOneOrFail<T extends ActiveRecord<any>>(
    this: Class<T>,
    criteria?: SearchCriteria<T>,
    options?: SearchOptionsCriteria<T>,
  ): Promise<T> {
    return getEntityManager().findOneOrFail(this, criteria, options);
  }

  static async save<T extends ActiveRecord<any>>(
    this: Class<T>,
    entity: T,
  ): Promise<T> {
    return getEntityManager().save(entity);
  }

  static async update<T extends ActiveRecord<any>>(
    this: Class<T>,
    entity: T,
  ): Promise<T> {
    return getEntityManager().update(entity);
  }

  static async insertOne<T extends ActiveRecord<any>>(
    this: Class<T>,
    partials: DeepPartial<T> | T,
  ): Promise<T> {
    return getEntityManager().insert(this, partials);
  }

  static async insertMany<T extends ActiveRecord<any>>(
    this: Class<T>,
    ...partials: (DeepPartial<T> | T)[]
  ): Promise<T[]> {
    return getEntityManager().insert(this, partials);
  }

  static async remove<T extends ActiveRecord<any>>(
    this: Class<T>,
    entity: T,
  ): Promise<boolean> {
    return getEntityManager().remove(entity);
  }
}
