import request from "supertest";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import app from "../src/index";
import Admin from "../src/models/Admin";

describe("Admin Authentication", () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGO_URI || "");
  });

  afterAll(async () => {
    // Clean up test data
    await Admin.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Create a test admin user
    const hashedPassword = await bcrypt.hash("testpassword", 10);
    const admin = new Admin({
      username: "testadmin",
      email: "test@example.com",
      password: hashedPassword,
      role: "admin",
      permissions: ["products.read", "products.create"],
      isActive: true,
    });
    await admin.save();
  });

  afterEach(async () => {
    // Clean up after each test
    await Admin.deleteMany({});
  });

  describe("POST /api/admin/login", () => {
    it("should login with valid credentials", async () => {
      const response = await request(app).post("/api/admin/login").send({
        username: "testadmin",
        password: "testpassword",
      });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Admin login successful");
      expect(response.body.token).toBeDefined();
      expect(response.body.admin.username).toBe("testadmin");
    });

    it("should reject invalid credentials", async () => {
      const response = await request(app).post("/api/admin/login").send({
        username: "testadmin",
        password: "wrongpassword",
      });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid credentials");
    });

    it("should reject non-existent user", async () => {
      const response = await request(app).post("/api/admin/login").send({
        username: "nonexistent",
        password: "testpassword",
      });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid credentials");
    });
  });

  describe("GET /api/admin/dashboard/stats", () => {
    let adminToken: string;

    beforeEach(async () => {
      // Login to get token
      const loginResponse = await request(app).post("/api/admin/login").send({
        username: "testadmin",
        password: "testpassword",
      });
      adminToken = loginResponse.body.token;
    });

    it("should get dashboard stats with valid token", async () => {
      const response = await request(app)
        .get("/api/admin/dashboard/stats")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe(
        "Dashboard stats retrieved successfully"
      );
      expect(response.body.stats).toBeDefined();
    });

    it("should reject request without token", async () => {
      const response = await request(app).get("/api/admin/dashboard/stats");

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("No token, authorization denied");
    });

    it("should reject request with invalid token", async () => {
      const response = await request(app)
        .get("/api/admin/dashboard/stats")
        .set("Authorization", "Bearer invalid-token");

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Token is not valid");
    });
  });
});
