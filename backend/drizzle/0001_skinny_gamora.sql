CREATE TABLE `invitations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`token_hash` text NOT NULL,
	`created_by_user_id` integer,
	`consumed_by_user_id` integer,
	`expires_at` text NOT NULL,
	`consumed_at` text,
	`revoked_at` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`consumed_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invitations_token_hash_unique` ON `invitations` (`token_hash`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_passwords` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text(100) NOT NULL,
	`password` text(4096) NOT NULL,
	`image` text(256),
	`user_id` integer NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_passwords`("id", "name", "password", "image", "user_id", "created_at", "updated_at") SELECT "id", "name", "password", "image", "user_id", "created_at", "updated_at" FROM `passwords`;--> statement-breakpoint
DROP TABLE `passwords`;--> statement-breakpoint
ALTER TABLE `__new_passwords` RENAME TO `passwords`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_security_questions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`password_id` integer NOT NULL,
	`question` text(256) NOT NULL,
	`answer` text(4096) NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`password_id`) REFERENCES `passwords`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_security_questions`("id", "password_id", "question", "answer", "created_at", "updated_at") SELECT "id", "password_id", "question", "answer", "created_at", "updated_at" FROM `security_questions`;--> statement-breakpoint
DROP TABLE `security_questions`;--> statement-breakpoint
ALTER TABLE `__new_security_questions` RENAME TO `security_questions`;--> statement-breakpoint
ALTER TABLE `users` ADD `role` text DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `status` text DEFAULT 'active' NOT NULL;--> statement-breakpoint
UPDATE `users`
SET `role` = 'admin'
WHERE `id` = (SELECT MIN(`id`) FROM `users`);
