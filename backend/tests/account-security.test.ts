import crypto from "crypto";
import request from "supertest";
import { eq } from "drizzle-orm";
import app from "../src/app";
import { db } from "../src/db/db-connection";
import { invitations, users } from "../src/db/schema";
import { AccountStatus, UserRole } from "../src/constants/account-policy";

describe("account setup and invitation security", () => {
  const runId = crypto.randomBytes(6).toString("hex");
  const invitedUserName = `invited_${runId}`;
  const invitedPassword = "InvitedPassword123!";
  const adminCredentials = {
    userName: process.env.TEST_USER_NAME,
    password: process.env.TEST_USER_PASSWORD,
  };
  let invitationId = 0;

  afterAll(async () => {
    await db.delete(invitations).where(eq(invitations.id, invitationId));
    await db.delete(users).where(eq(users.userName, invitedUserName));
  });

  async function adminAgent() {
    const agent = request.agent(app);
    const loginResponse = await agent
      .post("/api/users/login")
      .send(adminCredentials);
    expect(loginResponse.statusCode).toBe(200);
    return agent;
  }

  it("closes initial setup after the first account exists", async () => {
    const statusResponse = await request(app).get("/api/setup/status");
    expect(statusResponse.statusCode).toBe(200);
    expect(statusResponse.body.data.setupRequired).toBe(false);

    const setupResponse = await request(app).post("/api/setup").send({
      userName: `second_admin_${runId}`,
      password: invitedPassword,
      confirmPassword: invitedPassword,
      firstName: "Second",
      lastName: "Admin",
    });
    expect(setupResponse.statusCode).toBe(409);
  });

  it("requires administrator access for account management", async () => {
    const response = await request(app).get("/api/admin/users");
    expect(response.statusCode).toBe(401);
  });

  it("does not allow an administrator to remove their own access", async () => {
    const admin = await adminAgent();
    const [adminUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.userName, process.env.TEST_USER_NAME!));
    const response = await admin
      .patch(`/api/admin/users/${adminUser.id}`)
      .send({ role: UserRole.User });
    expect(response.statusCode).toBe(403);
  });

  it("creates a single-use invitation without exposing its hash", async () => {
    const admin = await adminAgent();
    const invitationResponse = await admin
      .post("/api/admin/invitations")
      .send({ lifetimeHours: 24 });

    expect(invitationResponse.statusCode).toBe(201);
    expect(invitationResponse.headers["cache-control"]).toContain("no-store");
    expect(invitationResponse.body.data.token).toEqual(expect.any(String));
    expect(invitationResponse.body.data).not.toHaveProperty("tokenHash");
    invitationId = invitationResponse.body.data.id;
    const [storedInvitation] = await db
      .select({ tokenHash: invitations.tokenHash })
      .from(invitations)
      .where(eq(invitations.id, invitationId));
    expect(storedInvitation.tokenHash).not.toBe(
      invitationResponse.body.data.token
    );

    const listResponse = await admin.get("/api/admin/invitations");
    expect(listResponse.body.data[0]).not.toHaveProperty("token");
    expect(listResponse.body.data[0]).not.toHaveProperty("tokenHash");

    const registration = {
      invitationToken: invitationResponse.body.data.token,
      userName: invitedUserName,
      password: invitedPassword,
      confirmPassword: invitedPassword,
      firstName: "Invited",
      lastName: "User",
    };
    const registrationResponse = await request(app)
      .post("/api/registration")
      .send(registration);
    expect(registrationResponse.statusCode).toBe(201);
    expect(registrationResponse.body.data.role).toBe(UserRole.User);

    const reusedResponse = await request(app)
      .post("/api/registration")
      .send(registration);
    expect(reusedResponse.statusCode).toBe(400);
  });

  it("prevents regular users from using administrator endpoints", async () => {
    const agent = request.agent(app);
    const loginResponse = await agent.post("/api/users/login").send({
      userName: invitedUserName,
      password: invitedPassword,
    });
    expect(loginResponse.statusCode).toBe(200);

    const response = await agent.get("/api/admin/users");
    expect(response.statusCode).toBe(403);
  });

  it("rejects revoked invitation links", async () => {
    const admin = await adminAgent();
    const invitationResponse = await admin
      .post("/api/admin/invitations")
      .send({ lifetimeHours: 24 });
    const invitation = invitationResponse.body.data;

    const revokeResponse = await admin.delete(
      `/api/admin/invitations/${invitation.id}`
    );
    expect(revokeResponse.statusCode).toBe(200);

    const registrationResponse = await request(app)
      .post("/api/registration")
      .send({
        invitationToken: invitation.token,
        userName: `revoked_${runId}`,
        password: invitedPassword,
        confirmPassword: invitedPassword,
        firstName: "Revoked",
        lastName: "Invite",
      });
    expect(registrationResponse.statusCode).toBe(400);
  });

  it("invalidates an existing session when an account is disabled", async () => {
    const [invitedUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.userName, invitedUserName));
    const userAgent = request.agent(app);
    await userAgent.post("/api/users/login").send({
      userName: invitedUserName,
      password: invitedPassword,
    });

    const admin = await adminAgent();
    const updateResponse = await admin
      .patch(`/api/admin/users/${invitedUser.id}`)
      .send({ status: AccountStatus.Disabled });
    expect(updateResponse.statusCode).toBe(200);

    const protectedResponse = await userAgent.get(
      "/api/users/profile-information"
    );
    expect(protectedResponse.statusCode).toBe(401);
  });
});
