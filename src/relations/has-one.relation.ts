import { getSchemaFor, Schema } from '../schema';
import { Relation } from './relation.type';
import { Class } from 'utility-types';

export class HasOneRelation<Parent extends {}, Child extends {}>
  implements Relation<Parent> {
  constructor(
    private parentSchema: Schema<Parent>,
    private childRef: () => Class<Child>,
  ) {}

  mapForeign(entity: Parent, prop: keyof Parent): Parent {
    const ChildClass: Class<Child> = this.childRef();
    const child: Child = new ChildClass(entity[prop]);

    return this.parentSchema.assign(entity, { [prop]: child } as any);
  }

  getForeignSchema(): Schema<Child> {
    const ChildClass: Class<Child> = this.childRef();

    return getSchemaFor(ChildClass);
  }

  isValid(): boolean {
    return (
      this.parentSchema.hasPrimaryKey() &&
      this.getForeignSchema().hasPrimaryKey() &&
      this.getForeignSchema().hasForeignKeyFor(
        this.parentSchema.getEntityClass(),
      )
    );
  }

  getPipeline(key: keyof Parent): any[] {
    const childKey = `${key}-all`;

    return [
      {
        $lookup: {
          from: this.getForeignSchema().getCollectionName(),
          localField: this.parentSchema.getPrimaryKeyOriginProperty(),
          foreignField: this.getForeignSchema().getForeignKeyOriginFor(
            this.parentSchema.getEntityClass(),
          ),
          as: childKey,
        },
      },
      {
        $addFields: {
          [key]: { $arrayElemAt: [`$${childKey}`, 0] },
        },
      },
      {
        $project: {
          [childKey]: 0,
        },
      },
    ];
  }
}
