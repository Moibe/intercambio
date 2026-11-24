CREATE TABLE `asignaciones` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sorteo_id` integer NOT NULL,
	`da_id` integer NOT NULL,
	`recibe_id` integer NOT NULL,
	`visto` integer,
	FOREIGN KEY (`sorteo_id`) REFERENCES `sorteos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`da_id`) REFERENCES `miembros`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recibe_id`) REFERENCES `miembros`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `asignaciones_unq` ON `asignaciones` (`sorteo_id`,`da_id`);--> statement-breakpoint
CREATE TABLE `exclusiones` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`grupo_id` integer NOT NULL,
	`miembro_id` integer NOT NULL,
	`excluido_id` integer NOT NULL,
	FOREIGN KEY (`grupo_id`) REFERENCES `grupos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`miembro_id`) REFERENCES `miembros`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`excluido_id`) REFERENCES `miembros`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `exclusiones_unq` ON `exclusiones` (`miembro_id`,`excluido_id`);--> statement-breakpoint
CREATE TABLE `grupos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`admin_token` text NOT NULL,
	`creado` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `grupos_admin_token_unique` ON `grupos` (`admin_token`);--> statement-breakpoint
CREATE TABLE `miembros` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`grupo_id` integer NOT NULL,
	`nombre` text NOT NULL,
	`token` text NOT NULL,
	`creado` integer NOT NULL,
	FOREIGN KEY (`grupo_id`) REFERENCES `grupos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `miembros_token_unique` ON `miembros` (`token`);--> statement-breakpoint
CREATE TABLE `sorteos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`grupo_id` integer NOT NULL,
	`nombre` text NOT NULL,
	`sin_repetir` integer DEFAULT true NOT NULL,
	`creado` integer NOT NULL,
	FOREIGN KEY (`grupo_id`) REFERENCES `grupos`(`id`) ON UPDATE no action ON DELETE cascade
);
