<template>
  <AppShell>
    <router-view />
  </AppShell>
</template>

<script>
import AppShell from "./components/AppShell.vue";
import { initAuth } from "./state/auth.js";

export default {
  components: { AppShell },
  mounted() {
    initAuth();
  },
};
</script>
