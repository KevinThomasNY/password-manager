import {
  PasswordCharacterSet,
  SECURITY_POLICY,
} from "../src/constants/security-policy";
import { generatePasswordModel } from "../src/models/password-model";

describe("password generator", () => {
  it("generates the requested length with every selected character type", () => {
    const generated = generatePasswordModel(
      SECURITY_POLICY.GENERATED_PASSWORD_DEFAULT_LENGTH,
      true,
      true,
      true,
      true
    );

    expect(generated).toHaveLength(
      SECURITY_POLICY.GENERATED_PASSWORD_DEFAULT_LENGTH
    );
    expect(
      [...generated].some((character) =>
        PasswordCharacterSet.Uppercase.includes(character)
      )
    ).toBe(true);
    expect(
      [...generated].some((character) =>
        PasswordCharacterSet.Lowercase.includes(character)
      )
    ).toBe(true);
    expect(
      [...generated].some((character) =>
        PasswordCharacterSet.Numbers.includes(character)
      )
    ).toBe(true);
    expect(
      [...generated].some((character) =>
        PasswordCharacterSet.Symbols.includes(character)
      )
    ).toBe(true);
  });

  it("does not depend on Math.random", () => {
    const insecureRandom = jest
      .spyOn(Math, "random")
      .mockImplementation(() => {
        throw new Error("Math.random must not be used");
      });

    expect(() =>
      generatePasswordModel(
        SECURITY_POLICY.GENERATED_PASSWORD_MIN_LENGTH,
        true,
        true,
        true,
        true
      )
    ).not.toThrow();

    insecureRandom.mockRestore();
  });

  it("rejects lengths outside the security policy", () => {
    expect(() =>
      generatePasswordModel(
        SECURITY_POLICY.GENERATED_PASSWORD_MAX_LENGTH + 1,
        true,
        true,
        true,
        true
      )
    ).toThrow();
  });
});
