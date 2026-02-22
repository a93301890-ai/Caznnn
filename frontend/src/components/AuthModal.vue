<template>
  <div v-if="open" class="modal-overlay" @click.self="close">
    <div class="modal">
      <div class="tabs">
        <button
          class="tab"
          :class="{ active: currentMode === 'login' }"
          type="button"
          @click="currentMode = 'login'"
        >
          Вход
        </button>
        <button
          class="tab"
          :class="{ active: currentMode === 'register' }"
          type="button"
          @click="currentMode = 'register'"
        >
          Регистрация
        </button>
        <button
          class="tab"
          :class="{ active: currentMode === 'forgot' }"
          type="button"
          @click="currentMode = 'forgot'"
        >
          Восстановление
        </button>
      </div>

      <form v-if="currentMode === 'login'" class="form" @submit.prevent="submitLogin">
        <input v-model="loginForm.email" type="email" placeholder="Email" required />
        <input
          v-model="loginForm.password"
          type="password"
          placeholder="Пароль"
          required
        />
        <button class="btn" type="submit" :disabled="loading">Войти</button>
      </form>

      <form v-else-if="currentMode === 'register'" class="form" @submit.prevent="submitRegister">
        <input v-model="regForm.name" type="text" placeholder="Имя" />
        <input v-model="regForm.phone" type="text" placeholder="Телефон" />
        <input v-model="regForm.email" type="email" placeholder="Email" required />
        <input
          v-model="regForm.password"
          type="password"
          placeholder="Пароль"
          required
        />
        <select v-model="regForm.currency">
          <option value="">Валюта</option>
          <option value="RUB">RUB</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="KZT">KZT</option>
        </select>
        <button class="btn" type="submit" :disabled="loading">Создать аккаунт</button>
      </form>

      <form v-else class="form" @submit.prevent="submitForgot">
        <input v-model="forgotEmail" type="email" placeholder="Email" required />
        <button class="btn" type="submit" :disabled="loading">Отправить</button>
      </form>
      <div v-if="currentMode === 'forgot'" class="form" style="margin-top: 12px">
        <input v-model="resetToken" type="text" placeholder="Токен" />
        <input v-model="resetPass" type="password" placeholder="Новый пароль" />
        <button class="btn secondary" type="button" @click="submitReset">
          Сбросить пароль
        </button>
      </div>

      <div v-if="message" class="notice">{{ message }}</div>
    </div>
  </div>
</template>

<script>
import { login, register, forgot, resetPassword, authState } from "../state/auth.js";

export default {
  props: {
    open: Boolean,
    mode: {
      type: String,
      default: "login",
    },
  },
  emits: ["close", "authed"],
  data() {
    return {
      currentMode: "login",
      loginForm: { email: "", password: "" },
      regForm: { email: "", password: "", name: "", phone: "", currency: "" },
      forgotEmail: "",
      resetToken: "",
      resetPass: "",
      message: "",
    };
  },
  watch: {
    mode: {
      immediate: true,
      handler(value) {
        this.currentMode = value || "login";
      },
    },
  },
  computed: {
    loading() {
      return authState.loading;
    },
  },
  methods: {
    close() {
      this.message = "";
      this.resetToken = "";
      this.resetPass = "";
      this.$emit("close");
    },
    async submitLogin() {
      this.message = "";
      try {
        await login(this.loginForm);
        this.$emit("authed");
        this.close();
      } catch (e) {
        this.message = e?.data?.message || "Ошибка входа";
      }
    },
    async submitRegister() {
      this.message = "";
      try {
        await register(this.regForm);
        this.$emit("authed");
        this.close();
      } catch (e) {
        this.message = e?.data?.message || "Ошибка регистрации";
      }
    },
    async submitForgot() {
      this.message = "";
      try {
        await forgot(this.forgotEmail);
        this.message = "Инструкция отправлена на email";
      } catch (e) {
        this.message = e?.data?.message || "Ошибка восстановления";
      }
    },
    async submitReset() {
      if (!this.resetToken || !this.resetPass) {
        this.message = "Заполните токен и новый пароль";
        return;
      }
      try {
        await resetPassword({ token: this.resetToken, password: this.resetPass });
        this.message = "Пароль обновлён";
      } catch (e) {
        this.message = e?.data?.message || "Не удалось сбросить пароль";
      }
    },
  },
};
</script>
