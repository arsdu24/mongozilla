import { getSchemaFor, Schema } from '../schema';
import { Relation } from './relation.type';
import { Class } from 'utility-types';

export class BelongsToRelation<Child extends {}, Parent extends {}>
  implements Relation<Child> {
  constructor(
    private childSchema: Schema<Child>,
    private parentRef: () => Class<Parent>,
  ) {}

  mapForeign(entity: Child, prop: keyof Child): Child {
    const ParentClass: Class<Parent> = this.parentRef();
    const parent: Parent = new ParentClass(entity[prop]);

    return this.childSchema.assign(entity, { [prop]: parent } as any);
  }

  isValid(): boolean {
    const ParentClass: Class<Parent> = this.parentRef();
    const parentSchema: Schema<Parent> = getSchemaFor(ParentClass);

    return (
      this.childSchema.hasPrimaryKey() &&
      parentSchema.hasPrimaryKey() &&
      this.childSchema.hasForeignKeyFor(ParentClass)
    );
  }

  getPipeline(key: keyof Child): any[] {
    const ParentClass: Class<Parent> = this.parentRef();
    const parentSchema: Schema<Parent> = getSchemaFor(ParentClass);
    const parentKey = `${key}-all`;

    return [
      {
        $lookup: {
          from: parentSchema.getCollectionName(),
          localField: this.childSchema.getForeignKeyOriginFor(ParentClass),
          foreignField: parentSchema.getPrimaryKeyOriginProperty(),
          as: parentKey,
        },
      },
      {
        $addFields: {
          [key]: { $arrayElemAt: [`$${parentKey}`, 0] },
        },
      },
      {
        $project: {
          [parentKey]: 0,
        },
      },
    ];
  }
}
