import {Class, DeepPartial} from 'utility-types';
import {isObject, overEvery, overSome,} from 'lodash/fp';
import {getSchemaFor, Schema} from './schema';
import {isUpdateCriteria, SearchCriteria, SearchOptionsCriteria, UpdateCriteria,} from './interfaces/criteria';
import {DeleteWriteOpResultObject, ObjectId, UpdateWriteOpResult,} from 'mongodb';

class EntityManager {
  private static instance?: EntityManager;

  static getInstance(): EntityManager {
    if (!this.instance) {
      this.instance = new EntityManager();
    }

    return this.instance;
  }

  merge<T extends {}>(
    entityKlass: Class<T> | Function,
    entity: T,
    ...partials: (DeepPartial<T> | T)[]
  ): T {
    return getSchemaFor(entityKlass as Class<T>).assign(entity, ...partials);
  }

  mapSearchCriteriaToMatchPipeline<T extends {}>(
    criteria: SearchCriteria<T>,
    previousPath?: string,
  ): any {
    const isQuery = overSome([
      overEvery([isObject]),
      (obj) => obj instanceof ObjectId,
    ]);

    return Object.entries(criteria).reduce((flatten: any, [name, value]) => {
      const path: string = [previousPath, name].filter(Boolean).join('.');

      if (
        'object' === typeof value &&
        null !== value &&
        !Array.isArray(value) &&
        !isQuery(value)
      ) {
        return {
          ...flatten,
          ...this.mapSearchCriteriaToMatchPipeline(value, path),
        };
      }

      return { ...flatten, [path]: value };
    }, {});
  }

  isNew<T extends {}>(entity: T): boolean {
    return getSchemaFor(entity.constructor as Class<any>).isNew(entity);
  }

  async search<T extends {}>(
    entityKlass: Class<T> | Function,
    criteria?: SearchCriteria<T>,
    options?: SearchOptionsCriteria<T>,
  ): Promise<T[]> {
    const schema: Schema<T> = getSchemaFor(entityKlass as Class<T>);
    const pipeline: any[] = [];

    if (criteria) {
      pipeline.push({
        $match: this.mapSearchCriteriaToMatchPipeline(
          schema.prepareSearchCriteria(criteria),
        ),
      });
    }

    if (options?.$sort) {
      pipeline.push({
        $sort: options.$sort,
      });
    }

    if (options?.$skip) {
      pipeline.push({
        $skip: options.$skip,
      });
    }

    if (options?.$limit) {
      pipeline.push({
        $limit: options.$limit,
      });
    }

    return await schema.search(pipeline);
  }

  async find<T extends {}>(
    entityKlass: Class<T> | Function,
    criteria?: SearchCriteria<T>,
    options?: SearchOptionsCriteria<T>,
  ): Promise<T[]> {
    return this.search(entityKlass, criteria, options);
  }

  async findAndCount<T extends {}>(
    entityKlass: Class<T> | Function,
    criteria?: SearchCriteria<T>,
    options?: SearchOptionsCriteria<T>,
  ): Promise<[T[], number]> {
    const entities: T[] = await this.search(entityKlass, criteria, options);

    return [entities, entities.length];
  }

  async findOne<T extends {}>(
    entityKlass: Class<T> | Function,
    criteria?: SearchCriteria<T>,
    options?: SearchOptionsCriteria<T>,
  ): Promise<T | undefined> {
    const [entity] = await this.search(entityKlass, criteria, {
      ...options,
      $limit: 1,
    });

    return entity;
  }

  async findOneOrFail<T extends {}>(
    entityKlass: Class<T> | Function,
    criteria?: SearchCriteria<T>,
    options?: SearchOptionsCriteria<T>,
  ): Promise<T> {
    const entity: T | undefined = await this.findOne(
      entityKlass,
      criteria,
      options,
    );

    if (!entity) {
      throw new Error(`Entity not found`);
    }

    return entity;
  }

  async findById<T extends {}>(
    entityKlass: Class<T> | Function,
    id: string | ObjectId,
  ): Promise<T | undefined> {
    const schema: Schema<T> = getSchemaFor(entityKlass as Class<T>);

    return this.findOne(entityKlass, {
      [schema.getIdProp()]: 'string' === typeof id ? new ObjectId(id) : id,
    } as any);
  }

  async findByIdOrFail<T extends {}>(
    entityKlass: Class<T> | Function,
    id: string | ObjectId,
  ): Promise<T> {
    const entity: T | undefined = await this.findById(entityKlass, id);

    if (!entity) {
      throw new Error(`Entity not found`);
    }

    return entity;
  }

  async updateEntity<T extends {}>(entity: T): Promise<T> {
    const entityKlass: Class<T> = entity.constructor as Class<any>;
    const schema: Schema<T> = getSchemaFor(entityKlass);
    const query: any = schema.getTargetSearchCriteria(entity);

    await schema.update(query, { $set: schema.getOrigin(entity) });

    return this.merge(
      entityKlass,
      entity,
      await this.findOneOrFail(entityKlass, query),
    );
  }

  async update<T extends {}>(
    entityKlass: Class<any>,
    criteria: SearchCriteria<T>,
    update: DeepPartial<T> | T | UpdateCriteria<T>,
  ): Promise<UpdateWriteOpResult> {
    const schema: Schema<T> = getSchemaFor(entityKlass);
    let updateQuery: any = {};

    if (isUpdateCriteria(update)) {
      if (update.$inc) {
        updateQuery.$inc = this.mapSearchCriteriaToMatchPipeline(
          schema.prepareSearchCriteria(update.$inc as any),
        );
      }

      if (update.$set) {
        updateQuery.$inc = this.mapSearchCriteriaToMatchPipeline(
          schema.prepareSearchCriteria(update.$set as any),
        );
      }

      if (update.$unset) {
        updateQuery.$inc = this.mapSearchCriteriaToMatchPipeline(
          schema.prepareSearchCriteria(update.$unset as any),
        );
      }
    } else {
      updateQuery = this.mapSearchCriteriaToMatchPipeline(
        schema.prepareSearchCriteria(update),
      );
    }

    return schema.update(
      this.mapSearchCriteriaToMatchPipeline(
        schema.prepareSearchCriteria(criteria),
      ),
      updateQuery,
    );
  }

  async insert<T extends {}>(
    entityKlass: Class<T> | Function,
    partials: DeepPartial<T> | T,
  ): Promise<T>;
  async insert<T extends {}>(
    entityKlass: Class<T> | Function,
    partials: (DeepPartial<T> | T)[],
  ): Promise<T[]>;
  async insert<T extends {}>(
    entityKlass: Class<T> | Function,
    partials: DeepPartial<T> | T | (DeepPartial<T> | T)[],
  ): Promise<T | T[]> {
    const E: Class<T> = entityKlass as Class<T>;
    const schema: Schema<T> = getSchemaFor(E);
    const many: boolean = Array.isArray(partials);

    const entities: T[] = await schema.insert(
      (Array.isArray(partials) ? partials : [partials])
        .map((partial) => new E(partial))
        .map((entity) => schema.getOrigin(entity)),
    );

    if (!many) {
      return entities[0];
    }

    return entities;
  }

  async save<T extends {}>(entity: T): Promise<T> {
    const entityKlass: Class<T> = entity.constructor as Class<any>;
    const schema: Schema<T> = getSchemaFor(entityKlass);

    if (!this.isNew(entity)) {
      return this.updateEntity(entity);
    }

    return this.merge(
      entityKlass,
      entity,
      await this.insert(entityKlass, schema.getOrigin(entity)),
    );
  }

  async reload<T extends {}>(entity: T): Promise<T> {
    if (this.isNew(entity)) {
      return entity;
    }

    const entityKlass: Class<T> = entity.constructor as Class<any>;
    const schema: Schema<T> = getSchemaFor(entityKlass);
    const query: any = schema.getTargetSearchCriteria(entity);

    return this.merge(
      entityKlass,
      entity,
      await this.findOneOrFail(entityKlass, query),
    );
  }

  async remove<T extends {}>(
    entityKlass: Class<any>,
    criteria: SearchCriteria<T>,
  ): Promise<DeleteWriteOpResultObject> {
    const schema: Schema<T> = getSchemaFor(entityKlass);

    return await schema.remove(
      this.mapSearchCriteriaToMatchPipeline(
        schema.prepareSearchCriteria(criteria),
      ),
    );
  }

  async removeEntity<T extends {}>(entity: T): Promise<boolean> {
    const entityKlass: Class<T> = entity.constructor as Class<any>;
    const schema: Schema<T> = getSchemaFor(entityKlass);

    if (!this.isNew(entity)) {
      const result: DeleteWriteOpResultObject = await schema.remove(
        schema.getTargetSearchCriteria(entity),
      );

      return result.deletedCount === 1;
    }

    return false;
  }
}

export function getEntityManager() {
  return EntityManager.getInstance();
}
