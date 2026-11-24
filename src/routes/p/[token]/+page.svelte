<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  // Si ya lo había abierto antes, se muestra directo; si no, hay que "destapar".
  // svelte-ignore state_referenced_locally
  let revelado = $state(!!data.asignacion?.visto);
</script>

<svelte:head>
  <title>{data.grupo.nombre} · {data.yo.nombre}</title>
</svelte:head>

<div class="pagina">
  <h1>Hola, {data.yo.nombre}</h1>
  <p class="sub">Intercambio de regalos de <strong>{data.grupo.nombre}</strong>.</p>

  {#if !data.sorteo}
    <div class="card">
      <h2>Todavía no hay sorteo</h2>
      <p class="tenue">
        El organizador aún no sortea. Guarda este link: cuando esté listo, aquí verás a quién le regalas.
      </p>
    </div>
  {:else if !data.asignacion}
    <div class="card">
      <h2>{data.sorteo.nombre}</h2>
      <p class="tenue">
        Te agregaron después del sorteo, así que todavía no tienes a nadie asignado. Pídele al
        organizador que vuelva a sortear.
      </p>
    </div>
  {:else}
    <div class="card regalo">
      <h2>{data.sorteo.nombre}</h2>
      {#if revelado}
        <p class="tenue" style="margin:0">Te toca regalarle a</p>
        <p class="nombre">{data.asignacion.recibe}</p>
        <p class="tenue">Shhh… es secreto. 🤫</p>
      {:else}
        <p>Tu asignación está lista. Ábrela cuando nadie esté viendo tu pantalla.</p>
        <form method="POST" action="?/ver" use:enhance={() => {
          revelado = true;
          return async ({ update }) => update({ reset: false });
        }}>
          <button class="btn btn-primario" type="submit">🎁 Ver a quién le regalo</button>
        </form>
      {/if}
    </div>
  {/if}

  <div class="card">
    <h2>Participan ({data.companeros.length})</h2>
    <p class="tenue" style="margin:0">{data.companeros.join(' · ')}</p>
  </div>
</div>

<style>
  .regalo {
    text-align: center;
    padding: 2rem 1.25rem;
  }
  .nombre {
    font-size: 2.4rem;
    font-weight: 800;
    margin: 0.25rem 0 0.5rem;
    letter-spacing: -0.02em;
  }
</style>
