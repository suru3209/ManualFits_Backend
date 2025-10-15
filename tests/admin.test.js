"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const mongoose_1 = __importDefault(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const index_1 = __importDefault(require("../src/index"));
const Admin_1 = __importDefault(require("../src/models/Admin"));
describe("Admin Authentication", () => {
    beforeAll(async () => {
        await mongoose_1.default.connect(process.env.MONGO_URI || "");
    });
    afterAll(async () => {
        await Admin_1.default.deleteMany({});
        await mongoose_1.default.connection.close();
    });
    beforeEach(async () => {
        const hashedPassword = await bcrypt_1.default.hash("testpassword", 10);
        const admin = new Admin_1.default({
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
        await Admin_1.default.deleteMany({});
    });
    describe("POST /api/admin/login", () => {
        it("should login with valid credentials", async () => {
            const response = await (0, supertest_1.default)(index_1.default).post("/api/admin/login").send({
                username: "testadmin",
                password: "testpassword",
            });
            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Admin login successful");
            expect(response.body.token).toBeDefined();
            expect(response.body.admin.username).toBe("testadmin");
        });
        it("should reject invalid credentials", async () => {
            const response = await (0, supertest_1.default)(index_1.default).post("/api/admin/login").send({
                username: "testadmin",
                password: "wrongpassword",
            });
            expect(response.status).toBe(401);
            expect(response.body.message).toBe("Invalid credentials");
        });
        it("should reject non-existent user", async () => {
            const response = await (0, supertest_1.default)(index_1.default).post("/api/admin/login").send({
                username: "nonexistent",
                password: "testpassword",
            });
            expect(response.status).toBe(401);
            expect(response.body.message).toBe("Invalid credentials");
        });
    });
    describe("GET /api/admin/dashboard/stats", () => {
        let adminToken;
        beforeEach(async () => {
            const loginResponse = await (0, supertest_1.default)(index_1.default).post("/api/admin/login").send({
                username: "testadmin",
                password: "testpassword",
            });
            adminToken = loginResponse.body.token;
        });
        it("should get dashboard stats with valid token", async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .get("/api/admin/dashboard/stats")
                .set("Authorization", `Bearer ${adminToken}`);
            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Dashboard stats retrieved successfully");
            expect(response.body.stats).toBeDefined();
        });
        it("should reject request without token", async () => {
            const response = await (0, supertest_1.default)(index_1.default).get("/api/admin/dashboard/stats");
            expect(response.status).toBe(401);
            expect(response.body.message).toBe("No token, authorization denied");
        });
        it("should reject request with invalid token", async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .get("/api/admin/dashboard/stats")
                .set("Authorization", "Bearer invalid-token");
            expect(response.status).toBe(401);
            expect(response.body.message).toBe("Token is not valid");
        });
    });
});
