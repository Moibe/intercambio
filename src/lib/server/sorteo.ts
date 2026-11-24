// Algoritmo del sorteo: asigna a cada miembro alguien a quien regalar, de modo que
//  - nadie se regale a sí mismo,
//  - se respeten las exclusiones (parejas, etc.),
//  - y, si se puede, nadie repita a quien le tocó en el sorteo anterior.
// Es un backtracking aleatorizado: con familias de hasta decenas de personas
// encuentra solución al instante. Si con "no repetir" no hay solución, lo
// intenta sin esa regla y lo reporta en `sinRepetir=false`.

export type Par = { daId: number; recibeId: number };

export type ResultadoSorteo =
	| { ok: true; pares: Par[]; sinRepetir: boolean }
	| { ok: false; motivo: string };

function barajar<T>(arr: T[]): T[] {
	const a = [...arr];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

function resolver(ids: number[], prohibido: Map<number, Set<number>>): Par[] | null {
	// Ordena a quienes dan por menos candidatos primero (los más restringidos),
	// con desempate aleatorio para que el sorteo sea impredecible.
	const dan = barajar(ids).sort(
		(a, b) => (prohibido.get(a)?.size ?? 0) - (prohibido.get(b)?.size ?? 0)
	);
	const usados = new Set<number>();
	const pares: Par[] = [];

	function paso(i: number): boolean {
		if (i === dan.length) return true;
		const da = dan[i];
		const noPuede = prohibido.get(da) ?? new Set<number>();
		for (const recibe of barajar(ids)) {
			if (recibe === da || usados.has(recibe) || noPuede.has(recibe)) continue;
			usados.add(recibe);
			pares.push({ daId: da, recibeId: recibe });
			if (paso(i + 1)) return true;
			usados.delete(recibe);
			pares.pop();
		}
		return false;
	}

	return paso(0) ? pares : null;
}

export function sortear(
	miembroIds: number[],
	exclusiones: Par[], // daId NO puede regalarle a recibeId
	anterior: Par[] // asignaciones del sorteo previo (a evitar)
): ResultadoSorteo {
	if (miembroIds.length < 2) {
		return { ok: false, motivo: 'Se necesitan al menos 2 participantes.' };
	}
	const base = new Map<number, Set<number>>();
	for (const id of miembroIds) base.set(id, new Set());
	for (const e of exclusiones) base.get(e.daId)?.add(e.recibeId);

	// 1) Intento estricto: exclusiones + no repetir al del sorteo anterior.
	const estricto = new Map<number, Set<number>>();
	for (const [k, v] of base) estricto.set(k, new Set(v));
	for (const a of anterior) estricto.get(a.daId)?.add(a.recibeId);

	const r1 = resolver(miembroIds, estricto);
	if (r1) return { ok: true, pares: r1, sinRepetir: true };

	// 2) Relajado: solo exclusiones.
	const r2 = resolver(miembroIds, base);
	if (r2) return { ok: true, pares: r2, sinRepetir: anterior.length === 0 };

	return {
		ok: false,
		motivo: 'Las exclusiones hacen imposible el sorteo. Quita alguna o agrega participantes.'
	};
}
