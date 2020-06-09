import { Class, DeepPartial } from 'utility-types';
import { camelCase, endsWith, mergeAll, identity } from 'lodash/fp';
import { EntityLike, ISchemaOptions, SearchCriteria } from '../interfaces';
import { PropertySchema } from './property.schema';
import { Relation } from '../relations';
import {
  Collection,
  DeleteWriteOpResultObject,
  ObjectId,
  UpdateWriteOpResult,
} from 'mongodb';
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

  isValid(): boolean {
    return ![...this.relations.values()].some(
      (relation) => !relation.isValid(),
    );
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

  prepareOrigin(data: any): any {
    return [...this.properties.values()].reduce(
      (def: EntityLike<T>, schema: PropertySchema<T>) => ({
        ...def,
        [schema.getOriginName()]:
          schema.getDefault() || data[schema.getOriginName()],
      }),
      {} as EntityLike<T>,
    );
  }

  proxyEntitiesProps(entity: T, data: any = {}) {
    const origin: any = this.prepareOrigin(data);

    Object.defineProperties(entity, {
      _origin: {
        get: () => origin,
        set: identity,
        enumerable: false,
      },
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
    from._origin = { ...to._origin };
  }

  assign(entity: T, ...partial: (DeepPartial<T> | T)[]): T {
    return mergeAll([entity, ...partial]);
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
    return !(entity as EntityLike<T>)._origin?._id;
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

  getOrigin(entity: EntityLike<T>): any {
    return entity._origin;
  }

  async search(pipeline: any[]): Promise<T[]> {
    const pipelines = [...pipeline, ...this.makeRelationsPipe()].filter(
      Boolean,
    );

    const results = await this.collection.aggregate(pipelines).toArray();

    return results.map((data: EntityLike<T>) => {
      return new this.entityClass({ ...data, _stored: true });
    });
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

  async remove(query: any): Promise<DeleteWriteOpResultObject> {
    return this.collection.deleteMany(query);
  }
}
