import 'reflect-metadata';
import { Class } from 'utility-types';
import { flatten, head } from 'lodash/fp';
import { EntityLike, PropertyTypes } from '../interfaces';

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

  getDefault(): any {
    return this.defValue;
  }

  makeOptional(): this {
    this.optional = true;

    return this;
  }

  aliasFor(alias: string | keyof T): this {
    this.alias = alias as keyof T;

    return this;
  }

  getDescriptor(entity: EntityLike<T>): PropertyDescriptor {
    const prop: any = this.alias || this.property;

    if (
      'undefined' === typeof entity._origin[prop] &&
      'undefined' !== typeof this.defValue
    ) {
      entity._origin[prop] = this.defValue;
    }

    return {
      get: (): any => {
        return entity._origin[prop];
      },
      set: (v: any): any => {
        return (entity._origin[prop] = v);
      },
      enumerable: true,
    };
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
