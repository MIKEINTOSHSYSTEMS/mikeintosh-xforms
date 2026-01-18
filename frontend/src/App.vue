<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="app-header__inner">
        <RouterLink to="/forms" class="app-title">MIKEINTOSH XForms</RouterLink>
        <nav class="app-nav">
          <RouterLink to="/forms" class="app-nav__link">Forms</RouterLink>
          <a href="/admin" class="app-nav__link" target="_blank" rel="noopener">Admin</a>
        </nav>
      </div>
    </header>
    <main class="app-content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  background-color: #f6f6f6;
  min-height: 100vh;
}

.app-header {
  background-color: #1f2937;
  color: white;
  padding: 1rem 0;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.25);
}

.app-header__inner {
  margin: 0 auto;
  max-width: 64rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
}

.app-title {
  font-size: 1.5rem;
  font-weight: 600;
  text-decoration: none;
  color: inherit;
}

.app-nav {
  display: flex;
  gap: 1rem;
}

.app-nav__link {
  color: #e5e7eb;
  text-decoration: none;
  font-weight: 500;
}

.app-nav__link.router-link-exact-active {
  color: white;
  text-decoration: underline;
}

.app-content {
  margin: 0 auto;
  max-width: 64rem;
  padding: 2rem 1.5rem 4rem;
}
</style>
