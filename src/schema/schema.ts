import { Class } from 'utility-types';
import {
  camelCase,
  endsWith,
  identity,
  mergeAll,
  pickBy,
  isUndefined,
} from 'lodash/fp';
import {
  EntityLike,
  ISchemaOptions,
  RawEntity,
  SearchCriteria,
} from '../interfaces';
import { PropertySchema } from './property.schema';
import { Relation } from '../relations';
import {
  Collection,
  DeleteWriteOpResultObject,
  FilterQuery,
  ObjectId,
  UpdateWriteOpResult,
} from 'mongodb';
import { getEntityConnection } from '../connection';

export class Schema<T extends object> {
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
    return getEntityConnection(this.entityClass).getCollection(
      this.options.collection,
    );
  }

  getEntityClass(): Class<T> {
    return this.entityClass;
  }

  getCollectionName(): string {
    return this.options.collection;
  }

  getConnectionName(): string {
    return this.options.connection || 'default';
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

  prepareOrigin(data: any): any {
    const origin: any = [...this.properties.values()].reduce(
      (def: EntityLike<T>, schema: PropertySchema<T>) => ({
        ...def,
        [schema.getOriginName()]:
          data[schema.getOriginName()] || schema.getDefault(),
      }),
      {} as EntityLike<T>,
    );

    Object.defineProperties(origin, {
      _id: {
        get: () => data._id || new ObjectId(),
        set: identity,
        configurable: false,
      },
      _isNew: {
        value: !data._id,
        writable: false,
        configurable: false,
      },
    });

    return origin;
  }

  proxyEntitiesProps(entity: EntityLike<T>, data: any = {}) {
    Object.defineProperty(entity, '_origin', {
      value: this.prepareOrigin(data),
      configurable: false,
      enumerable: false,
      writable: true,
    });

    Object.defineProperties(
      entity,
      [...this.properties.values()].reduce(
        (
          descriptor: PropertyDescriptorMap,
          schema: PropertySchema<T>,
        ): PropertyDescriptorMap => ({
          ...descriptor,
          [schema.getPropName()]: schema.getDescriptor(entity),
        }),
        {},
      ),
    );

    [...this.relations.keys()].reduce((entity: T, prop: keyof T) => {
      entity[prop] = data[prop];

      return entity;
    }, entity);

    [...this.relations.entries()].reduce(
      (entity: T, [prop, relation]) => relation.mapForeign(entity, prop),
      entity,
    );
  }

  replaceOrigin(from: EntityLike<T>, to: EntityLike<T>) {
    from._origin = this.prepareOrigin({ ...to._origin });
  }

  assign(entity: T, ...partial: RawEntity<T>[]): T {
    return Object.assign(entity, mergeAll(partial));
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
        const alias:
          | keyof SearchCriteria<T>
          | undefined = propSchema.getAliasName() as keyof SearchCriteria<T>;
        let value: any =
          criteria[propSchema.getPropName() as keyof SearchCriteria<T>];
        const rewriteCriteriaValue = (newValue: any) =>
          (value = criteria[
            propSchema.getPropName() as keyof SearchCriteria<T>
          ] = newValue);

        if (propSchema.getType() === ObjectId && 'string' === typeof value) {
          try {
            rewriteCriteriaValue(new ObjectId(value));
          } catch (e) {
            rewriteCriteriaValue(new ObjectId());
          }
        }

        if (alias && 'undefined' !== typeof value) {
          criteria[alias] = value;

          delete criteria[propSchema.getPropName() as keyof SearchCriteria<T>];
        }

        return criteria;
      },
      criteria,
    );
  }

  isNew(entity: EntityLike<T>): boolean {
    return !!entity._origin?._isNew;
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
    return { _id: this.getId(entity) };
  }

  getOrigin(entity: EntityLike<T>): any {
    const { _isNew, _id, ...rest } = entity._origin;

    return pickBy((value) => !isUndefined(value), rest) || _id || _isNew;
  }

  async search(pipeline: any[]): Promise<T[]> {
    const pipelines = [...pipeline, ...this.makeRelationsPipe()].filter(
      Boolean,
    );

    const results = await this.aggregate(pipelines);

    return results.map((data: EntityLike<T>) => {
      return new this.entityClass({ ...data, _stored: true });
    });
  }

  async aggregate<X = any>(pipeline: any[]): Promise<X[]> {
    return this.collection.aggregate(pipeline).toArray();
  }

  async count(criteria: SearchCriteria<T>): Promise<number> {
    return this.collection.countDocuments(this.prepareSearchCriteria(criteria));
  }

  async distinct<X>(
    distinct: string,
    criteria?: SearchCriteria<T>,
  ): Promise<X[]> {
    let filter: FilterQuery<T> = {};

    if (criteria) {
      filter = this.prepareSearchCriteria(criteria) as FilterQuery<T>;
    }

    return this.collection.distinct(distinct, filter);
  }

  async update(
    criteria: SearchCriteria<T>,
    update: any,
  ): Promise<UpdateWriteOpResult> {
    return this.collection.updateMany(
      this.prepareSearchCriteria(criteria),
      update,
    );
  }

  async insert(partials: EntityLike<RawEntity<T>>[]): Promise<T[]> {
    const rawEntities: EntityLike<T>[] = partials.map((partial) =>
      this.getOrigin(
        partial instanceof this.entityClass
          ? partial
          : new this.entityClass(partial),
      ),
    );

    const result = await this.collection.insertMany(rawEntities);
    const ids: ObjectId[] = Object.values(result.insertedIds);

    return this.search([
      {
        $match: {
          _id: {
            $in: ids,
          },
        },
      },
    ]);
  }

  async remove(query: any): Promise<DeleteWriteOpResultObject> {
    return this.collection.deleteMany(query);
  }
}
