import {ActiveRecord, BelongsTo, Entity, ForeignKey, PrimaryKey, Property, PropertyType} from "../src";
import {User} from "./user.entity";

@Entity()
export class Posts extends ActiveRecord<Posts> {
    @PrimaryKey()
    id!: string;

    @Property()
    name!: string;

    @PropertyType([String])
    title!: string[];

    @ForeignKey(() => User)
    userId!: string;

    @BelongsTo(() => User)
    user!: User;
}