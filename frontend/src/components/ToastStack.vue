<template>
  <div class="toast-stack">
    <div
      v-for="item in items"
      :key="item.id"
      class="toast"
      :class="item.type"
      @click="dismiss(item.id)"
    >
      {{ item.text }}
    </div>
  </div>
</template>

<script>
import { notificationState, remove } from "../state/notifications.js";

export default {
  computed: {
    items() {
      return notificationState.items;
    },
  },
  methods: {
    dismiss(id) {
      remove(id);
    },
  },
};
</script>
