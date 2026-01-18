<script setup lang="ts">
// No props needed - fully slot-based
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full border-collapse">
      <slot />
    </table>
  </div>
</template>
