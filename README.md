# intercambio

App de intercambio de regalos para la familia (estilo Drawnames, hecho a la medida).

- Grupos con link de organizador; cada participante tiene su propio link (sin cuentas).
- Exclusiones (quién no puede regalarle a quién, en uno o ambos sentidos).
- Historial de sorteos: el siguiente evita repetir a quien te tocó la vez anterior.
- El organizador ve quién ya abrió su resultado, pero no a quién le tocó.

Stack: SvelteKit 2 + Svelte 5 + Tailwind v4 + shadcn-svelte + Drizzle + SQLite. Puerto 5000.

```
npm install
npm run db:migrate   # crea local.db (necesita .env, ver .env.example)
npm run dev          # http://localhost:5000
```

Deploy: push a `main` → GitHub Action → droplet (pm2 `intercambio`, nginx `intercambio.moibe.me`).
