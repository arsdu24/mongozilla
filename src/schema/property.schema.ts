import 'reflect-metadata';
import { Class } from 'utility-types';
import { flatten, head } from 'lodash/fp';
import { PropertyTypes } from '../interfaces';

export class PropertySchema<T extends {}> {
  private alias?: keyof T;
  private type!: PropertyTypes;
  private arrayDeepness = 0;
  private optional: boolean;
  private defValue?: any;

  constructor(
    private readonly entityClass: Class<T>,
    private readonly property: keyof T,
  ) {
    this.optional = false;
    this.setType(
      Reflect.getMetadata(
        'design:type',
        entityClass.prototype,
        property as string,
      ),
    );
  }

  getOriginName(): string {
    return `${this.alias || this.property}`;
  }

  setType(type: PropertyTypes): this {
    let nestedType: PropertyTypes = type;

    while (Array.isArray(nestedType)) {
      this.arrayDeepness++;

      nestedType = head(flatten([type])) || Object;
    }

    this.type = nestedType;

    return this;
  }

  setDefault(defValue: any): this {
    this.defValue = defValue;

    return this;
  }

  makeOptional(): this {
    this.optional = true;

    return this;
  }

  aliasFor(alias: string | keyof T): this {
    this.alias = alias as keyof T;

    return this;
  }

  setEntityDefault(entity: T, byAlias?: boolean): T {
    if (this.defValue) {
      const prop: keyof T = this.alias && byAlias ? this.alias : this.property;

      entity[prop] = this.defValue;
    }

    return entity;
  }

  sanitizeEntity(entity: T): T {
    if (this.alias && 'undefined' !== typeof entity[this.alias]) {
      entity[this.property] = entity[this.alias] as any;
    }

    return entity;
  }

  getType(): PropertyTypes {
    return this.type;
  }

  getPropName(): keyof T {
    return this.property;
  }

  getAliasName(): keyof T | undefined {
    return this.alias;
  }
}
