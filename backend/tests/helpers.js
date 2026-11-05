import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";

/**
 * Tests run against an in-memory MongoDB replica set rather than the
 * developer's real database. A replica set (not a standalone) so the
 * transaction path in orderService is the one actually exercised.
 */

let replSet = null;

export const startDb = async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" } });
  process.env.MONGODB_URI = replSet.getUri();
  process.env.JWT_SECRET = "test-secret-that-is-long-enough-for-the-check";
  process.env.NODE_ENV = "test";
  process.env.ADMIN_SETUP_KEY = "test-admin-setup-key";

  const { connectDB } = await import("../src/config/db.js");
  await connectDB(replSet.getUri());
};

export const stopDb = async () => {
  await mongoose.connection.dropDatabase().catch(() => {});
  await mongoose.connection.close().catch(() => {});
  if (replSet) await replSet.stop();
};

export const clearDb = async () => {
  const { collections } = mongoose.connection;
  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({}))
  );
};

/** Registers a user through the API and returns their bearer token. */
export const registerAndLogin = async (request, app, role, overrides = {}) => {
  const bodies = {
    FARMER: {
      fullName: "Test Farmer",
      email: "farmer@test.com",
      phone: "9845012345",
      password: "Farm@1234",
      farmName: "Test Farm",
      location: "Kolar, Karnataka",
      ...overrides,
    },
    BUYER: {
      fullName: "Test Buyer",
      email: "buyer@test.com",
      phone: "9900112233",
      password: "Buy@12345",
      businessName: "Test Traders",
      location: "Hubballi, Karnataka",
      ...overrides,
    },
    ADMIN: {
      fullName: "Test Admin",
      email: "admin@test.com",
      password: "Admin@1234",
      adminCode: "test-admin-setup-key",
      ...overrides,
    },
  };

  const path = `/api/auth/register/${role.toLowerCase()}`;
  const response = await request(app).post(path).send(bodies[role]);

  return {
    token: response.body?.data?.token,
    user: response.body?.data?.user,
    body: response.body,
    status: response.status,
  };
};

export const auth = (token) => ({ Authorization: `Bearer ${token}` });
