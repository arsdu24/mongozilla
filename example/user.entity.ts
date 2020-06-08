import {ActiveRecord, Entity, HasOne, PrimaryKey, Property, PropertyDefault, PropertyOptionalType} from "../src";
import {Posts} from "./post.entity";

@Entity()
export class User extends ActiveRecord<User> {
    @PrimaryKey()
    id!: string;

    @Property('first_name')
    firstName!: string;

    @Property()
    email!: string;

    @Property()
    password?: number;

    @PropertyOptionalType(Number)
    @PropertyDefault(123)
    hash: number | undefined;

    @HasOne(() => Posts)
    post!: Posts
}