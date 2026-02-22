import { reactive, computed } from "vue";
import { apiFetch } from "../services/api.js";

const state = reactive({
  token: "",
  user: null,
  loading: false,
  error: "",
  ready: false,
});

const isAuthed = computed(() => !!state.token);
const isAdmin = computed(() => state.user?.role === "ADMIN");

function setToken(token) {
  state.token = token || "";
  if (token) {
    localStorage.setItem("access_token", token);
  } else {
    localStorage.removeItem("access_token");
  }
}

async function initAuth() {
  const token = localStorage.getItem("access_token") || "";
  if (token) {
    state.token = token;
    try {
      await fetchProfile();
    } catch (e) {
      setToken("");
    }
  }
  state.ready = true;
}

async function login({ email, password }) {
  state.loading = true;
  state.error = "";
  try {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setToken(data.accessToken || "");
    await fetchProfile();
    return data;
  } finally {
    state.loading = false;
  }
}

async function register({ email, password, name, phone, currency }) {
  state.loading = true;
  state.error = "";
  try {
    const data = await apiFetch("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name, phone, currency }),
    });
    setToken(data.accessToken || "");
    await fetchProfile();
    return data;
  } finally {
    state.loading = false;
  }
}

async function forgot(email) {
  state.loading = true;
  try {
    return await apiFetch("/auth/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
  } finally {
    state.loading = false;
  }
}

async function resetPassword({ token, password }) {
  state.loading = true;
  try {
    return await apiFetch("/auth/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
  } finally {
    state.loading = false;
  }
}

async function fetchProfile() {
  if (!state.token) return null;
  const data = await apiFetch("/user/profile", {
    headers: { Authorization: `Bearer ${state.token}` },
  });
  state.user = data;
  if (data?.role) {
    localStorage.setItem("user_role", data.role);
  }
  return data;
}

function logout() {
  setToken("");
  state.user = null;
}

export {
  state as authState,
  isAuthed,
  isAdmin,
  initAuth,
  login,
  register,
  logout,
  forgot,
  resetPassword,
  fetchProfile,
};
