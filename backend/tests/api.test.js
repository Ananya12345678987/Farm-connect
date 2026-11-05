import test, { before, after, beforeEach, describe } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

import { startDb, stopDb, clearDb, registerAndLogin, auth } from "./helpers.js";

let app;
let Category;
let Farm;
let Product;

before(async () => {
  await startDb();
  app = (await import("../src/app.js")).default;
  Category = (await import("../src/models/Category.js")).default;
  Farm = (await import("../src/models/Farm.js")).default;
  Product = (await import("../src/models/Product.js")).default;
});

after(async () => {
  await stopDb();
});

beforeEach(async () => {
  await clearDb();
});

/* Approves a farmer's farm the way an admin would, so listing tests can run. */
const approveFarm = async (farmerId) =>
  Farm.findOneAndUpdate(
    { farmer: farmerId },
    { verificationStatus: "APPROVED", isVerified: true },
    { new: true }
  );

const makeCategory = () => Category.create({ name: "Vegetables" });

describe("health", () => {
  test("reports the API and database are up", async () => {
    const response = await request(app).get("/api/health");
    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.data.database, "connected");
  });
});

describe("registration and login", () => {
  test("registers a farmer with a PENDING farm, never auto-approved", async () => {
    const { status, body } = await registerAndLogin(request, app, "FARMER");
    assert.equal(status, 201);
    assert.equal(body.data.user.role, "FARMER");
    assert.equal(body.data.farm.verificationStatus, "PENDING");
    assert.equal(body.data.canSell, false);
  });

  test("never returns the password hash", async () => {
    const { body } = await registerAndLogin(request, app, "BUYER");
    assert.equal(body.data.user.password, undefined);
  });

  test("rejects a weak password with a field-level message", async () => {
    const response = await request(app)
      .post("/api/auth/register/buyer")
      .send({
        fullName: "Weak Password",
        email: "weak@test.com",
        phone: "9900112233",
        password: "short",
        businessName: "Test",
        location: "Hubballi",
      });

    assert.equal(response.status, 422);
    assert.equal(response.body.errorCode, "VALIDATION_ERROR");
    assert.ok(response.body.details.some((d) => d.field === "password"));
  });

  test("refuses a duplicate email", async () => {
    await registerAndLogin(request, app, "BUYER");
    const again = await registerAndLogin(request, app, "BUYER");
    assert.equal(again.status, 409);
  });

  test("cannot self-assign ADMIN through the buyer endpoint", async () => {
    const response = await request(app)
      .post("/api/auth/register/buyer")
      .send({
        fullName: "Sneaky",
        email: "sneaky@test.com",
        phone: "9900112233",
        password: "Buy@12345",
        businessName: "Test",
        location: "Hubballi",
        role: "ADMIN",
      });

    assert.equal(response.status, 201);
    assert.equal(response.body.data.user.role, "BUYER");
  });

  test("rejects admin registration with the wrong setup key", async () => {
    const response = await request(app).post("/api/auth/register/admin").send({
      fullName: "Fake Admin",
      email: "fake@test.com",
      password: "Admin@1234",
      adminCode: "not-the-key",
    });

    assert.equal(response.status, 403);
    assert.equal(response.body.errorCode, "INVALID_ADMIN_CODE");
  });

  test("logs in with correct credentials and rejects wrong ones identically", async () => {
    await registerAndLogin(request, app, "BUYER");

    const good = await request(app)
      .post("/api/auth/login")
      .send({ email: "buyer@test.com", password: "Buy@12345" });
    assert.equal(good.status, 200);
    assert.ok(good.body.data.token);

    const badPassword = await request(app)
      .post("/api/auth/login")
      .send({ email: "buyer@test.com", password: "WrongPass1" });
    const badEmail = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@test.com", password: "Buy@12345" });

    assert.equal(badPassword.status, 401);
    assert.equal(badEmail.status, 401);
    /* Identical message: the endpoint must not reveal which addresses exist. */
    assert.equal(badPassword.body.message, badEmail.body.message);
  });
});

describe("authentication and authorization", () => {
  test("rejects a protected route without a token", async () => {
    const response = await request(app).get("/api/auth/me");
    assert.equal(response.status, 401);
  });

  test("rejects a tampered token", async () => {
    const response = await request(app).get("/api/auth/me").set(auth("not.a.jwt"));
    assert.equal(response.status, 401);
  });

  test("blocks a buyer from an admin route", async () => {
    const { token } = await registerAndLogin(request, app, "BUYER");
    const response = await request(app).get("/api/admin/dashboard").set(auth(token));
    assert.equal(response.status, 403);
    assert.equal(response.body.errorCode, "ROLE_FORBIDDEN");
  });

  test("blocks a farmer from a buyer's cart", async () => {
    const { token } = await registerAndLogin(request, app, "FARMER");
    const response = await request(app).get("/api/cart").set(auth(token));
    assert.equal(response.status, 403);
  });
});

describe("farmer approval gate", () => {
  test("an unapproved farmer cannot create a listing", async () => {
    const { token } = await registerAndLogin(request, app, "FARMER");
    const category = await makeCategory();

    const response = await request(app)
      .post("/api/products")
      .set(auth(token))
      .field("name", "Tomatoes")
      .field("category", String(category._id))
      .field("price", "28")
      .field("quantity", "100")
      .field("unit", "kg");

    assert.equal(response.status, 403);
    assert.equal(response.body.errorCode, "FARM_NOT_APPROVED");
  });

  test("an approved farmer can, and the listing starts PENDING", async () => {
    const { token, user } = await registerAndLogin(request, app, "FARMER");
    await approveFarm(user._id);
    const category = await makeCategory();

    const response = await request(app)
      .post("/api/products")
      .set(auth(token))
      .field("name", "Tomatoes")
      .field("category", String(category._id))
      .field("price", "28")
      .field("quantity", "100")
      .field("unit", "kg");

    assert.equal(response.status, 201);
    assert.equal(response.body.data.approvalStatus, "PENDING");
  });

  test("a farmer cannot approve their own farm through the profile endpoint", async () => {
    const { token, user } = await registerAndLogin(request, app, "FARMER");

    await request(app)
      .patch("/api/farmers/me")
      .set(auth(token))
      .send({ verificationStatus: "APPROVED", isVerified: true });

    const farm = await Farm.findOne({ farmer: user._id });
    assert.equal(farm.verificationStatus, "PENDING");
  });
});

describe("marketplace visibility", () => {
  test("a PENDING product is not publicly listed; an APPROVED one is", async () => {
    const { token, user } = await registerAndLogin(request, app, "FARMER");
    await approveFarm(user._id);
    const category = await makeCategory();

    const createdResponse = await request(app)
      .post("/api/products")
      .set(auth(token))
      .field("name", "Tomatoes")
      .field("category", String(category._id))
      .field("price", "28")
      .field("quantity", "100")
      .field("unit", "kg");

    const before = await request(app).get("/api/products");
    assert.equal(before.body.data.length, 0);

    await Product.updateOne(
      { _id: createdResponse.body.data._id },
      { approvalStatus: "APPROVED" }
    );

    const after = await request(app).get("/api/products");
    assert.equal(after.body.data.length, 1);
    assert.equal(after.body.pagination.total, 1);
  });
});

describe("ownership", () => {
  test("a farmer cannot edit another farmer's listing", async () => {
    const first = await registerAndLogin(request, app, "FARMER");
    await approveFarm(first.user._id);
    const category = await makeCategory();

    const createdResponse = await request(app)
      .post("/api/products")
      .set(auth(first.token))
      .field("name", "Tomatoes")
      .field("category", String(category._id))
      .field("price", "28")
      .field("quantity", "100")
      .field("unit", "kg");

    const second = await registerAndLogin(request, app, "FARMER", {
      email: "other@test.com",
      farmName: "Other Farm",
    });
    await approveFarm(second.user._id);

    const response = await request(app)
      .patch(`/api/products/${createdResponse.body.data._id}`)
      .set(auth(second.token))
      .send({ price: 1 });

    assert.equal(response.status, 403);
    assert.equal(response.body.errorCode, "NOT_OWNER");
  });
});

describe("cart and orders", () => {
  const setup = async () => {
    const farmer = await registerAndLogin(request, app, "FARMER");
    await approveFarm(farmer.user._id);
    const category = await makeCategory();

    const product = await Product.create({
      farmer: farmer.user._id,
      name: "Tomatoes",
      category: category._id,
      price: 30,
      quantity: 50,
      unit: "kg",
      approvalStatus: "APPROVED",
      isActive: true,
    });

    const buyer = await registerAndLogin(request, app, "BUYER");
    return { farmer, buyer, product };
  };

  const ADDRESS = {
    fullName: "Test Buyer",
    phone: "9900112233",
    line1: "12 Market Road",
    city: "Hubballi",
    state: "Karnataka",
    pincode: "580030",
  };

  test("refuses to add more than the available stock", async () => {
    const { buyer, product } = await setup();

    const response = await request(app)
      .post("/api/cart/items")
      .set(auth(buyer.token))
      .send({ product: String(product._id), quantity: 500 });

    assert.equal(response.status, 409);
    assert.equal(response.body.errorCode, "INSUFFICIENT_STOCK");
  });

  test("refuses a zero or negative quantity", async () => {
    const { buyer, product } = await setup();

    const response = await request(app)
      .post("/api/cart/items")
      .set(auth(buyer.token))
      .send({ product: String(product._id), quantity: 0 });

    assert.equal(response.status, 422);
  });

  test("prices the order server-side and ignores any total the client sends", async () => {
    const { buyer, product } = await setup();

    const response = await request(app)
      .post("/api/orders")
      .set(auth(buyer.token))
      .send({
        items: [{ product: String(product._id), quantity: 2 }],
        shippingAddress: ADDRESS,
        /* Both of these must be ignored entirely. */
        totalAmount: 1,
        subtotal: 1,
      });

    assert.equal(response.status, 201);
    assert.equal(response.body.data.subtotal, 60);
    assert.notEqual(response.body.data.totalAmount, 1);
  });

  test("decrements inventory and never lets it go negative", async () => {
    const { buyer, product } = await setup();

    await request(app)
      .post("/api/orders")
      .set(auth(buyer.token))
      .send({
        items: [{ product: String(product._id), quantity: 50 }],
        shippingAddress: ADDRESS,
      });

    const after = await Product.findById(product._id);
    assert.equal(after.quantity, 0);
    assert.equal(after.availability, "OUT_OF_STOCK");

    const second = await request(app)
      .post("/api/orders")
      .set(auth(buyer.token))
      .send({
        items: [{ product: String(product._id), quantity: 1 }],
        shippingAddress: ADDRESS,
      });

    assert.equal(second.status, 409);
    const final = await Product.findById(product._id);
    assert.equal(final.quantity, 0);
  });

  test("a buyer cannot read another buyer's order", async () => {
    const { buyer, product } = await setup();

    const order = await request(app)
      .post("/api/orders")
      .set(auth(buyer.token))
      .send({
        items: [{ product: String(product._id), quantity: 1 }],
        shippingAddress: ADDRESS,
      });

    const other = await registerAndLogin(request, app, "BUYER", {
      email: "other-buyer@test.com",
    });

    const response = await request(app)
      .get(`/api/orders/${order.body.data._id}`)
      .set(auth(other.token));

    assert.equal(response.status, 403);
  });

  test("rejects an illegal status transition", async () => {
    const { farmer, buyer, product } = await setup();

    const order = await request(app)
      .post("/api/orders")
      .set(auth(buyer.token))
      .send({
        items: [{ product: String(product._id), quantity: 1 }],
        shippingAddress: ADDRESS,
      });

    /* PLACED cannot jump straight to DELIVERED. */
    const response = await request(app)
      .patch(`/api/farmer/orders/${order.body.data._id}/status`)
      .set(auth(farmer.token))
      .send({ status: "DELIVERED" });

    assert.equal(response.status, 400);
    assert.equal(response.body.errorCode, "INVALID_STATUS_TRANSITION");
  });

  test("returns stock when a buyer cancels", async () => {
    const { buyer, product } = await setup();

    const order = await request(app)
      .post("/api/orders")
      .set(auth(buyer.token))
      .send({
        items: [{ product: String(product._id), quantity: 10 }],
        shippingAddress: ADDRESS,
      });

    assert.equal((await Product.findById(product._id)).quantity, 40);

    await request(app)
      .patch(`/api/orders/${order.body.data._id}/cancel`)
      .set(auth(buyer.token))
      .send({ reason: "Changed my mind" });

    assert.equal((await Product.findById(product._id)).quantity, 50);
  });
});

describe("reviews", () => {
  test("refuses a review for a product the buyer never ordered", async () => {
    const buyer = await registerAndLogin(request, app, "BUYER");
    const category = await makeCategory();
    const farmer = await registerAndLogin(request, app, "FARMER");

    const product = await Product.create({
      farmer: farmer.user._id,
      name: "Tomatoes",
      category: category._id,
      price: 30,
      quantity: 50,
      unit: "kg",
      approvalStatus: "APPROVED",
    });

    const response = await request(app)
      .post("/api/reviews")
      .set(auth(buyer.token))
      .send({
        product: String(product._id),
        order: "507f1f77bcf86cd799439011",
        rating: 5,
        comment: "Never bought this",
      });

    assert.equal(response.status, 403);
  });
});

describe("wishlist", () => {
  test("adding twice does not create a duplicate", async () => {
    const buyer = await registerAndLogin(request, app, "BUYER");
    const farmer = await registerAndLogin(request, app, "FARMER");
    const category = await makeCategory();

    const product = await Product.create({
      farmer: farmer.user._id,
      name: "Tomatoes",
      category: category._id,
      price: 30,
      quantity: 50,
      unit: "kg",
      approvalStatus: "APPROVED",
    });

    await request(app).post(`/api/wishlist/${product._id}`).set(auth(buyer.token));
    const second = await request(app)
      .post(`/api/wishlist/${product._id}`)
      .set(auth(buyer.token));

    assert.equal(second.body.data.length, 1);
  });
});

describe("error shape", () => {
  test("an invalid ObjectId returns a clean message, not a driver error", async () => {
    const response = await request(app).get("/api/products/not-an-id");
    assert.equal(response.status, 404);
    assert.equal(response.body.success, false);
    assert.ok(response.body.errorCode);
    assert.equal(response.body.stack, undefined);
  });

  test("an unknown route returns the standard error body", async () => {
    const response = await request(app).get("/api/does-not-exist");
    assert.equal(response.status, 404);
    assert.equal(response.body.errorCode, "ROUTE_NOT_FOUND");
  });
});
