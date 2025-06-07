import request from "supertest";
import app from "../src/app";

const baseLoginPayload = {
  userName: process.env.TEST_USER_NAME,
  password: process.env.TEST_USER_PASSWORD,
};

describe("User Routes", () => {
  describe("POST /api/users/login", () => {
    it("should login existing user", async () => {
      const res = await request(app)
        .post("/api/users/login")
        .send({ ...baseLoginPayload });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("message", "User logged in Successfully");
    });

    it("should not login with invalid credentials", async () => {
      const res = await request(app)
        .post("/api/users/login")
        .send({ userName: "invalidUser", password: "wrongPassword" });

      expect(res.statusCode).toBe(500);
    });
  });

  describe("POST /api/users", () => {
    const createUserPayload = {
      userName: "newUser",
      password: "newPassword123",
      firstName: "New",
      lastName: "User",
    };

    it("should create a new user when logged in", async () => {
      const agent = request.agent(app);

      const loginRes = await agent
        .post("/api/users/login")
        .send({ ...baseLoginPayload });

      expect(loginRes.statusCode).toBe(200);

      const res = await agent.post("/api/users").send({ ...createUserPayload });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("message", "User created Successfully");
    });
  });

  describe("GET /api/users/profile-information", () => {
    it("should retrieve profile information when logged in", async () => {
      const agent = request.agent(app);

      const loginRes = await agent
        .post("/api/users/login")
        .send({ ...baseLoginPayload });

      expect(loginRes.statusCode).toBe(200);

      const res = await agent.get("/api/users/profile-information");

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty(
        "message",
        "Profile information fetched Successfully"
      );
      expect(res.body.data).toHaveProperty(
        "userName",
        baseLoginPayload.userName
      );
      expect(res.body.data).toHaveProperty("firstName");
      expect(res.body.data).toHaveProperty("lastName");
    });

    it("should not allow access to profile information when not logged in", async () => {
      const res = await request(app).get("/api/users/profile-information");

      expect(res.statusCode).toBe(401);
    });
  });
});
