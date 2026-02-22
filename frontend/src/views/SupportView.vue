<template>
  <section class="hero">
    <div>
      <h1>Поддержка</h1>
      <p>Свяжитесь с командой, мы отвечаем 24/7.</p>
    </div>
    <div class="card">
      <h2>Статус</h2>
      <div class="notice">{{ token ? "Онлайн" : "Нужна авторизация" }}</div>
    </div>
  </section>

  <section class="grid-2">
    <div class="card">
      <h2>Новый запрос</h2>
      <div v-if="!token" class="notice">Войдите, чтобы написать в поддержку.</div>
      <form v-else class="form" @submit.prevent="sendMessage">
        <select v-model="topic">
          <option value="">Тема</option>
          <option value="withdraw">Вывод средств</option>
          <option value="bet">Ставки</option>
          <option value="casino">Казино</option>
          <option value="kyc">KYC</option>
        </select>
        <textarea v-model="message" placeholder="Опишите проблему"></textarea>
        <button class="btn" type="submit">Отправить</button>
      </form>
    </div>
    <div class="card">
      <h2>История обращений</h2>
      <div v-if="!token" class="notice">История доступна после входа.</div>
      <div v-else class="form">
        <div v-for="item in threads" :key="item.id" class="betslip-item">
          <strong>{{ item.message }}</strong>
          <div class="notice">{{ formatDate(item.createdAt) }}</div>
        </div>
        <div v-if="threads.length === 0" class="notice">Пока обращений нет.</div>
      </div>
    </div>
  </section>
</template>

<script>
import { authState } from "../state/auth.js";
import { apiFetch } from "../services/api.js";
import { notify } from "../state/notifications.js";

export default {
  data() {
    return {
      token: "",
      topic: "",
      message: "",
      threads: [],
    };
  },
  computed: {
    tokenValue() {
      return authState.token;
    },
  },
  async mounted() {
    this.token = authState.token;
    if (this.token) {
      await this.fetchThreads();
    }
  },
  watch: {
    async tokenValue(value) {
      this.token = value;
      if (value) {
        await this.fetchThreads();
      }
    },
  },
  methods: {
    async fetchThreads() {
      this.threads = await apiFetch("/user/support", {
        headers: { Authorization: `Bearer ${authState.token}` },
      });
    },
    async sendMessage() {
      if (!this.message) {
        notify({ type: "warn", text: "Введите сообщение" });
        return;
      }
      await apiFetch("/user/support/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authState.token}`,
        },
        body: JSON.stringify({ message: `[${this.topic || "general"}] ${this.message}` }),
      });
      notify({ type: "success", text: "Сообщение отправлено" });
      this.message = "";
      this.topic = "";
      await this.fetchThreads();
    },
    formatDate(value) {
      return new Date(value).toLocaleString();
    },
  },
};
</script>
