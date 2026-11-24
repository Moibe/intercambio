<script lang="ts">
  // Modal de confirmación con el look glass del app (nunca confirm() nativo).
  // Uso: <Confirmar bind:abierto titulo="..." texto="..." onconfirmar={() => ...} />
  let {
    abierto = $bindable(false),
    titulo = '¿Seguro?',
    texto = '',
    confirmar = 'Sí, continuar',
    peligro = true,
    onconfirmar
  }: {
    abierto?: boolean;
    titulo?: string;
    texto?: string;
    confirmar?: string;
    peligro?: boolean;
    onconfirmar: () => void;
  } = $props();

  function cerrar() {
    abierto = false;
  }
  function ok() {
    abierto = false;
    onconfirmar();
  }
  function tecla(e: KeyboardEvent) {
    if (e.key === 'Escape') cerrar();
  }
</script>

<svelte:window onkeydown={abierto ? tecla : undefined} />

{#if abierto}
  <!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
  <div class="modal-fondo" onclick={cerrar}>
    <div class="modal" role="dialog" aria-modal="true" tabindex="-1" onclick={(e) => e.stopPropagation()}>
      <h3>{titulo}</h3>
      {#if texto}<p>{texto}</p>{/if}
      <div class="modal-acciones">
        <button type="button" class="btn" onclick={cerrar}>Cancelar</button>
        <button type="button" class="btn {peligro ? 'btn-peligro' : 'btn-primario'}" onclick={ok}>
          {confirmar}
        </button>
      </div>
    </div>
  </div>
{/if}
