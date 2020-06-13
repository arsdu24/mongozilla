import { Class, DeepPartial } from 'utility-types';
import { getSchemaFor, Schema } from './schema';
import {
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
    return Object.entries(criteria).reduce((flatten: any, [name, value]) => {
      const path: string = [previousPath, name].filter(Boolean).join('.');

      if (
        'object' === typeof value &&
        null !== value &&
        !Array.isArray(value) &&
        !isSearchCriteria(value)
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

  searchCriteriaToPipeline<T extends {}>(
    schema: Schema<T>,
    criteria: SearchCriteria<T>,
  ): any[] {
    return [
      {
        $match: this.mapSearchCriteriaToMatchPipeline(
          schema.prepareSearchCriteria(criteria),
        ),
      },
    ];
  }

  searchOptionsCriteriaToPipeline<T extends {}>(
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

  async search<T extends {}>(
    entityKlass: Class<T> | Function,
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
    const [entities, count]: [T[], number] = await Promise.all([
      await this.search(entityKlass, criteria, options),
      await this.count(entityKlass, criteria || ({} as SearchCriteria<T>)),
    ]);

    return [entities, count];
  }

  async count<T extends {}>(
    entityKlass: Class<T> | Function,
    criteria: SearchCriteria<T>,
  ): Promise<number> {
    return getSchemaFor(entityKlass as Class<T>).count(criteria);
  }

  async distinct<T extends {}, X = any>(
    entityKlass: Class<T> | Function,
    distinct: string,
    criteria?: SearchCriteria<T>,
  ): Promise<X[]> {
    return getSchemaFor(entityKlass as Class<T>).distinct<X>(
      distinct,
      criteria,
    );
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

    schema.replaceOrigin(entity, await this.findOneOrFail(entityKlass, query));

    return entity;
  }

  async update<T extends {}>(
    entityKlass: Class<any>,
    criteria: SearchCriteria<T>,
    update: DeepPartial<T> | T | UpdateCriteria<T>,
  ): Promise<UpdateWriteOpResult> {
    const schema: Schema<T> = getSchemaFor(entityKlass);
    const updateQuery: any = {};

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
      updateQuery.$set = this.mapSearchCriteriaToMatchPipeline(
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
        .map((entity) => schema.getOrigin(entity))
        .map(({ _id, _isNew, ...rest }) => rest),
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

    schema.replaceOrigin(
      entity,
      await this.insert(entityKlass, schema.getOrigin(entity)),
    );

    return entity;
  }

  async reload<T extends {}>(entity: T): Promise<T> {
    if (this.isNew(entity)) {
      return entity;
    }

    const entityKlass: Class<T> = entity.constructor as Class<any>;
    const schema: Schema<T> = getSchemaFor(entityKlass);
    const query: any = schema.getTargetSearchCriteria(entity);

    schema.replaceOrigin(entity, await this.findOneOrFail(entityKlass, query));

    return entity;
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

  async aggregate<T extends {}, X = any>(
    entityKlass: Class<any>,
    pipeline: any[],
  ): Promise<X[]> {
    return getSchemaFor(entityKlass).aggregate<X>(pipeline);
  }
}

export function getEntityManager() {
  return EntityManager.getInstance();
}
