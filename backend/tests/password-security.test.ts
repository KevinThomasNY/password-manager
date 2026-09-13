import crypto from "crypto";
import request from "supertest";
import { inArray } from "drizzle-orm";
import app from "../src/app";
import { db } from "../src/db/db-connection";
import { passwords, users } from "../src/db/schema";
import * as passwordModel from "../src/models/password-model";
import * as userModel from "../src/models/user-model";
import { encrypt } from "../src/utils/crypto";
import {
  AllowedImageMimeType,
  SECURITY_POLICY,
} from "../src/constants/security-policy";
import {
  removeStoredImage,
  storeUploadedImage,
} from "../src/utils/file-storage";

describe("password vault security", () => {
  const TEST_RUN_ID_BYTE_LENGTH = 8;
  const runId = crypto.randomBytes(TEST_RUN_ID_BYTE_LENGTH).toString("hex");
  const ownerUserName = `security_owner_${runId}`;
  const otherUserName = `security_other_${runId}`;
  const loginPassword = "LocalTestPassword123!";
  const storedPassword = "owned-secret-value";
  let ownerId: number;
  let otherId: number;
  let ownerPasswordId: number;
  let otherPasswordId: number;
  let ownerImageName: string;

  beforeAll(async () => {
    await userModel.addNewUser(ownerUserName, loginPassword, "Test", "Owner");
    await userModel.addNewUser(otherUserName, loginPassword, "Test", "Other");

    ownerId = (await userModel.fetchUserByEmail(ownerUserName)).id;
    otherId = (await userModel.fetchUserByEmail(otherUserName)).id;

    ownerImageName = await storeUploadedImage({
      buffer: Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ]),
      mimetype: AllowedImageMimeType.PNG,
    } as Express.Multer.File);

    ownerPasswordId = (
      await passwordModel.addPassword(
        `owner-record-${runId}`,
        encrypt(storedPassword),
        ownerImageName,
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
    await removeStoredImage(ownerImageName);
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

  it("requires the current master password for plaintext exports", async () => {
    const agent = await authenticatedAgent();
    const rejectedResponse = await agent
      .post("/api/passwords/export/json")
      .send({ currentPassword: "incorrect-password" });

    expect(rejectedResponse.statusCode).toBe(401);

    const exportResponse = await agent
      .post("/api/passwords/export/json")
      .send({ currentPassword: loginPassword });

    expect(exportResponse.statusCode).toBe(200);
    expect(exportResponse.headers["cache-control"]).toContain("no-store");
    expect(exportResponse.headers["content-disposition"]).toContain(
      "attachment"
    );
    expect(exportResponse.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: ownerPasswordId,
          password: storedPassword,
        }),
      ])
    );
  });

  it("serves images only through an authenticated owned-record route", async () => {
    const publicResponse = await request(app).get(`/uploads/${ownerImageName}`);
    expect(publicResponse.statusCode).toBe(404);

    const unauthenticatedResponse = await request(app).get(
      `/api/passwords/${ownerPasswordId}/image`
    );
    expect(unauthenticatedResponse.statusCode).toBe(401);

    const agent = await authenticatedAgent();
    const ownedImageResponse = await agent.get(
      `/api/passwords/${ownerPasswordId}/image`
    );
    expect(ownedImageResponse.statusCode).toBe(200);
    expect(ownedImageResponse.headers["cache-control"]).toContain("no-store");
  });

  it("rejects files whose content does not match an allowed image type", async () => {
    const agent = await authenticatedAgent();
    const response = await agent
      .post("/api/passwords")
      .field("name", `invalid-image-${runId}`)
      .field("password", storedPassword)
      .attach("image", Buffer.from("not an image"), {
        filename: "fake.png",
        contentType: AllowedImageMimeType.PNG,
      });

    expect(response.statusCode).toBe(400);
  });

  it("rejects images larger than the configured size limit", async () => {
    const agent = await authenticatedAgent();
    const oversizedImage = Buffer.alloc(
      SECURITY_POLICY.MAX_IMAGE_SIZE_BYTES + 1
    );
    Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]).copy(oversizedImage);

    const response = await agent
      .post("/api/passwords")
      .field("name", `oversized-image-${runId}`)
      .field("password", storedPassword)
      .attach("image", oversizedImage, {
        filename: "oversized.png",
        contentType: AllowedImageMimeType.PNG,
      });

    expect(response.statusCode).toBe(400);
  });
});
