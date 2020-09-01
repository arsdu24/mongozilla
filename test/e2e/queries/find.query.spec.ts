import { ActiveRecord, Entity, PrimaryKey, Property } from '../../../src';
import { initializeUsersDatabase, nowDate, someId, userMocks } from '../common';
import { IUser } from '../common/mocks/user.mocks';
import { DeepPartial } from 'utility-types';
import { ObjectId } from 'mongodb';

describe('Query - Find', () => {
  @Entity()
  class User extends ActiveRecord<User> implements IUser {
    @PrimaryKey()
    id!: ObjectId;

    @Property()
    name!: string;

    @Property()
    age!: number;

    @Property()
    isAdmin!: boolean;

    @Property()
    createdAt!: Date;
  }

  beforeAll(() => initializeUsersDatabase());

  it('should find same quantity as in mocks declared', async () => {
    const users: User[] = await User.find();

    expect(users.length).toBe(userMocks.length);
  });

  describe('Literal', () => {
    it('should filter by exact match', async () => {
      const searchedValue = 'MongoZilla';

      const users: User[] = await User.find({
        name: searchedValue,
      });

      const foundedMocks: DeepPartial<IUser>[] = userMocks.filter(
        ({ name }) => name === searchedValue,
      );

      expect(users.length).toBe(foundedMocks.length);
    });

    it('should filter by regex', async () => {
      const searchedValue = /mongo/i;

      const users: User[] = await User.find({
        name: searchedValue,
      });

      const foundedMocks: DeepPartial<
        IUser
      >[] = userMocks.filter(({ name = '' }) => name.match(searchedValue));

      expect(users.length).toBe(foundedMocks.length);
    });

    describe('SubQuery', () => {
      it('should filter by $eq exact match', async () => {
        const searchedValue = 'MongoZilla';

        const users: User[] = await User.find({
          name: {
            $eq: searchedValue,
          },
        });

        const foundedMocks: DeepPartial<IUser>[] = userMocks.filter(
          ({ name }) => name === searchedValue,
        );

        expect(users.length).toBe(foundedMocks.length);
      });

      it('should filter by $ne exact match', async () => {
        const searchedValue = 'MongoZilla';

        const users: User[] = await User.find({
          name: {
            $ne: searchedValue,
          },
        });

        const foundedMocks: DeepPartial<IUser>[] = userMocks.filter(
          ({ name }) => name !== searchedValue,
        );

        expect(users.length).toBe(foundedMocks.length);
      });

      it('should filter by $in array of values', async () => {
        const searchedValues = ['MongoZilla', 'SomeAnother'];

        const users: User[] = await User.find({
          name: {
            $in: searchedValues,
          },
        });

        const foundedMocks: DeepPartial<
          IUser
        >[] = userMocks.filter(({ name = '' }) =>
          searchedValues.includes(name),
        );

        expect(users.length).toBe(foundedMocks.length);
      });

      it('should filter by $nin array of values', async () => {
        const searchedValues = ['MongoZilla', 'SomeAnother'];

        const users: User[] = await User.find({
          name: {
            $nin: searchedValues,
          },
        });

        const foundedMocks: DeepPartial<IUser>[] = userMocks.filter(
          ({ name = '' }) => !searchedValues.includes(name),
        );

        expect(users.length).toBe(foundedMocks.length);
      });
    });
  });

  describe('Number', () => {
    const searchedValue = 21;
    const searchedValues = [searchedValue, 12];

    it('should filter by exact value', async () => {
      const users: User[] = await User.find({
        age: searchedValue,
      });

      const foundedMocks: DeepPartial<IUser>[] = userMocks.filter(
        ({ age = 0 }) => age === searchedValue,
      );

      expect(users.length).toBe(foundedMocks.length);
    });

    describe('SubQuery', () => {
      it('should filter by $eq of value', async () => {
        const users: User[] = await User.find({
          age: {
            $eq: searchedValue,
          },
        });

        const foundedMocks: DeepPartial<IUser>[] = userMocks.filter(
          ({ age = 0 }) => age === searchedValue,
        );

        expect(users.length).toBe(foundedMocks.length);
      });

      it('should filter by $ne of value', async () => {
        const users: User[] = await User.find({
          age: {
            $ne: searchedValue,
          },
        });

        const foundedMocks: DeepPartial<IUser>[] = userMocks.filter(
          ({ age = 0 }) => age !== searchedValue,
        );

        expect(users.length).toBe(foundedMocks.length);
      });

      it('should filter by $gt than value', async () => {
        const users: User[] = await User.find({
          age: {
            $gt: searchedValue,
          },
        });

        const foundedMocks: DeepPartial<IUser>[] = userMocks.filter(
          ({ age = 0 }) => age > searchedValue,
        );

        expect(users.length).toBe(foundedMocks.length);
      });

      it('should filter by $gte than value', async () => {
        const users: User[] = await User.find({
          age: {
            $gte: searchedValue,
          },
        });

        const foundedMocks: DeepPartial<IUser>[] = userMocks.filter(
          ({ age = 0 }) => age >= searchedValue,
        );

        expect(users.length).toBe(foundedMocks.length);
      });

      it('should filter by $lt than value', async () => {
        const users: User[] = await User.find({
          age: {
            $lt: searchedValue,
          },
        });

        const foundedMocks: DeepPartial<IUser>[] = userMocks.filter(
          ({ age = 0 }) => age < searchedValue,
        );

        expect(users.length).toBe(foundedMocks.length);
      });

      it('should filter by $lte than value', async () => {
        const users: User[] = await User.find({
          age: {
            $lte: searchedValue,
          },
        });

        const foundedMocks: DeepPartial<IUser>[] = userMocks.filter(
          ({ age = 0 }) => age <= searchedValue,
        );

        expect(users.length).toBe(foundedMocks.length);
      });

      it('should filter by $in array of values', async () => {
        const users: User[] = await User.find({
          age: {
            $in: searchedValues,
          },
        });

        const foundedMocks: DeepPartial<
          IUser
        >[] = userMocks.filter(({ age = 0 }) => searchedValues.includes(age));

        expect(users.length).toBe(foundedMocks.length);
      });

      it('should filter by $nin array of values', async () => {
        const users: User[] = await User.find({
          age: {
            $nin: searchedValues,
          },
        });

        const foundedMocks: DeepPartial<IUser>[] = userMocks.filter(
          ({ age = 0 }) => !searchedValues.includes(age),
        );

        expect(users.length).toBe(foundedMocks.length);
      });
    });
  });

  describe('Boolean', () => {
    it('should filter by exact match', async () => {
      const searchedValue = true;

      const users: User[] = await User.find({
        isAdmin: searchedValue,
      });

      const foundedMocks: DeepPartial<IUser>[] = userMocks.filter(
        ({ isAdmin }) => isAdmin === searchedValue,
      );

      expect(users.length).toBe(foundedMocks.length);
    });

    describe('SubQuery', () => {
      it('should filter by $eq of value', async () => {
        const searchedValue = true;

        const users: User[] = await User.find({
          isAdmin: {
            $eq: searchedValue,
          },
        });

        const foundedMocks: DeepPartial<IUser>[] = userMocks.filter(
          ({ isAdmin }) => isAdmin === searchedValue,
        );

        expect(users.length).toBe(foundedMocks.length);
      });

      it('should filter by $ne of value', async () => {
        const searchedValue = true;

        const users: User[] = await User.find({
          isAdmin: {
            $ne: searchedValue,
          },
        });

        const foundedMocks: DeepPartial<IUser>[] = userMocks.filter(
          ({ isAdmin }) => isAdmin !== searchedValue,
        );

        expect(users.length).toBe(foundedMocks.length);
      });

      it('should filter by $in array of value', async () => {
        const searchedValues = [true, false];

        const users: User[] = await User.find({
          isAdmin: {
            $in: searchedValues,
          },
        });

        const foundedMocks: DeepPartial<
          IUser
        >[] = userMocks.filter(({ isAdmin = true }) =>
          searchedValues.includes(isAdmin),
        );

        expect(users.length).toBe(foundedMocks.length);
      });

      it('should filter by $in array of value', async () => {
        const searchedValues = [true, false];

        const users: User[] = await User.find({
          isAdmin: {
            $nin: searchedValues,
          },
        });

        expect(users.length).toBe(0);
      });
    });
  });

  describe('Date', () => {
    it('should filter by exact match', async () => {
      const searchedValue: Date = nowDate;

      const users: User[] = await User.find({
        createdAt: searchedValue,
      });

      const foundedMocks: DeepPartial<IUser>[] = userMocks.filter(
        ({ createdAt = new Date() }) => +createdAt === +searchedValue,
      );

      expect(users.length).toBe(foundedMocks.length);
    });

    describe('SubQuery', () => {
      it('should filter by $eq of value', async () => {
        const searchedValue: Date = nowDate;

        const users: User[] = await User.find({
          createdAt: {
            $eq: searchedValue,
          },
        });

        const foundedMocks: DeepPartial<IUser>[] = userMocks.filter(
          ({ createdAt = new Date() }) => +createdAt === +searchedValue,
        );

        expect(users.length).toBe(foundedMocks.length);
      });

      it('should filter by $ne of value', async () => {
        const searchedValue: Date = nowDate;

        const users: User[] = await User.find({
          createdAt: {
            $ne: searchedValue,
          },
        });

        const foundedMocks: DeepPartial<IUser>[] = userMocks.filter(
          ({ createdAt = new Date() }) => +createdAt !== +searchedValue,
        );

        expect(users.length).toBe(foundedMocks.length);
      });

      it('should filter by $gt of value', async () => {
        const searchedValue: Date = nowDate;

        const users: User[] = await User.find({
          createdAt: {
            $gt: searchedValue,
          },
        });

        const foundedMocks: DeepPartial<IUser>[] = userMocks.filter(
          ({ createdAt = new Date() }) => +createdAt > +searchedValue,
        );

        expect(users.length).toBe(foundedMocks.length);
      });

      it('should filter by $gte of value', async () => {
        const searchedValue: Date = nowDate;

        const users: User[] = await User.find({
          createdAt: {
            $gte: searchedValue,
          },
        });

        const foundedMocks: DeepPartial<IUser>[] = userMocks.filter(
          ({ createdAt = new Date() }) => +createdAt >= +searchedValue,
        );

        expect(users.length).toBe(foundedMocks.length);
      });

      it('should filter by $lt of value', async () => {
        const searchedValue: Date = nowDate;

        const users: User[] = await User.find({
          createdAt: {
            $lt: searchedValue,
          },
        });

        const foundedMocks: DeepPartial<IUser>[] = userMocks.filter(
          ({ createdAt = new Date() }) => +createdAt < +searchedValue,
        );

        expect(users.length).toBe(foundedMocks.length);
      });

      it('should filter by $lte of value', async () => {
        const searchedValue: Date = nowDate;

        const users: User[] = await User.find({
          createdAt: {
            $lte: searchedValue,
          },
        });

        const foundedMocks: DeepPartial<IUser>[] = userMocks.filter(
          ({ createdAt = new Date() }) => +createdAt <= +searchedValue,
        );

        expect(users.length).toBe(foundedMocks.length);
      });

      it('should filter by $in of value', async () => {
        const searchedValues: Date[] = [nowDate, new Date()];

        const users: User[] = await User.find({
          createdAt: {
            $in: searchedValues,
          },
        });

        const foundedMocks: DeepPartial<
          IUser
        >[] = userMocks.filter(({ createdAt = new Date() }) =>
          searchedValues.some((date) => +createdAt === +date),
        );

        expect(users.length).toBe(foundedMocks.length);
      });

      it('should filter by $nin of value', async () => {
        const searchedValues: Date[] = [nowDate, new Date()];

        const users: User[] = await User.find({
          createdAt: {
            $nin: searchedValues,
          },
        });

        const foundedMocks: DeepPartial<IUser>[] = userMocks.filter(
          ({ createdAt = new Date() }) =>
            !searchedValues.some((date) => +createdAt === +date),
        );

        expect(users.length).toBe(foundedMocks.length);
      });
    });
  });

  describe('EntityId', () => {
    it('should filter by exact match', async () => {
      const searchedValue: ObjectId = someId;

      const users: User[] = await User.find({
        id: searchedValue,
      });

      const foundedMocks: DeepPartial<IUser>[] = userMocks.filter(({ _id }) =>
        searchedValue?.equals(`${_id}`),
      );

      expect(users.length).toBe(foundedMocks.length);
    });

    it('should filter by exact match (string)', async () => {
      const searchedValue: string = someId.toHexString();

      const users: User[] = await User.find({
        id: searchedValue,
      });

      const foundedMocks: DeepPartial<IUser>[] = userMocks.filter(
        ({ _id }) => searchedValue === `${_id}`,
      );

      expect(users.length).toBe(foundedMocks.length);
    });

    describe('SubQuery', () => {
      it('should filter by $eq of value', async () => {
        const searchedValue: ObjectId = someId;

        const users: User[] = await User.find({
          id: {
            $eq: searchedValue,
          },
        });

        const foundedMocks: DeepPartial<IUser>[] = userMocks.filter(({ _id }) =>
          searchedValue?.equals(`${_id}`),
        );

        expect(users.length).toBe(foundedMocks.length);
      });

      it.skip('should filter by $eq of value (string)', async () => {
        const searchedValue: string = someId.toHexString();

        const users: User[] = await User.find({
          id: {
            $eq: searchedValue,
          },
        });

        const foundedMocks: DeepPartial<IUser>[] = userMocks.filter(
          ({ _id }) => searchedValue === `${_id}`,
        );

        expect(users.length).toBe(foundedMocks.length);
      });

      it('should filter by $ne of value', async () => {
        const searchedValue: ObjectId = someId;

        const users: User[] = await User.find({
          id: {
            $ne: searchedValue,
          },
        });

        const foundedMocks: DeepPartial<IUser>[] = userMocks.filter(
          ({ _id }) => !searchedValue?.equals(`${_id}`),
        );

        expect(users.length).toBe(foundedMocks.length);
      });

      it.skip('should filter by $ne of value (string)', async () => {
        const searchedValue: string = someId.toHexString();

        const users: User[] = await User.find({
          id: {
            $ne: searchedValue,
          },
        });

        const foundedMocks: DeepPartial<IUser>[] = userMocks.filter(
          ({ _id }) => searchedValue !== `${_id}`,
        );

        expect(users.length).toBe(foundedMocks.length);
      });

      it('should filter by $in of value', async () => {
        const searchedValues: ObjectId[] = [someId, new ObjectId()];

        const users: User[] = await User.find({
          id: {
            $in: searchedValues,
          },
        });

        const foundedMocks: DeepPartial<IUser>[] = userMocks.filter(({ _id }) =>
          searchedValues.some((v) => v.equals(`${_id}`)),
        );

        expect(users.length).toBe(foundedMocks.length);
      });

      it.skip('should filter by $in of value (string)', async () => {
        const searchedValues: string[] = [
          someId.toHexString(),
          new ObjectId().toHexString(),
        ];

        const users: User[] = await User.find({
          id: {
            $in: searchedValues,
          },
        });

        const foundedMocks: DeepPartial<IUser>[] = userMocks.filter(({ _id }) =>
          searchedValues.includes(`${_id}`),
        );

        expect(users.length).toBe(foundedMocks.length);
      });

      it('should filter by $nin of value', async () => {
        const searchedValues: ObjectId[] = [someId, new ObjectId()];

        const users: User[] = await User.find({
          id: {
            $nin: searchedValues,
          },
        });

        const foundedMocks: DeepPartial<IUser>[] = userMocks.filter(
          ({ _id }) => !searchedValues.some((v) => v.equals(`${_id}`)),
        );

        expect(users.length).toBe(foundedMocks.length);
      });

      it.skip('should filter by $nin of value (string)', async () => {
        const searchedValues: string[] = [
          someId.toHexString(),
          new ObjectId().toHexString(),
        ];

        const users: User[] = await User.find({
          id: {
            $nin: searchedValues,
          },
        });

        const foundedMocks: DeepPartial<IUser>[] = userMocks.filter(
          ({ _id }) => !searchedValues.includes(`${_id}`),
        );

        expect(users.length).toBe(foundedMocks.length);
      });
    });
  });
});
