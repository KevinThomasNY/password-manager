ALTER TABLE `users` ADD `wrapped_vault_key` text;--> statement-breakpoint
ALTER TABLE `users` ADD `vault_key_salt` text;--> statement-breakpoint
ALTER TABLE `users` ADD `vault_encryption_version` text DEFAULT 'legacy' NOT NULL;