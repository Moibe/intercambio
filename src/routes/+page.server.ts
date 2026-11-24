import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { grupos, miembros } from '$lib/server/db/schema';
import { nuevoToken } from '$lib/server/tokens';
import type { Actions } from './$types';

export const actions: Actions = {
	crear: async ({ request }) => {
		const form = await request.formData();
		const nombre = String(form.get('nombre') ?? '').trim();
		const organizador = String(form.get('organizador') ?? '').trim();
		if (!nombre) return fail(400, { error: 'Ponle nombre al grupo.', nombre, organizador });
		if (!organizador) return fail(400, { error: 'Dinos tu nombre.', nombre, organizador });

		const adminToken = nuevoToken(14);
		const g = db.insert(grupos).values({ nombre, adminToken }).returning().get();
		db.insert(miembros).values({ grupoId: g.id, nombre: organizador, token: nuevoToken() }).run();

		redirect(303, `/g/${adminToken}`);
	}
};
