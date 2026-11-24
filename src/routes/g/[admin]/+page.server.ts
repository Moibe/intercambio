import { error, fail } from '@sveltejs/kit';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { asignaciones, exclusiones, grupos, miembros, sorteos } from '$lib/server/db/schema';
import { nuevoToken } from '$lib/server/tokens';
import { sortear } from '$lib/server/sorteo';
import type { Actions, PageServerLoad } from './$types';

function cargarGrupo(adminToken: string) {
	const g = db.select().from(grupos).where(eq(grupos.adminToken, adminToken)).get();
	if (!g) error(404, 'Ese link de organizador no existe.');
	return g;
}

export const load: PageServerLoad = ({ params, url }) => {
	const grupo = cargarGrupo(params.admin);
	const lista = db.select().from(miembros).where(eq(miembros.grupoId, grupo.id)).all();
	const excl = db.select().from(exclusiones).where(eq(exclusiones.grupoId, grupo.id)).all();
	const historial = db
		.select()
		.from(sorteos)
		.where(eq(sorteos.grupoId, grupo.id))
		.orderBy(desc(sorteos.id))
		.all();
	const asig = historial.length
		? db
				.select()
				.from(asignaciones)
				.where(eq(asignaciones.sorteoId, historial[0].id))
				.all()
		: [];

	return {
		grupo,
		miembros: lista,
		exclusiones: excl,
		sorteos: historial,
		// Solo del sorteo más reciente, y solo quién ya abrió su resultado (no a quién le tocó:
		// el organizador también participa y no debe poder espiar).
		vistos: asig.map((a) => ({ daId: a.daId, visto: a.visto })),
		origen: url.origin
	};
};

export const actions: Actions = {
	agregar: async ({ params, request }) => {
		const grupo = cargarGrupo(params.admin);
		const nombre = String((await request.formData()).get('nombre') ?? '').trim();
		if (!nombre) return fail(400, { error: 'Escribe un nombre.' });
		db.insert(miembros).values({ grupoId: grupo.id, nombre, token: nuevoToken() }).run();
		return { ok: true };
	},

	quitar: async ({ params, request }) => {
		const grupo = cargarGrupo(params.admin);
		const id = Number((await request.formData()).get('id'));
		db.delete(miembros).where(and(eq(miembros.id, id), eq(miembros.grupoId, grupo.id))).run();
		return { ok: true };
	},

	regenerar: async ({ params, request }) => {
		// Nuevo link personal (si alguien lo compartió por error).
		const grupo = cargarGrupo(params.admin);
		const id = Number((await request.formData()).get('id'));
		db.update(miembros)
			.set({ token: nuevoToken() })
			.where(and(eq(miembros.id, id), eq(miembros.grupoId, grupo.id)))
			.run();
		return { ok: true };
	},

	excluir: async ({ params, request }) => {
		const grupo = cargarGrupo(params.admin);
		const form = await request.formData();
		const a = Number(form.get('a'));
		const b = Number(form.get('b'));
		const mutua = form.get('mutua') === 'on';
		if (!a || !b || a === b) return fail(400, { error: 'Elige dos personas distintas.' });
		const ids = db
			.select({ id: miembros.id })
			.from(miembros)
			.where(eq(miembros.grupoId, grupo.id))
			.all()
			.map((m) => m.id);
		if (!ids.includes(a) || !ids.includes(b)) return fail(400, { error: 'Miembro inválido.' });

		const filas = [{ grupoId: grupo.id, miembroId: a, excluidoId: b }];
		if (mutua) filas.push({ grupoId: grupo.id, miembroId: b, excluidoId: a });
		db.insert(exclusiones).values(filas).onConflictDoNothing().run();
		return { ok: true };
	},

	quitarExclusion: async ({ params, request }) => {
		const grupo = cargarGrupo(params.admin);
		const id = Number((await request.formData()).get('id'));
		db.delete(exclusiones)
			.where(and(eq(exclusiones.id, id), eq(exclusiones.grupoId, grupo.id)))
			.run();
		return { ok: true };
	},

	sortear: async ({ params, request }) => {
		const grupo = cargarGrupo(params.admin);
		const nombre = String((await request.formData()).get('nombre') ?? '').trim();
		if (!nombre) return fail(400, { error: 'Ponle nombre al sorteo (ej. Navidad 2026).' });

		const ids = db
			.select({ id: miembros.id })
			.from(miembros)
			.where(eq(miembros.grupoId, grupo.id))
			.all()
			.map((m) => m.id);
		const excl = db
			.select()
			.from(exclusiones)
			.where(eq(exclusiones.grupoId, grupo.id))
			.all()
			.map((e) => ({ daId: e.miembroId, recibeId: e.excluidoId }));

		const previo = db
			.select()
			.from(sorteos)
			.where(eq(sorteos.grupoId, grupo.id))
			.orderBy(desc(sorteos.id))
			.get();
		const anterior = previo
			? db
					.select({ daId: asignaciones.daId, recibeId: asignaciones.recibeId })
					.from(asignaciones)
					.where(eq(asignaciones.sorteoId, previo.id))
					.all()
			: [];

		const r = sortear(ids, excl, anterior);
		if (!r.ok) return fail(400, { error: r.motivo });

		const s = db
			.insert(sorteos)
			.values({ grupoId: grupo.id, nombre, sinRepetir: r.sinRepetir })
			.returning()
			.get();
		db.insert(asignaciones)
			.values(r.pares.map((p) => ({ sorteoId: s.id, daId: p.daId, recibeId: p.recibeId })))
			.run();
		return { ok: true, sorteado: true, sinRepetir: r.sinRepetir };
	},

	borrarSorteo: async ({ params, request }) => {
		const grupo = cargarGrupo(params.admin);
		const id = Number((await request.formData()).get('id'));
		db.delete(sorteos).where(and(eq(sorteos.id, id), eq(sorteos.grupoId, grupo.id))).run();
		return { ok: true };
	}
};
