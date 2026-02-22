<template>
  <section class="hero">
    <div>
      <h1>KYC & AML</h1>
      <p>Подтвердите личность для доступа к повышенным лимитам.</p>
    </div>
    <div class="card">
      <h2>Статус</h2>
      <div class="notice">{{ statusLabel }}</div>
    </div>
  </section>

  <section class="grid-2">
    <div class="card">
      <h2>Заявка</h2>
      <div v-if="!token" class="notice">Авторизуйтесь для отправки заявки.</div>
      <form v-else class="form" @submit.prevent="submitKyc">
        <select v-model="form.documentType">
          <option value="">Тип документа</option>
          <option value="passport">Паспорт</option>
          <option value="driver">Водительское</option>
          <option value="id">ID‑карта</option>
        </select>
        <input v-model="form.country" type="text" placeholder="Страна" />
        <input v-model="form.fullName" type="text" placeholder="ФИО" />
        <textarea v-model="form.note" placeholder="Комментарий или ссылка на файл"></textarea>
        <button class="btn" type="submit">Отправить</button>
      </form>
    </div>
    <div class="card">
      <h2>Требования</h2>
      <div class="notice">— Фото документа в хорошем качестве</div>
      <div class="notice">— Селфи с документом</div>
      <div class="notice">— Актуальные персональные данные</div>
      <div class="notice">Среднее время проверки: 2–6 часов</div>
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
      status: "",
      form: {
        documentType: "",
        country: "",
        fullName: "",
        note: "",
      },
    };
  },
  computed: {
    statusLabel() {
      return this.status ? `Статус: ${this.status}` : "Статус: нет заявки";
    },
    tokenValue() {
      return authState.token;
    },
  },
  async mounted() {
    this.token = authState.token;
    if (this.token) {
      await this.fetchStatus();
    }
  },
  watch: {
    async tokenValue(value) {
      this.token = value;
      if (value) {
        await this.fetchStatus();
      }
    },
  },
  methods: {
    async fetchStatus() {
      try {
        const data = await apiFetch("/user/kyc", {
          headers: { Authorization: `Bearer ${authState.token}` },
        });
        this.status = data?.status || "PENDING";
      } catch (e) {
        this.status = "";
      }
    },
    async submitKyc() {
      if (!this.form.documentType || !this.form.fullName) {
        notify({ type: "warn", text: "Заполните обязательные поля" });
        return;
      }
      await apiFetch("/user/kyc/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authState.token}`,
        },
        body: JSON.stringify({ note: JSON.stringify(this.form) }),
      });
      notify({ type: "success", text: "Заявка отправлена" });
      await this.fetchStatus();
    },
  },
};
</script>
