import {ActiveRecord, Entity, HasOne, PrimaryKey, Property} from "../src";
import {Order} from "./order.entity";
import { ObjectId } from "mongodb";

@Entity()
export class Item extends ActiveRecord<Item> {
    @PrimaryKey()
    id!: ObjectId;

    @Property()
    name!: string;

    @Property()
    description!: string;

    @Property('instock')
    inStock!: number;

    @HasOne(() => Order)
    user!: Order;
}