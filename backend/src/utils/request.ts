import { SECURITY_POLICY } from "../constants/security-policy";
import { ValidationError } from "../middleware/error-middleware";

export function parseRouteId(value: string | string[]): number {
  if (Array.isArray(value)) {
    throw new ValidationError("Invalid resource ID");
  }

  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < SECURITY_POLICY.MIN_RESOURCE_ID) {
    throw new ValidationError("Invalid resource ID");
  }

  return id;
}
