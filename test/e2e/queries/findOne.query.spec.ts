import { ActiveRecord, Entity } from '../../../src';
import { initializeUsersDatabase, nowDate, userMocks } from '../common';
import { IUser } from '../common/mocks/user.mocks';
import { DeepPartial } from 'utility-types';

describe('Query - Find One', () => {
  @Entity()
  class User extends ActiveRecord<User> implements IUser {
    name!: string;
    age!: number;
    isAdmin!: boolean;
    createdAt!: Date;
  }

  beforeAll(() => initializeUsersDatabase());

  it('should findOne based if mocks have declared some', async () => {
    const user: User | undefined = await User.findOne();

    if (userMocks.length) {
      expect(user).toBeDefined();
    } else {
      expect(user).toBeUndefined();
    }
  });

  it('should filter by string', async () => {
    const searchedValue = 'MongoZilla';

    const user: User | undefined = await User.findOne({
      name: searchedValue,
    });

    const foundedUser: DeepPartial<IUser> | undefined = userMocks.find(
      ({ name }) => name === searchedValue,
    );

    if (foundedUser) {
      expect(user).toBeDefined();
    } else {
      expect(user).toBeUndefined();
    }
  });

  it('should filter by regex', async () => {
    const searchedValue = /mongo/i;

    const user: User | undefined = await User.findOne({
      name: searchedValue,
    });

    const foundedUser:
      | DeepPartial<IUser>
      | undefined = userMocks.find(({ name = '' }) =>
      name.match(searchedValue),
    );

    if (foundedUser) {
      expect(user).toBeDefined();
    } else {
      expect(user).toBeUndefined();
    }
  });

  it('should filter by number', async () => {
    const searchedValue = 21;

    const user: User | undefined = await User.findOne({
      age: searchedValue,
    });

    const foundedUser: DeepPartial<IUser> | undefined = userMocks.find(
      ({ age = 0 }) => age === searchedValue,
    );

    if (foundedUser) {
      expect(user).toBeDefined();
    } else {
      expect(user).toBeUndefined();
    }
  });

  it('should filter by boolean', async () => {
    const searchedValue = true;

    const user: User | undefined = await User.findOne({
      isAdmin: searchedValue,
    });

    const foundedUser: DeepPartial<IUser> | undefined = userMocks.find(
      ({ isAdmin }) => isAdmin === searchedValue,
    );

    if (foundedUser) {
      expect(user).toBeDefined();
    } else {
      expect(user).toBeUndefined();
    }
  });

  it('should filter by date', async () => {
    const searchedValue: Date = nowDate;

    const user: User | undefined = await User.findOne({
      createdAt: searchedValue,
    });

    const foundedUser: DeepPartial<IUser> | undefined = userMocks.find(
      ({ createdAt = new Date() }) => +createdAt === +searchedValue,
    );

    if (foundedUser) {
      expect(user).toBeDefined();
    } else {
      expect(user).toBeUndefined();
    }
  });
});
