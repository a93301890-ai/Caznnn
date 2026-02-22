<template>
  <section class="hero">
    <div>
      <h1>Админ‑панель</h1>
      <p>Управление пользователями, ставками, событиями и финансами.</p>
    </div>
    <div class="card">
      <h2>Статус</h2>
      <div class="notice">{{ isAdmin ? "Доступ разрешён" : "Нет доступа" }}</div>
    </div>
  </section>

  <section class="card">
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab"
        class="tab"
        :class="{ active: activeTab === tab }"
        @click="activeTab = tab"
      >
        {{ tab }}
      </button>
    </div>

    <div v-if="!token" class="notice">Требуется авторизация.</div>
    <div v-else-if="!isAdmin" class="notice">Нужна роль ADMIN.</div>

    <div v-else>
      <div v-if="activeTab === 'Users'" class="form">
        <button class="btn secondary" @click="loadUsers">Обновить</button>
        <table class="table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Роль</th>
              <th>Статус</th>
              <th>Баланс</th>
              <th>Начисление</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.email }}</td>
              <td>
                <select v-model="user.role">
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </td>
              <td>{{ user.status }}</td>
              <td>{{ user.balance }}</td>
              <td class="split">
                <input
                  v-model="user.adjustAmount"
                  type="number"
                  placeholder="Сумма"
                />
                <input
                  v-model="user.adjustReason"
                  type="text"
                  placeholder="Причина"
                />
                <button class="btn secondary" @click="adjustBalance(user)">
                  Зачислить
                </button>
              </td>
              <td class="split">
                <button class="btn secondary" @click="saveUser(user)">Сохранить</button>
                <button class="btn secondary" @click="toggleStatus(user)">
                  {{ user.status === "ACTIVE" ? "Бан" : "Разбан" }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="activeTab === 'Bets'" class="form">
        <button class="btn secondary" @click="loadBets">Обновить</button>
        <table class="table">
          <thead>
            <tr>
              <th>Пользователь</th>
              <th>Тип</th>
              <th>Ставка</th>
              <th>Коэф.</th>
              <th>Статус</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="bet in bets" :key="bet.id">
              <td>{{ bet.user?.email }}</td>
              <td>{{ bet.type }}</td>
              <td>{{ bet.stake }}</td>
              <td>{{ bet.totalOdds }}</td>
              <td>{{ bet.status }}</td>
              <td class="split">
                <button class="btn secondary" @click="settleBet(bet, 'WON')">WON</button>
                <button class="btn secondary" @click="settleBet(bet, 'LOST')">LOST</button>
                <button class="btn secondary" @click="settleBet(bet, 'VOID')">VOID</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="activeTab === 'Transactions'" class="form">
        <button class="btn secondary" @click="loadTransactions">Обновить</button>
        <table class="table">
          <thead>
            <tr>
              <th>Пользователь</th>
              <th>Тип</th>
              <th>Сумма</th>
              <th>Статус</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tx in transactions" :key="tx.id">
              <td>{{ tx.user?.email }}</td>
              <td>{{ tx.type }}</td>
              <td>{{ tx.amount }}</td>
              <td>{{ tx.status }}</td>
              <td class="split">
                <button class="btn secondary" @click="updateTx(tx, 'COMPLETED')">
                  Подтвердить
                </button>
                <button class="btn secondary" @click="updateTx(tx, 'REJECTED')">
                  Отклонить
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="activeTab === 'Events'" class="form">
        <div class="split">
          <input v-model="newEvent.sport" placeholder="Вид спорта" />
          <input v-model="newEvent.league" placeholder="Лига" />
          <input v-model="newEvent.name" placeholder="Событие" />
          <input
            v-model="newEvent.startTime"
            type="datetime-local"
            placeholder="Дата и время"
          />
        </div>
        <textarea v-model="newEvent.markets" placeholder="JSON markets"></textarea>
        <button class="btn secondary" @click="createEvent">Создать событие</button>
        <button class="btn secondary" @click="loadEvents">Обновить</button>
        <table class="table">
          <thead>
            <tr>
              <th>Событие</th>
              <th>Лига</th>
              <th>Статус</th>
              <th>Live</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="event in events" :key="event.id">
              <td>{{ event.name }}</td>
              <td>{{ event.league }}</td>
              <td>
                <select v-model="event.status">
                  <option value="SCHEDULED">SCHEDULED</option>
                  <option value="LIVE">LIVE</option>
                  <option value="FINISHED">FINISHED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </td>
              <td>
                <select v-model="event.isLive">
                  <option :value="true">true</option>
                  <option :value="false">false</option>
                </select>
              </td>
              <td>
                <button class="btn secondary" @click="updateEvent(event)">
                  Сохранить
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="activeTab === 'Logs'" class="form">
        <button class="btn secondary" @click="loadLogs">Обновить</button>
        <table class="table">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Действие</th>
              <th>User</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id">
              <td>{{ formatDate(log.createdAt) }}</td>
              <td>{{ log.action }}</td>
              <td>{{ log.userId || "-" }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="activeTab === 'KYC'" class="form">
        <button class="btn secondary" @click="loadKyc">Обновить</button>
        <table class="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Статус</th>
              <th>Дата</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in kyc" :key="item.id">
              <td>{{ item.user?.email }}</td>
              <td>{{ item.status }}</td>
              <td>{{ formatDate(item.createdAt) }}</td>
              <td class="split">
                <button class="btn secondary" @click="updateKyc(item, 'APPROVED')">
                  Approve
                </button>
                <button class="btn secondary" @click="updateKyc(item, 'REJECTED')">
                  Reject
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="activeTab === 'Support'" class="form">
        <button class="btn secondary" @click="loadSupport">Обновить</button>
        <table class="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Сообщение</th>
              <th>Дата</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in support" :key="item.id">
              <td>{{ item.user?.email }}</td>
              <td>{{ item.message }}</td>
              <td>{{ formatDate(item.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
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
      role: "",
      tabs: ["Users", "Bets", "Transactions", "Events", "Logs", "KYC", "Support"],
      activeTab: "Users",
      users: [],
      bets: [],
      transactions: [],
      events: [],
      logs: [],
      kyc: [],
      support: [],
      newEvent: {
        sport: "",
        league: "",
        name: "",
        startTime: "",
        markets: "",
      },
    };
  },
  computed: {
    isAdmin() {
      return this.role === "ADMIN";
    },
    tokenValue() {
      return authState.token;
    },
  },
  async mounted() {
    this.token = authState.token;
    if (this.token) {
      await this.loadProfile();
    }
  },
  watch: {
    async tokenValue(value) {
      this.token = value;
      if (value) {
        await this.loadProfile();
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
    async loadProfile() {
      const profile = await this.api("/user/profile");
      this.role = profile?.role || "";
      if (this.isAdmin) {
        await Promise.all([
          this.loadUsers(),
          this.loadBets(),
          this.loadTransactions(),
          this.loadEvents(),
          this.loadLogs(),
          this.loadKyc(),
          this.loadSupport(),
        ]);
      }
    },
    async loadUsers() {
      const list = await this.api("/admin/users");
      this.users = list.map((user) => ({
        ...user,
        adjustAmount: "",
        adjustReason: "",
      }));
    },
    async adjustBalance(user) {
      const amount = Number(user.adjustAmount);
      if (!Number.isFinite(amount) || amount === 0) {
        notify({ type: "warn", text: "Введите сумму" });
        return;
      }
      try {
        await this.api(`/admin/users/${user.id}/balance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount,
            reason: user.adjustReason || "",
          }),
        });
        notify({ type: "success", text: "Баланс обновлен" });
        user.adjustAmount = "";
        user.adjustReason = "";
        await this.loadUsers();
      } catch (e) {
        notify({ type: "error", text: e?.message || "Ошибка начисления" });
      }
    },
    async saveUser(user) {
      await this.api(`/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, role: user.role }),
      });
    },
    async toggleStatus(user) {
      const status = user.status === "ACTIVE" ? "BANNED" : "ACTIVE";
      await this.api(`/admin/users/${user.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      user.status = status;
    },
    async loadBets() {
      this.bets = await this.api("/admin/bets");
    },
    async settleBet(bet, status) {
      await this.api(`/admin/bets/${bet.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      bet.status = status;
    },
    async loadTransactions() {
      this.transactions = await this.api("/admin/transactions");
    },
    async updateTx(tx, status) {
      await this.api(`/admin/transactions/${tx.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      tx.status = status;
    },
    async loadEvents() {
      this.events = await this.api("/sports/events");
    },
    async createEvent() {
      let markets;
      if (this.newEvent.markets) {
        try {
          markets = JSON.parse(this.newEvent.markets);
        } catch (e) {
          notify({ type: "warn", text: "Некорректный JSON markets" });
          return;
        }
      }
      try {
        const startTime = this.newEvent.startTime
          ? new Date(this.newEvent.startTime).toISOString()
          : "";
        if (!startTime) {
          notify({ type: "warn", text: "Укажите дату и время" });
          return;
        }
        await this.api("/sports/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sport: this.newEvent.sport,
            league: this.newEvent.league,
            name: this.newEvent.name,
            startTime,
            markets,
          }),
        });
        notify({ type: "success", text: "Событие создано" });
        this.newEvent = { sport: "", league: "", name: "", startTime: "", markets: "" };
        await this.loadEvents();
      } catch (e) {
        notify({
          type: "error",
          text: e?.data?.message || e?.message || "Не удалось создать событие",
        });
      }
    },
    async updateEvent(event) {
      try {
        await this.api(`/admin/events/${event.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            league: event.league,
            name: event.name,
            startTime: event.startTime,
            status: event.status,
            isLive: event.isLive,
            score: event.score,
            markets: event.markets,
          }),
        });
        notify({ type: "success", text: "Событие обновлено" });
      } catch (e) {
        notify({ type: "error", text: "Не удалось обновить событие" });
      }
    },
    async loadLogs() {
      this.logs = await this.api("/admin/logs");
    },
    async loadKyc() {
      this.kyc = await this.api("/admin/kyc");
    },
    async updateKyc(item, status) {
      await this.api(`/admin/kyc/${item.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      item.status = status;
    },
    async loadSupport() {
      this.support = await this.api("/admin/support");
    },
    formatDate(value) {
      return new Date(value).toLocaleString();
    },
  },
};
</script>
