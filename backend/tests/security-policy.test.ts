import { SECURITY_POLICY } from "../src/constants/security-policy";
import { createPasswordSchema } from "../src/validation/password-validation";
import { createUserSchema } from "../src/validation/user-validation";

describe("security policy validation", () => {
  const validUser = {
    userName: "local-user",
    password: "a".repeat(SECURITY_POLICY.MASTER_PASSWORD_MIN_LENGTH),
    firstName: "Local",
    lastName: "User",
  };

  it("rejects weak new master passwords", () => {
    const result = createUserSchema.safeParse({
      ...validUser,
      password: "a".repeat(SECURITY_POLICY.MASTER_PASSWORD_MIN_LENGTH - 1),
    });

    expect(result.success).toBe(false);
  });

  it("accepts long saved credentials", () => {
    const result = createPasswordSchema.safeParse({
      name: "Long credential",
      password: "a".repeat(SECURITY_POLICY.SAVED_PASSWORD_MAX_LENGTH),
    });

    expect(result.success).toBe(true);
  });

  it("rejects saved credentials beyond the configured maximum", () => {
    const result = createPasswordSchema.safeParse({
      name: "Oversized credential",
      password: "a".repeat(SECURITY_POLICY.SAVED_PASSWORD_MAX_LENGTH + 1),
    });

    expect(result.success).toBe(false);
  });
});
