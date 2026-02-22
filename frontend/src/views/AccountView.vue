<template>
  <section class="hero">
    <div>
      <h1>Личный кабинет</h1>
      <p>Профиль, баланс, история ставок и финансы.</p>
    </div>
    <div class="card">
      <h2>Статус</h2>
      <div class="notice">
        {{ token ? "Вы авторизованы" : "Нужна авторизация" }}
      </div>
      <RouterLink v-if="isAdmin" to="/admin" class="btn secondary">
        Админ‑панель
      </RouterLink>
    </div>
  </section>

  <section class="grid-2">
    <div class="card">
      <h2>Профиль</h2>
      <div v-if="!token" class="notice">Войдите в аккаунт для доступа.</div>
      <form v-else class="form" @submit.prevent="saveProfile">
        <input v-model="profile.name" type="text" placeholder="Имя" />
        <input v-model="profile.email" type="email" placeholder="Email" />
        <input v-model="profile.phone" type="text" placeholder="Телефон" />
        <input v-model="passwords.old_pass" type="password" placeholder="Текущий пароль" />
        <input v-model="passwords.new_pass" type="password" placeholder="Новый пароль" />
        <button class="btn" type="submit">Сохранить</button>
        <div v-if="message" class="notice">{{ message }}</div>
      </form>
    </div>

    <div class="card">
      <h2>Баланс</h2>
      <div v-if="token" class="notice">
        Баланс: {{ balance }} · Бонус: {{ bonus }}
      </div>
      <div v-else class="notice">Баланс доступен после входа.</div>
      <div class="balance-actions" v-if="token">
        <form class="balance-form" @submit.prevent="deposit">
          <input v-model.number="depositForm.amount" type="number" min="1" placeholder="Сумма" />
          <input v-model="depositForm.method" type="text" placeholder="Метод оплаты" />
          <button class="btn secondary" type="submit">Пополнить</button>
        </form>
        <form class="balance-form" @submit.prevent="withdraw">
          <input v-model.number="withdrawForm.amount" type="number" min="1" placeholder="Сумма" />
          <input v-model="withdrawForm.wallet" type="text" placeholder="Кошелек/карта" />
          <button class="btn secondary" type="submit">Вывести</button>
        </form>
      </div>
      <div v-else class="notice">Войдите, чтобы управлять балансом.</div>
    </div>
  </section>

  <section class="grid-2">
    <div class="card">
      <h2>История транзакций</h2>
      <div v-if="!token" class="notice">История доступна после входа.</div>
      <table v-else class="table">
        <thead>
          <tr>
            <th>Тип</th>
            <th>Сумма</th>
            <th>Статус</th>
            <th>Дата</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in transactions" :key="item.id">
            <td>{{ item.type }}</td>
            <td>{{ item.amount }}</td>
            <td>{{ item.status }}</td>
            <td>{{ formatDate(item.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="card">
      <h2>Мои ставки</h2>
      <div v-if="!token" class="notice">Ставки доступны после входа.</div>
      <table v-else class="table">
        <thead>
          <tr>
            <th>Тип</th>
            <th>Ставка</th>
            <th>Коэф.</th>
            <th>Выигрыш</th>
            <th>Статус</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="bet in bets" :key="bet.id">
            <td>{{ bet.type }}</td>
            <td>{{ bet.stake }}</td>
            <td>{{ bet.totalOdds }}</td>
            <td>{{ bet.potentialWin }}</td>
            <td>{{ bet.status }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <section class="grid-2">
    <div class="card">
      <h2>KYC</h2>
      <div class="notice">Статус: {{ kycStatus }}</div>
      <RouterLink to="/kyc" class="btn secondary">Перейти в KYC</RouterLink>
    </div>
    <div class="card">
      <h2>Поддержка</h2>
      <div class="notice">Обращений: {{ supportThreads.length }}</div>
      <RouterLink to="/support" class="btn secondary">Открыть поддержку</RouterLink>
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
      profile: {},
      balance: "0.00",
      bonus: "0.00",
      transactions: [],
      bets: [],
      message: "",
      passwords: { old_pass: "", new_pass: "" },
      depositForm: { amount: 0, method: "" },
      withdrawForm: { amount: 0, wallet: "" },
      kycStatus: "Нет",
      supportThreads: [],
    };
  },
  computed: {
    isAdmin() {
      return this.profile?.role === "ADMIN";
    },
    tokenValue() {
      return authState.token;
    },
  },
  async mounted() {
    this.token = authState.token;
    if (this.token) {
      await this.fetchProfile();
      await this.fetchBalance();
      await this.fetchTransactions();
      await this.fetchBets();
      await this.fetchKyc();
      await this.fetchSupport();
    }
  },
  watch: {
    async tokenValue(value) {
      this.token = value;
      if (value) {
        await this.fetchProfile();
        await this.fetchBalance();
        await this.fetchTransactions();
        await this.fetchBets();
        await this.fetchKyc();
        await this.fetchSupport();
      }
    },
  },
  methods: {
    async api(path, options = {}) {
      return apiFetch(path, {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${authState.token}`,
        },
      });
    },
    async fetchProfile() {
      this.profile = await this.api("/user/profile");
    },
    async fetchBalance() {
      const data = await this.api("/user/get_balance", { method: "POST" });
      if (data?.data) {
        this.balance = data.data.balance;
        this.bonus = data.data.bonus;
      }
    },
    async fetchTransactions() {
      this.transactions = await this.api("/user/transactions");
    },
    async fetchBets() {
      this.bets = await this.api("/user/bets");
    },
    async saveProfile() {
      const body = {
        name: this.profile.name,
        email: this.profile.email,
        phone: this.profile.phone,
        old_pass: this.passwords.old_pass,
        new_pass: this.passwords.new_pass,
      };
      try {
        const res = await this.api("/user/set_info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        this.message = res.success || res.message || "Сохранено";
        notify({ type: "success", text: "Профиль сохранен" });
        this.passwords.old_pass = "";
        this.passwords.new_pass = "";
      } catch (e) {
        notify({ type: "error", text: "Не удалось сохранить профиль" });
      }
    },
    async deposit() {
      try {
        const res = await this.api("/user/deposit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(this.depositForm),
        });
        this.message = res.success || res.message || "Готово";
        notify({ type: "success", text: "Баланс пополнен" });
        await this.fetchBalance();
      } catch (e) {
        notify({ type: "error", text: "Ошибка пополнения" });
      }
    },
    async withdraw() {
      try {
        const res = await this.api("/user/withdraw", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(this.withdrawForm),
        });
        this.message = res.success || res.message || "Готово";
        notify({ type: "success", text: "Запрос на вывод создан" });
        await this.fetchBalance();
      } catch (e) {
        notify({ type: "error", text: "Ошибка вывода" });
      }
    },
    async fetchKyc() {
      const data = await this.api("/user/kyc");
      this.kycStatus = data?.status || "PENDING";
    },
    async fetchSupport() {
      this.supportThreads = await this.api("/user/support");
    },
    formatDate(value) {
      return new Date(value).toLocaleString();
    },
  },
};
</script>
