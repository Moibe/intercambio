<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
  <title>Intercambio de regalos</title>
</svelte:head>

<div class="pagina">
  <h1>Intercambio de regalos</h1>
  <p class="sub">
    Crea el grupo de tu familia, agrega a todos, define quién no puede regalarle a quién y
    sortea. Cada quien recibe un link personal para ver a quién le toca. Sin cuentas ni contraseñas.
  </p>

  <div class="card">
    <h2>Crear un grupo nuevo</h2>
    {#if form?.error}
      <div class="aviso aviso-error">{form.error}</div>
    {/if}
    <form method="POST" action="?/crear" use:enhance>
      <div class="campo">
        <label for="nombre">Nombre del grupo</label>
        <input
          id="nombre"
          name="nombre"
          class="input"
          placeholder="Familia Briseño"
          value={form?.nombre ?? ''}
          required
        />
      </div>
      <div class="campo">
        <label for="organizador">Tu nombre (serás el organizador y también participas)</label>
        <input
          id="organizador"
          name="organizador"
          class="input"
          placeholder="Moisés"
          value={form?.organizador ?? ''}
          required
        />
      </div>
      <button class="btn btn-primario" type="submit">Crear grupo</button>
    </form>
  </div>

  <p class="tenue">
    ¿Ya tienes un grupo? Entra con el link de organizador que guardaste. Si eres participante,
    usa el link personal que te mandaron.
  </p>
</div>
