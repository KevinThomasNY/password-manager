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

      expect(res.statusCode).toBe(401);
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

  describe("PATCH /api/users/:id", () => {
    it("rewraps the vault key and invalidates other sessions", async () => {
      const currentSession = request.agent(app);
      const otherSession = request.agent(app);
      const newPassword = "UpdatedLocalPassword123!";

      const currentLogin = await currentSession
        .post("/api/users/login")
        .send({ ...baseLoginPayload });
      const otherLogin = await otherSession
        .post("/api/users/login")
        .send({ ...baseLoginPayload });
      expect(currentLogin.statusCode).toBe(200);
      expect(otherLogin.statusCode).toBe(200);

      const authResponse = await currentSession.get("/api/users/auth/check");
      const updateResponse = await currentSession
        .patch(`/api/users/${authResponse.body.data.userId}`)
        .send({
          currentPassword: baseLoginPayload.password,
          newPassword,
          confirmNewPassword: newPassword,
        });

      expect(updateResponse.statusCode).toBe(200);
      expect(
        (await currentSession.get("/api/users/profile-information")).statusCode
      ).toBe(200);
      expect(
        (await otherSession.get("/api/users/profile-information")).statusCode
      ).toBe(401);
      expect(
        (
          await request(app)
            .post("/api/users/login")
            .send({ ...baseLoginPayload })
        ).statusCode
      ).toBe(401);
      expect(
        (
          await request(app).post("/api/users/login").send({
            userName: baseLoginPayload.userName,
            password: newPassword,
          })
        ).statusCode
      ).toBe(200);
    });
  });
});
