<script lang="ts">
  import { enhance } from '$app/forms';
  import Confirmar from '$lib/Confirmar.svelte';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const nombreDe = (id: number) => data.miembros.find((m) => m.id === id)?.nombre ?? '?';
  const linkDe = (token: string) => `${data.origen}/p/${token}`;
  const linkAdmin = $derived(`${data.origen}/g/${data.grupo.adminToken}`);
  const ultimo = $derived(data.sorteos[0] ?? null);
  const vistoDe = (id: number) => data.vistos.find((v) => v.daId === id)?.visto ?? null;

  let copiado = $state<string | null>(null);
  async function copiar(texto: string, clave: string) {
    try {
      await navigator.clipboard.writeText(texto);
      copiado = clave;
      setTimeout(() => (copiado = null), 1500);
    } catch {
      copiado = null;
    }
  }

  // Modales de confirmación (sin confirm() nativo)
  let modalAbierto = $state(false);
  let modalTitulo = $state('');
  let modalTexto = $state('');
  let modalAccion = $state<() => void>(() => {});
  function pedirConfirmacion(titulo: string, texto: string, accion: () => void) {
    modalTitulo = titulo;
    modalTexto = texto;
    modalAccion = accion;
    modalAbierto = true;
  }
  let formQuitar: HTMLFormElement;
  let formBorrarSorteo: HTMLFormElement;
  let formRegenerar: HTMLFormElement;
  let idPendiente = $state(0);

  function quitarMiembro(id: number, nombre: string) {
    pedirConfirmacion(
      `¿Quitar a ${nombre}?`,
      ultimo
        ? 'Su link dejará de funcionar y el sorteo actual quedará incompleto: tendrás que volver a sortear.'
        : 'Su link dejará de funcionar.',
      () => {
        idPendiente = id;
        queueMicrotask(() => formQuitar.requestSubmit());
      }
    );
  }
  function regenerarLink(id: number, nombre: string) {
    pedirConfirmacion(
      `¿Nuevo link para ${nombre}?`,
      'El link anterior dejará de funcionar. Tendrás que mandarle el nuevo.',
      () => {
        idPendiente = id;
        queueMicrotask(() => formRegenerar.requestSubmit());
      }
    );
  }
  function borrarSorteo(id: number, nombre: string) {
    pedirConfirmacion(
      `¿Borrar "${nombre}"?`,
      'Se pierden las asignaciones. Si era el más reciente, el siguiente sorteo evitará repetir contra el anterior a este.',
      () => {
        idPendiente = id;
        queueMicrotask(() => formBorrarSorteo.requestSubmit());
      }
    );
  }

  const fecha = (d: Date) =>
    new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
</script>

<svelte:head>
  <title>{data.grupo.nombre} · organizador</title>
</svelte:head>

<div class="pagina">
  <h1>{data.grupo.nombre}</h1>
  <p class="sub">Panel del organizador. Guarda este link: es tu única forma de volver aquí.</p>

  <div class="card">
    <div class="fila">
      <span class="mono" style="flex:1">{linkAdmin}</span>
      <button class="btn btn-chico" type="button" onclick={() => copiar(linkAdmin, 'admin')}>
        {copiado === 'admin' ? '¡Copiado!' : 'Copiar link de organizador'}
      </button>
    </div>
  </div>

  {#if form?.error}
    <div class="aviso aviso-error">{form.error}</div>
  {/if}
  {#if form?.sorteado}
    <div class="aviso {form.sinRepetir ? 'aviso-ok' : 'aviso-info'}">
      {form.sinRepetir
        ? '¡Sorteo hecho! Nadie repite a quien le tocó la vez pasada.'
        : 'Sorteo hecho, pero con estas exclusiones no fue posible evitar que alguien repita a quien le tocó la vez pasada.'}
    </div>
  {/if}

  <!-- Participantes -->
  <div class="card">
    <h2>Participantes ({data.miembros.length})</h2>
    <form method="POST" action="?/agregar" use:enhance class="fila fila-inline" style="margin-bottom:1rem">
      <input name="nombre" class="input" placeholder="Nombre" required autocomplete="off" />
      <button class="btn" type="submit">Agregar</button>
    </form>

    {#if data.miembros.length === 0}
      <p class="tenue">Aún no hay nadie.</p>
    {:else}
      <ul class="lista">
        {#each data.miembros as m (m.id)}
          <li>
            <div>
              <strong>{m.nombre}</strong>
              {#if ultimo}
                {#if vistoDe(m.id)}
                  <span class="chip chip-ok">ya vio su resultado</span>
                {:else}
                  <span class="chip">aún no lo abre</span>
                {/if}
              {/if}
              <div class="mono tenue">{linkDe(m.token)}</div>
            </div>
            <div class="fila">
              <button class="btn btn-chico" type="button" onclick={() => copiar(linkDe(m.token), m.token)}>
                {copiado === m.token ? '¡Copiado!' : 'Copiar link'}
              </button>
              <button class="btn btn-chico" type="button" onclick={() => regenerarLink(m.id, m.nombre)}>
                Nuevo link
              </button>
              <button class="btn btn-chico btn-peligro" type="button" onclick={() => quitarMiembro(m.id, m.nombre)}>
                Quitar
              </button>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </div>

  <!-- Exclusiones -->
  <div class="card">
    <h2>Exclusiones</h2>
    <p class="tenue" style="margin-top:0">
      Quién NO puede regalarle a quién (parejas, papás e hijos, etc.).
    </p>
    {#if data.miembros.length >= 2}
      <form method="POST" action="?/excluir" use:enhance class="fila" style="margin-bottom:1rem">
        <select name="a" class="select" style="width:auto;flex:1" required>
          <option value="">Quién…</option>
          {#each data.miembros as m (m.id)}<option value={m.id}>{m.nombre}</option>{/each}
        </select>
        <span>no le regala a</span>
        <select name="b" class="select" style="width:auto;flex:1" required>
          <option value="">…quién</option>
          {#each data.miembros as m (m.id)}<option value={m.id}>{m.nombre}</option>{/each}
        </select>
        <label class="fila" style="gap:0.3rem"><input type="checkbox" name="mutua" checked /> en ambos sentidos</label>
        <button class="btn" type="submit">Agregar</button>
      </form>
    {/if}

    {#if data.exclusiones.length === 0}
      <p class="tenue">Sin exclusiones: cualquiera le puede tocar a cualquiera.</p>
    {:else}
      <ul class="lista">
        {#each data.exclusiones as e (e.id)}
          <li>
            <span>{nombreDe(e.miembroId)} <span class="tenue">no le regala a</span> {nombreDe(e.excluidoId)}</span>
            <form method="POST" action="?/quitarExclusion" use:enhance>
              <input type="hidden" name="id" value={e.id} />
              <button class="btn btn-chico btn-peligro" type="submit">Quitar</button>
            </form>
          </li>
        {/each}
      </ul>
    {/if}
  </div>

  <!-- Sorteo -->
  <div class="card">
    <h2>Sorteo</h2>
    {#if ultimo}
      <p class="tenue" style="margin-top:0">
        Vigente: <strong>{ultimo.nombre}</strong> ({fecha(ultimo.creado)}).
        Un sorteo nuevo lo reemplaza y evita que alguien repita a quien le tocó en este.
      </p>
    {:else}
      <p class="tenue" style="margin-top:0">
        Cuando estén todos y las exclusiones, sortea. Después manda a cada quien su link.
      </p>
    {/if}
    <form method="POST" action="?/sortear" use:enhance class="fila fila-inline">
      <input
        name="nombre"
        class="input"
        placeholder="Nombre del sorteo, ej. Navidad {new Date().getFullYear()}"
        required
        autocomplete="off"
      />
      <button class="btn btn-primario" type="submit" disabled={data.miembros.length < 2}>
        {ultimo ? 'Sortear de nuevo' : 'Sortear'}
      </button>
    </form>
    <p class="tenue">
      Tú también participas, así que aquí no se muestra a quién le toca a cada quien: ábrelo desde tu
      propio link personal, como todos.
    </p>
  </div>

  <!-- Historial -->
  {#if data.sorteos.length > 0}
    <div class="card">
      <h2>Historial</h2>
      <ul class="lista">
        {#each data.sorteos as s, i (s.id)}
          <li>
            <span>
              <strong>{s.nombre}</strong>
              <span class="tenue">· {fecha(s.creado)}</span>
              {#if i === 0}<span class="chip chip-ok">vigente</span>{/if}
              {#if !s.sinRepetir}<span class="chip chip-aviso">con repeticiones</span>{/if}
            </span>
            <button class="btn btn-chico btn-peligro" type="button" onclick={() => borrarSorteo(s.id, s.nombre)}>
              Borrar
            </button>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</div>

<!-- Forms ocultos que disparan las acciones confirmadas en el modal -->
<form method="POST" action="?/quitar" use:enhance bind:this={formQuitar} hidden>
  <input type="hidden" name="id" value={idPendiente} />
</form>
<form method="POST" action="?/regenerar" use:enhance bind:this={formRegenerar} hidden>
  <input type="hidden" name="id" value={idPendiente} />
</form>
<form method="POST" action="?/borrarSorteo" use:enhance bind:this={formBorrarSorteo} hidden>
  <input type="hidden" name="id" value={idPendiente} />
</form>

<Confirmar bind:abierto={modalAbierto} titulo={modalTitulo} texto={modalTexto} onconfirmar={modalAccion} />
