import { reactive } from "vue";

const state = reactive({
  items: [],
});

function notify({ type = "info", text = "", timeout = 3500 } = {}) {
  if (!text) return;
  const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  state.items.push({ id, type, text });
  if (timeout > 0) {
    setTimeout(() => {
      remove(id);
    }, timeout);
  }
}

function remove(id) {
  const idx = state.items.findIndex((item) => item.id === id);
  if (idx !== -1) state.items.splice(idx, 1);
}

export { state as notificationState, notify, remove };
