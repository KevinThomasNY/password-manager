import { Writable } from "stream";
import { createInterface } from "readline";
import { z } from "zod";
import { SECURITY_POLICY } from "../constants/security-policy";
import { runDatabaseMigrations } from "../db/db-connection";
import {
  createRecoveryAdmin,
  promoteUserForRecovery,
} from "../models/account-model";

enum AdminCommand {
  Create = "create",
  Promote = "promote",
}

const userNameSchema = z
  .string()
  .min(1)
  .max(SECURITY_POLICY.USERNAME_MAX_LENGTH);
const nameSchema = z
  .string()
  .min(1)
  .max(SECURITY_POLICY.PROFILE_NAME_MAX_LENGTH);
const passwordSchema = z
  .string()
  .min(SECURITY_POLICY.MASTER_PASSWORD_MIN_LENGTH)
  .max(SECURITY_POLICY.MASTER_PASSWORD_MAX_LENGTH);

class SecretOutput extends Writable {
  muted = false;

  _write(
    chunk: Buffer,
    encoding: BufferEncoding,
    callback: (error?: Error | null) => void
  ) {
    if (!this.muted) {
      process.stdout.write(chunk, encoding);
    }
    callback();
  }
}

const output = new SecretOutput();
const terminal = createInterface({ input: process.stdin, output, terminal: true });

function question(prompt: string, secret = false): Promise<string> {
  return new Promise((resolve) => {
    output.muted = false;
    terminal.question(prompt, (answer) => {
      output.muted = false;
      if (secret) {
        process.stdout.write("\n");
      }
      resolve(answer);
    });
    output.muted = secret;
  });
}

async function createAdmin(): Promise<void> {
  const userName = userNameSchema.parse(await question("Username: "));
  const firstName = nameSchema.parse(await question("First name: "));
  const lastName = nameSchema.parse(await question("Last name: "));
  const password = passwordSchema.parse(
    await question("New master password: ", true)
  );
  const confirmation = await question("Confirm master password: ", true);
  if (password !== confirmation) {
    throw new Error("Passwords do not match");
  }

  const admin = await createRecoveryAdmin({
    userName,
    firstName,
    lastName,
    password,
  });
  process.stdout.write(`Administrator created: ${admin.userName}\n`);
}

async function promoteAdmin(): Promise<void> {
  const userName = userNameSchema.parse(process.argv[3] ?? "");
  const user = await promoteUserForRecovery(userName);
  process.stdout.write(`Administrator access restored for: ${user.userName}\n`);
}

async function main(): Promise<void> {
  runDatabaseMigrations();
  const command = process.argv[2] as AdminCommand | undefined;
  if (command === AdminCommand.Create) {
    await createAdmin();
  } else if (command === AdminCommand.Promote) {
    await promoteAdmin();
  } else {
    throw new Error("Use the create or promote admin command");
  }
}

main()
  .catch((error) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : "Admin command failed"}\n`
    );
    process.exitCode = 1;
  })
  .finally(() => terminal.close());
