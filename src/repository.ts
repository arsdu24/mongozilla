import {Class} from 'utility-types';
import {getEntityManager} from './entity-manager';
import {SearchCriteria, SearchOptionsCriteria} from './interfaces/criteria';
import {ObjectId} from 'mongodb';
import {RawEntity} from "./interfaces";

export abstract class Repository<T extends {}> {
  protected constructor(private readonly entityKlass: Class<T>) {}

  create(partial?: RawEntity<T>): T {
    return new (this.entityKlass as Class<T>)(partial);
  }

  merge(entity: T, ...partials: RawEntity<T>[]): T {
    return getEntityManager().merge(this.entityKlass, entity, ...partials);
  }

  async find(
    criteria?: SearchCriteria<T>,
    options?: SearchOptionsCriteria<T>,
  ): Promise<T[]> {
    return getEntityManager().find(this.entityKlass, criteria, options);
  }

  async findById(id: string | ObjectId): Promise<T | undefined> {
    return getEntityManager().findById(this.entityKlass, id);
  }

  async findByIdOrFail(id: string | ObjectId): Promise<T | undefined> {
    return getEntityManager().findByIdOrFail(this.entityKlass, id);
  }

  async findOne(
    criteria?: SearchCriteria<T>,
    options?: SearchOptionsCriteria<T>,
  ): Promise<T | undefined> {
    return getEntityManager().findOne(this.entityKlass, criteria, options);
  }

  async findOneOrFail(
    criteria?: SearchCriteria<T>,
    options?: SearchOptionsCriteria<T>,
  ): Promise<T> {
    return getEntityManager().findOneOrFail(
      this.entityKlass,
      criteria,
      options,
    );
  }

  async save(entity: T): Promise<T> {
    return getEntityManager().save(entity);
  }

  async update(entity: T): Promise<T> {
    return getEntityManager().updateEntity(entity);
  }

  async insertOne(partials: RawEntity<T>): Promise<T> {
    return getEntityManager().insert(this.entityKlass, partials);
  }

  async insertMany(...partials: RawEntity<T>[]): Promise<T[]> {
    return getEntityManager().insert(this.entityKlass, partials);
  }

  async remove(entity: T): Promise<boolean> {
    return getEntityManager().removeEntity(entity);
  }
}
