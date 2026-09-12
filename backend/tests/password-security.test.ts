import request from "supertest";
import { inArray } from "drizzle-orm";
import app from "../src/app";
import { db } from "../src/db/db-connection";
import { passwords, users } from "../src/db/schema";
import * as passwordModel from "../src/models/password-model";
import * as userModel from "../src/models/user-model";
import { encrypt } from "../src/utils/crypto";

describe("password decryption security", () => {
  const runId = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const ownerUserName = `security_owner_${runId}`;
  const otherUserName = `security_other_${runId}`;
  const loginPassword = "LocalTestPassword123!";
  const storedPassword = "owned-secret-value";
  let ownerId: number;
  let otherId: number;
  let ownerPasswordId: number;
  let otherPasswordId: number;

  beforeAll(async () => {
    await userModel.addNewUser(ownerUserName, loginPassword, "Test", "Owner");
    await userModel.addNewUser(otherUserName, loginPassword, "Test", "Other");

    ownerId = (await userModel.fetchUserByEmail(ownerUserName)).id;
    otherId = (await userModel.fetchUserByEmail(otherUserName)).id;

    ownerPasswordId = (
      await passwordModel.addPassword(
        `owner-record-${runId}`,
        encrypt(storedPassword),
        undefined,
        ownerId
      )
    ).id;
    otherPasswordId = (
      await passwordModel.addPassword(
        `other-record-${runId}`,
        encrypt("another-user-secret"),
        undefined,
        otherId
      )
    ).id;
  });

  afterAll(async () => {
    await db
      .delete(passwords)
      .where(inArray(passwords.userId, [ownerId, otherId]));
    await db.delete(users).where(inArray(users.id, [ownerId, otherId]));
  });

  async function authenticatedAgent() {
    const agent = request.agent(app);
    const loginResponse = await agent.post("/api/users/login").send({
      userName: ownerUserName,
      password: loginPassword,
    });
    expect(loginResponse.statusCode).toBe(200);
    return agent;
  }

  it("requires authentication before validating a decryption request", async () => {
    const response = await request(app)
      .post("/api/passwords/decrypt-password")
      .send({ id: ownerPasswordId });

    expect(response.statusCode).toBe(401);
  });

  it("decrypts a record owned by the authenticated user", async () => {
    const agent = await authenticatedAgent();
    const response = await agent
      .post("/api/passwords/decrypt-password")
      .send({ id: ownerPasswordId });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.decrypted).toBe(storedPassword);
  });

  it("does not decrypt another user's record", async () => {
    const agent = await authenticatedAgent();
    const response = await agent
      .post("/api/passwords/decrypt-password")
      .send({ id: otherPasswordId });

    expect(response.statusCode).toBe(404);
    expect(response.body).not.toHaveProperty("data.decrypted");
  });

  it("does not accept ciphertext supplied by the client", async () => {
    const agent = await authenticatedAgent();
    const response = await agent
      .post("/api/passwords/decrypt-password")
      .send({ password: encrypt(storedPassword) });

    expect(response.statusCode).toBe(400);
  });

  it("does not expose ciphertext in password-list responses", async () => {
    const agent = await authenticatedAgent();
    const response = await agent.get("/api/passwords");
    const record = response.body.data.data.find(
      (item: { id: number }) => item.id === ownerPasswordId
    );

    expect(response.statusCode).toBe(200);
    expect(record).toBeDefined();
    expect(record).not.toHaveProperty("password");
  });
});
