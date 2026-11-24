import { error } from '@sveltejs/kit';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { asignaciones, grupos, miembros, sorteos } from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';

function cargar(token: string) {
	const yo = db.select().from(miembros).where(eq(miembros.token, token)).get();
	if (!yo) error(404, 'Ese link no existe o ya fue reemplazado. Pídele uno nuevo al organizador.');
	const grupo = db.select().from(grupos).where(eq(grupos.id, yo.grupoId)).get()!;
	const sorteo = db
		.select()
		.from(sorteos)
		.where(eq(sorteos.grupoId, grupo.id))
		.orderBy(desc(sorteos.id))
		.get();
	return { yo, grupo, sorteo };
}

export const load: PageServerLoad = ({ params }) => {
	const { yo, grupo, sorteo } = cargar(params.token);
	const companeros = db
		.select({ nombre: miembros.nombre })
		.from(miembros)
		.where(eq(miembros.grupoId, grupo.id))
		.all()
		.map((m) => m.nombre);

	let asignacion: { recibe: string; visto: Date | null } | null = null;
	if (sorteo) {
		const a = db
			.select({ recibeId: asignaciones.recibeId, visto: asignaciones.visto })
			.from(asignaciones)
			.where(and(eq(asignaciones.sorteoId, sorteo.id), eq(asignaciones.daId, yo.id)))
			.get();
		if (a) {
			const r = db.select({ nombre: miembros.nombre }).from(miembros).where(eq(miembros.id, a.recibeId)).get();
			asignacion = { recibe: r?.nombre ?? '?', visto: a.visto };
		}
	}

	return {
		yo: { nombre: yo.nombre },
		grupo: { nombre: grupo.nombre },
		sorteo: sorteo ? { nombre: sorteo.nombre } : null,
		companeros,
		asignacion
	};
};

export const actions: Actions = {
	// Marca que ya abrió su resultado (para que el organizador sepa quién falta).
	ver: async ({ params }) => {
		const { yo, sorteo } = cargar(params.token);
		if (!sorteo) return { ok: false };
		db.update(asignaciones)
			.set({ visto: new Date() })
			.where(
				and(eq(asignaciones.sorteoId, sorteo.id), eq(asignaciones.daId, yo.id), isNull(asignaciones.visto))
			)
			.run();
		return { ok: true };
	}
};
