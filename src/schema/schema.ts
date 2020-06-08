import { Class, DeepPartial } from 'utility-types';
import { camelCase, endsWith, mergeAll, identity } from 'lodash/fp';
import { EntityLike, ISchemaOptions, SearchCriteria } from '../interfaces';
import { PropertySchema } from './property.schema';
import { Relation } from '../relations';
import { Collection, ObjectId } from 'mongodb';
import { getConnection } from '../connection';

export class Schema<T extends {}> {
  private primaryKeySchema?: PropertySchema<T>;
  private properties: Map<keyof T, PropertySchema<T>> = new Map();
  private relations: Map<keyof T, Relation<any>> = new Map();
  private foreignKeys: Map<() => Class<any>, PropertySchema<T>> = new Map();
  private options: ISchemaOptions;

  constructor(private readonly entityClass: Class<T>) {
    let collection: string = camelCase(entityClass.name);

    if (!endsWith('s', collection)) {
      collection = `${collection}s`;
    }

    this.options = {
      collection,
    };
  }

  get collection(): Collection {
    return getConnection(this.options.connection).getCollection(
      this.options.collection,
    );
  }

  getEntityClass(): Class<T> {
    return this.entityClass;
  }

  getCollectionName(): string {
    return this.options.collection;
  }

  hasPrimaryKey(): boolean {
    return !!this.primaryKeySchema;
  }

  getPrimaryKeyOriginProperty(): string {
    if (this.primaryKeySchema) {
      return this.primaryKeySchema.getOriginName();
    }

    return '_id';
  }

  getForeignKeySchemaFor(
    entityClass: Class<any>,
  ): PropertySchema<any> | undefined {
    const entries: [() => Class<any>, PropertySchema<any>][] = [
      ...this.foreignKeys.entries(),
    ];
    const match = entries.find(([entityClassResolver]) => {
      return entityClass === entityClassResolver();
    });

    if (match) {
      return match[1];
    }
  }

  hasForeignKeyFor(entityClass: Class<any>): boolean {
    return !!this.getForeignKeySchemaFor(entityClass);
  }

  getForeignKeyOriginFor(entityClass: Class<any>): string {
    const schema = this.getForeignKeySchemaFor(entityClass);

    if (schema) {
      return schema.getOriginName();
    }

    return '_id';
  }

  getPropertySchema(property: keyof T): PropertySchema<T> {
    let propSchema: PropertySchema<T> | undefined = this.properties.get(
      property,
    );

    if (!propSchema) {
      propSchema = new PropertySchema<T>(this.entityClass, property);

      this.properties.set(property, propSchema);
    }

    return propSchema;
  }

  mergeOptions(options: ISchemaOptions): this {
    this.options = {
      ...this.options,
      ...options,
    };

    return this;
  }

  setPrimaryKey(propertySchema: PropertySchema<T>): this {
    this.primaryKeySchema = propertySchema;

    return this;
  }

  setForeignKey(
    foreignEntity: () => Class<any>,
    propertySchema: PropertySchema<T>,
  ): this {
    this.foreignKeys.set(foreignEntity, propertySchema);

    return this;
  }

  registerRelation(property: keyof T, relation: Relation<any>): this {
    this.relations.set(property, relation);

    return this;
  }

  getDefaultValues(byAlias?: boolean): DeepPartial<T> {
    return [...this.properties.values()].reduce(
      (def: any, propSchema: PropertySchema<T>) =>
        propSchema.setEntityDefault(def, byAlias),
      { _id: new ObjectId() } as any,
    );
  }

  assign(entity: T, ...partial: (DeepPartial<T> | T)[]): T {
    const { _id } = entity as EntityLike<T>;
    const merged = mergeAll([
      entity,
      ...partial,
      { _id: _id || new ObjectId() },
    ]);
    const sanitized = [...this.properties.values()].reduce(
      (entity: T, schema: PropertySchema<T>) => schema.sanitizeEntity(entity),
      merged,
    );

    return Object.assign(entity, sanitized);
  }

  makeRelationsPipe(): any[] {
    return [...this.relations.entries()].reduce(
      (pipeline: any[], [key, relation]) => [
        ...pipeline,
        ...relation.getPipeline(key),
      ],
      [],
    );
  }

  prepareSearchCriteria(criteria: SearchCriteria<T>): SearchCriteria<T> {
    return [...this.properties.values()].reduce(
      (criteria: SearchCriteria<T>, propSchema: PropertySchema<T>) => {
        const alias: keyof T | undefined = propSchema.getAliasName();
        let value: any = criteria[propSchema.getPropName()];
        const rewriteCriteriaValue = (newValue: any) =>
          (value = criteria[propSchema.getPropName()] = newValue);

        if (propSchema.getType() === ObjectId && 'string' === typeof value) {
          try {
            rewriteCriteriaValue(new ObjectId(value));
          } catch (e) {
            rewriteCriteriaValue(new ObjectId());
          }
        }

        if (alias && 'undefined' !== typeof value) {
          criteria[alias] = value;

          delete criteria[propSchema.getPropName()];
        }

        return criteria;
      },
      criteria,
    );
  }

  isNew(entity: T): boolean {
    return !(entity as EntityLike<T>)._stored;
  }

  getIdProp(): keyof T {
    const primaryKeyProp: [keyof T, PropertySchema<T>] | undefined = [
      ...this.properties.entries(),
    ].find(([, schema]) => schema === this.primaryKeySchema);
    return primaryKeyProp ? primaryKeyProp[0] : ('_id' as keyof T);
  }

  getId(entity: T): ObjectId | undefined {
    const idProp: keyof T = this.getIdProp();
    const value: string | ObjectId | undefined = entity[idProp] as any;

    if (value) {
      return 'string' === typeof value ? new ObjectId(value) : value;
    }
  }

  getTargetSearchCriteria(entity: T): any {
    return { [this.getIdProp()]: this.getId(entity) };
  }

  getOrigin(entity: T): any {
    return [...this.properties.values()].reduce(
      (origin: any, propSchema: PropertySchema<T>) => {
        const prop: keyof T = propSchema.getPropName();
        const alias: keyof T | undefined = propSchema.getAliasName();
        const value: any = entity[prop];

        if ('undefined' !== typeof value) {
          origin[alias || prop] = value;
        }

        return origin;
      },
      {},
    );
  }

  async search(pipeline: any[]): Promise<T[]> {
    const pipelines = [...pipeline, ...this.makeRelationsPipe()].filter(
      Boolean,
    );

    const results = await this.collection.aggregate(pipelines).toArray();

    return results.map((data: EntityLike<T>) => {
      const entity: EntityLike<T> = new this.entityClass(data);

      Object.defineProperties(entity, {
        _id: {
          get: () => data._id,
          set: identity,
        },
        _stored: {
          get: () => true,
          set: identity,
        },
      });

      return [...this.relations.entries()].reduce(
        (entity: T, [prop, relation]) => relation.mapForeign(entity, prop),
        entity,
      );
    });
  }

  async update(criteria: SearchCriteria<T>, update: any): Promise<void> {
    await this.collection.updateMany(
      this.prepareSearchCriteria(criteria),
      update,
    );
  }

  async insert(partials: any[]): Promise<T[]> {
    const result = await this.collection.insertMany(partials);
    const ids: ObjectId[] = Object.values(result.insertedIds);

    return this.search([
      {
        $match: {
          [this.getIdProp()]: {
            $in: ids,
          },
        },
      },
    ]);
  }

  async remove(query: any): Promise<number> {
    const result = await this.collection.deleteMany(query);

    return result.deletedCount || 0;
  }
}
