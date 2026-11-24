import { randomBytes } from 'node:crypto';

// Tokens legibles para links: sin 0/O/1/l/I para que se puedan dictar por teléfono.
const ALFABETO = 'abcdefghjkmnpqrstuvwxyz23456789';

export function nuevoToken(len = 10): string {
	const bytes = randomBytes(len);
	let out = '';
	for (let i = 0; i < len; i++) out += ALFABETO[bytes[i] % ALFABETO.length];
	return out;
}
