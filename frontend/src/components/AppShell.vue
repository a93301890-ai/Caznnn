<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="logo">
        <img src="/img/main/logo_1713400676_8420.png" alt="Букмекерская компания" />
      </div>
      <nav class="nav-group">
        <RouterLink to="/" class="nav-link" active-class="active">Главная</RouterLink>
        <RouterLink to="/sport/line" class="nav-link" active-class="active">
          Спорт
        </RouterLink>
        <RouterLink to="/sport/live" class="nav-link" active-class="active">
          Лайв
        </RouterLink>
        <RouterLink to="/casino" class="nav-link" active-class="active">
          Казино
        </RouterLink>
        <RouterLink to="/account" class="nav-link" active-class="active">
          Личный кабинет
        </RouterLink>
        <RouterLink to="/kyc" class="nav-link" active-class="active">
          KYC
        </RouterLink>
        <RouterLink to="/support" class="nav-link" active-class="active">
          Поддержка
        </RouterLink>
        <RouterLink v-if="isAdmin" to="/admin" class="nav-link" active-class="active">
          Админ‑панель
        </RouterLink>
      </nav>
      <div class="sidebar-footer">Support 24/7 · KYC & AML</div>
    </aside>

    <div class="main">
      <header class="topbar">
        <div>
          <div class="tag">Sportsbook · Casino · Live</div>
        </div>
        <div class="topbar-actions">
          <div v-if="isAuthed" class="tag">Баланс: {{ balanceLabel }}</div>
          <button v-if="!isAuthed" class="btn secondary" @click="openAuth">
            Войти
          </button>
          <button v-if="!isAuthed" class="btn" @click="openRegister">
            Регистрация
          </button>
          <button v-if="isAuthed" class="btn secondary" @click="logoutUser">
            Выйти
          </button>
        </div>
      </header>

      <main class="content">
        <slot />
      </main>
    </div>

    <AuthModal
      :open="authOpen"
      :mode="authMode"
      @close="authOpen = false"
      @authed="refresh"
    />
    <ToastStack />
  </div>
</template>

<script>
import { authState, isAuthed, isAdmin, logout, fetchProfile } from "../state/auth.js";
import { getApiBase } from "../services/api.js";
import AuthModal from "./AuthModal.vue";
import ToastStack from "./ToastStack.vue";

export default {
  components: { AuthModal, ToastStack },
  data() {
    return {
      authOpen: false,
      authMode: "login",
      balance: "0.00",
      currency: "₽",
    };
  },
  computed: {
    isAuthed() {
      return isAuthed.value;
    },
    isAdmin() {
      return isAdmin.value;
    },
    token() {
      return authState.token;
    },
    balanceLabel() {
      return `${this.balance} ${this.currency}`;
    },
  },
  watch: {
    async token(val) {
      if (val) {
        await this.loadBalance();
      } else {
        this.balance = "0.00";
      }
    },
  },
  mounted() {
    if (authState.token) {
      this.loadBalance();
    }
    window.addEventListener("balance:update", this.onBalanceUpdate);
  },
  beforeUnmount() {
    window.removeEventListener("balance:update", this.onBalanceUpdate);
  },
  methods: {
    onBalanceUpdate(event) {
      const value = Number.parseFloat(String(event?.detail?.balance ?? ""));
      if (Number.isFinite(value)) {
        this.balance = value.toFixed(2);
      }
    },
    openAuth() {
      this.authMode = "login";
      this.authOpen = true;
    },
    openRegister() {
      this.authMode = "register";
      this.authOpen = true;
    },
    async refresh() {
      await fetchProfile();
      await this.loadBalance();
    },
    async loadBalance() {
      try {
        const res = await fetch(`${getApiBase()}/user/get_balance`, {
          method: "POST",
          headers: { Authorization: `Bearer ${authState.token}` },
        });
        const data = await res.json();
        if (data?.data) {
          this.balance = data.data.balance || "0.00";
          this.currency = data.data.curr_symbol || data.data.symbol || "₽";
        }
      } catch (e) {
        this.balance = "0.00";
      }
    },
    logoutUser() {
      logout();
    },
  },
};
</script>
