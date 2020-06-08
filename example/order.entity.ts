import {ActiveRecord, BelongsTo, Entity, ForeignKey, PrimaryKey, Property, PropertyDefault} from "../src";
import {ObjectId} from "mongodb";
import {Item} from "./item.entity";

@Entity()
export class Order extends ActiveRecord<Order> {
    @PrimaryKey()
    id!: ObjectId;

    @Property()
    price!: number;

    @Property('quantity')
    qty!: number;

    @ForeignKey(() => Item)
    itemId!: ObjectId;

    @PropertyDefault('Hoho')
    something!: string

    @BelongsTo(() => Item)
    item!: Item
}