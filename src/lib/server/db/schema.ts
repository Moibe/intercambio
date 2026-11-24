import { sqliteTable, integer, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Un grupo = una familia / círculo. El organizador entra con su adminToken.
export const grupos = sqliteTable('grupos', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	nombre: text('nombre').notNull(),
	adminToken: text('admin_token').notNull().unique(),
	creado: integer('creado', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

// Cada miembro tiene su propio link (token). Sin contraseñas.
export const miembros = sqliteTable('miembros', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	grupoId: integer('grupo_id')
		.notNull()
		.references(() => grupos.id, { onDelete: 'cascade' }),
	nombre: text('nombre').notNull(),
	token: text('token').notNull().unique(),
	creado: integer('creado', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

// Exclusión dirigida: `miembroId` NO puede regalarle a `excluidoId`.
// Para "pareja" se crean las dos direcciones.
export const exclusiones = sqliteTable(
	'exclusiones',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		grupoId: integer('grupo_id')
			.notNull()
			.references(() => grupos.id, { onDelete: 'cascade' }),
		miembroId: integer('miembro_id')
			.notNull()
			.references(() => miembros.id, { onDelete: 'cascade' }),
		excluidoId: integer('excluido_id')
			.notNull()
			.references(() => miembros.id, { onDelete: 'cascade' })
	},
	(t) => [uniqueIndex('exclusiones_unq').on(t.miembroId, t.excluidoId)]
);

// Un sorteo = un intercambio concreto (Navidad 2026, Navidad 2027...). El grupo
// acumula sorteos y el siguiente evita repetir a quien te tocó en el anterior.
export const sorteos = sqliteTable('sorteos', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	grupoId: integer('grupo_id')
		.notNull()
		.references(() => grupos.id, { onDelete: 'cascade' }),
	nombre: text('nombre').notNull(),
	// true si el sorteo se pudo hacer respetando "no repetir el año pasado"
	sinRepetir: integer('sin_repetir', { mode: 'boolean' }).notNull().default(true),
	creado: integer('creado', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

export const asignaciones = sqliteTable(
	'asignaciones',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		sorteoId: integer('sorteo_id')
			.notNull()
			.references(() => sorteos.id, { onDelete: 'cascade' }),
		daId: integer('da_id')
			.notNull()
			.references(() => miembros.id, { onDelete: 'cascade' }),
		recibeId: integer('recibe_id')
			.notNull()
			.references(() => miembros.id, { onDelete: 'cascade' }),
		// cuándo el participante abrió su resultado (null = aún no lo ve)
		visto: integer('visto', { mode: 'timestamp' })
	},
	(t) => [uniqueIndex('asignaciones_unq').on(t.sorteoId, t.daId)]
);

export type Grupo = typeof grupos.$inferSelect;
export type Miembro = typeof miembros.$inferSelect;
export type Exclusion = typeof exclusiones.$inferSelect;
export type Sorteo = typeof sorteos.$inferSelect;
export type Asignacion = typeof asignaciones.$inferSelect;
