import { Class } from 'utility-types';
import { getSchemaFor, Schema } from './schema';
import {
  isLogicalOperatorsSearchCriteria,
  isSearchCriteria,
  isUpdateCriteria,
  SearchCriteria,
  SearchOptionsCriteria,
  UpdateCriteria,
} from './interfaces/criteria';
import {
  DeleteWriteOpResultObject,
  ObjectId,
  UpdateWriteOpResult,
} from 'mongodb';
import { RawEntity } from './interfaces';
import { EntityNotFoundException } from './exceptions';

class EntityManager {
  private static instance?: EntityManager;

  static getInstance(): EntityManager {
    if (!this.instance) {
      this.instance = new EntityManager();
    }

    return this.instance;
  }

  merge<T extends object>(
    entityKlass: Class<T>,
    entity: T,
    ...partials: RawEntity<T>[]
  ): T {
    return getSchemaFor(entityKlass as Class<T>).assign(entity, ...partials);
  }

  makeFlattenPath(criteria: any, previousPath?: string): any {
    return Object.entries(criteria).reduce((flatten: any, [name, value]) => {
      const path: string = [previousPath, name].filter(Boolean).join('.');

      if (
        'object' === typeof value &&
        null !== value &&
        !Array.isArray(value) &&
        !(value instanceof ObjectId) &&
        !isSearchCriteria(value)
      ) {
        return {
          ...flatten,
          ...this.makeFlattenPath(value, path),
        };
      }

      return { ...flatten, [path]: value };
    }, {});
  }

  mapSearchCriteriaToMatchPipeline<T extends object>(
    schema: Schema<T>,
    criteria: SearchCriteria<T>,
  ): any {
    if (isLogicalOperatorsSearchCriteria(criteria)) {
      return Object.entries(criteria).reduce(
        (flatten: object, [operator, arteries]) => ({
          ...flatten,
          [operator]: arteries.map((criteria: SearchCriteria<T>) =>
            this.makeFlattenPath(schema.prepareSearchCriteria(criteria)),
          ),
        }),
        {},
      );
    }

    return this.makeFlattenPath(schema.prepareSearchCriteria(criteria));
  }

  isNew<T extends object>(entity: T): boolean {
    return getSchemaFor(entity.constructor as Class<any>).isNew(entity);
  }

  searchCriteriaToPipeline<T extends object>(
    schema: Schema<T>,
    criteria: SearchCriteria<T>,
  ): any[] {
    return [
      {
        $match: this.mapSearchCriteriaToMatchPipeline(schema, criteria),
      },
    ];
  }

  searchOptionsCriteriaToPipeline<T extends object>(
    schema: Schema<T>,
    options: SearchOptionsCriteria<T>,
  ): any[] {
    const pipeline: any[] = [];

    if (options.$sort) {
      pipeline.push({
        $sort: options.$sort,
      });
    }

    if (options.$skip) {
      pipeline.push({
        $skip: options.$skip,
      });
    }

    if (options.$limit) {
      pipeline.push({
        $limit: options.$limit,
      });
    }

    return pipeline;
  }

  async search<T extends object>(
    entityKlass: Class<T>,
    criteria?: SearchCriteria<T>,
    options?: SearchOptionsCriteria<T>,
  ): Promise<T[]> {
    const schema: Schema<T> = getSchemaFor(entityKlass as Class<T>);
    const pipeline: any[] = [];

    if (criteria) {
      pipeline.push(...this.searchCriteriaToPipeline(schema, criteria));
    }

    if (options) {
      pipeline.push(...this.searchOptionsCriteriaToPipeline(schema, options));
    }

    return schema.search(pipeline);
  }

  async find<T extends object>(
    entityKlass: Class<T>,
    criteria?: SearchCriteria<T>,
    options?: SearchOptionsCriteria<T>,
  ): Promise<T[]> {
    return this.search(entityKlass, criteria, options);
  }

  async findAndCount<T extends object>(
    entityKlass: Class<T>,
    criteria?: SearchCriteria<T>,
    options?: SearchOptionsCriteria<T>,
  ): Promise<[T[], number]> {
    const [entities, count]: [T[], number] = await Promise.all([
      await this.search(entityKlass, criteria, options),
      await this.count(entityKlass, criteria || ({} as SearchCriteria<T>)),
    ]);

    return [entities, count];
  }

  async count<T extends object>(
    entityKlass: Class<T>,
    criteria: SearchCriteria<T>,
  ): Promise<number> {
    return getSchemaFor(entityKlass as Class<T>).count(criteria);
  }

  async distinct<T extends object, X = any>(
    entityKlass: Class<T>,
    distinct: string,
    criteria?: SearchCriteria<T>,
  ): Promise<X[]> {
    return getSchemaFor(entityKlass as Class<T>).distinct<X>(
      distinct,
      criteria,
    );
  }

  async findOne<T extends object>(
    entityKlass: Class<T>,
    criteria?: SearchCriteria<T>,
    options?: SearchOptionsCriteria<T>,
  ): Promise<T | undefined> {
    const [entity] = await this.search(entityKlass, criteria, {
      ...options,
      $limit: 1,
    });

    return entity;
  }

  async findOneOrFail<T extends object>(
    entityKlass: Class<T>,
    criteria?: SearchCriteria<T>,
    options?: SearchOptionsCriteria<T>,
  ): Promise<T> {
    const entity: T | undefined = await this.findOne(
      entityKlass,
      criteria,
      options,
    );

    if (!entity) {
      throw new EntityNotFoundException(entityKlass, criteria, options);
    }

    return entity;
  }

  async findById<T extends object>(
    entityKlass: Class<T>,
    id: string | ObjectId,
  ): Promise<T | undefined> {
    const schema: Schema<T> = getSchemaFor(entityKlass as Class<T>);

    return this.findOne(entityKlass, {
      [schema.getIdProp()]: 'string' === typeof id ? new ObjectId(id) : id,
    });
  }

  async findByIdOrFail<T extends object>(
    entityKlass: Class<T>,
    id: string | ObjectId,
  ): Promise<T> {
    const entity: T | undefined = await this.findById(entityKlass, id);

    if (!entity) {
      throw new EntityNotFoundException(entityKlass, {
        [getSchemaFor(entityKlass).getIdProp()]:
          'string' === typeof id ? new ObjectId(id) : id,
      });
    }

    return entity;
  }

  async updateEntity<T extends object>(entity: T): Promise<T> {
    const entityKlass: Class<T> = entity.constructor as Class<any>;
    const schema: Schema<T> = getSchemaFor(entityKlass);
    const query: any = schema.getTargetSearchCriteria(entity);

    await schema.update(query, { $set: schema.getOrigin(entity) });

    schema.replaceOrigin(entity, await this.findOneOrFail(entityKlass, query));

    return entity;
  }

  async update<T extends object>(
    entityKlass: Class<any>,
    criteria: SearchCriteria<T>,
    update: RawEntity<T> | UpdateCriteria<T>,
  ): Promise<UpdateWriteOpResult> {
    const schema: Schema<T> = getSchemaFor(entityKlass);
    const updateQuery: any = {};

    if (isUpdateCriteria(update)) {
      if (update.$inc) {
        updateQuery.$inc = this.mapSearchCriteriaToMatchPipeline(
          schema,
          update.$inc,
        );
      }

      if (update.$set) {
        updateQuery.$set = this.mapSearchCriteriaToMatchPipeline(
          schema,
          update.$set,
        );
      }

      if (update.$unset) {
        updateQuery.$unset = this.mapSearchCriteriaToMatchPipeline(
          schema,
          update.$unset,
        );
      }
    } else {
      updateQuery.$set = this.mapSearchCriteriaToMatchPipeline(schema, update);
    }

    return schema.update(
      this.mapSearchCriteriaToMatchPipeline(schema, criteria),
      updateQuery,
    );
  }

  async insert<T extends object>(
    entityKlass: Class<T>,
    partial: RawEntity<T>,
  ): Promise<T>;
  async insert<T extends object>(
    entityKlass: Class<T>,
    partials: RawEntity<T>[],
  ): Promise<T[]>;
  async insert<T extends object>(
    entityKlass: Class<T>,
    partials: RawEntity<T> | RawEntity<T>[],
  ): Promise<T | T[]> {
    const E: Class<T> = entityKlass as Class<T>;
    const schema: Schema<T> = getSchemaFor(E);
    const many: boolean = Array.isArray(partials);

    const entities: T[] = await schema.insert(
      Array.isArray(partials) ? partials : [partials],
    );

    if (!many) {
      return entities[0];
    }

    return entities;
  }

  async save<T extends object>(entity: T): Promise<T> {
    const entityKlass: Class<T> = entity.constructor as Class<any>;
    const schema: Schema<T> = getSchemaFor(entityKlass);

    if (!this.isNew(entity)) {
      return this.updateEntity(entity);
    }

    schema.replaceOrigin(
      entity,
      await this.insert(entityKlass, schema.getOrigin(entity)),
    );

    return entity;
  }

  async reload<T extends object>(entity: T): Promise<T> {
    if (this.isNew(entity)) {
      return entity;
    }

    const entityKlass: Class<T> = entity.constructor as Class<any>;
    const schema: Schema<T> = getSchemaFor(entityKlass);
    const query: any = schema.getTargetSearchCriteria(entity);

    schema.replaceOrigin(entity, await this.findOneOrFail(entityKlass, query));

    return entity;
  }

  async remove<T extends object>(
    entityKlass: Class<any>,
    criteria: SearchCriteria<T>,
  ): Promise<DeleteWriteOpResultObject> {
    const schema: Schema<T> = getSchemaFor(entityKlass);

    return schema.remove(
      this.mapSearchCriteriaToMatchPipeline(schema, criteria),
    );
  }

  async removeEntity<T extends object>(entity: T): Promise<boolean> {
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

  async aggregate<T extends object, X = any>(
    entityKlass: Class<any>,
    pipeline: any[],
  ): Promise<X[]> {
    return getSchemaFor(entityKlass).aggregate<X>(pipeline);
  }
}

export function getEntityManager() {
  return EntityManager.getInstance();
}
