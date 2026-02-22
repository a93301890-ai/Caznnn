<template>
  <section class="hero">
    <div>
      <h1>Результаты матчей</h1>
      <p>Введите ID матча для получения результата из BookiesAPI.</p>
    </div>
  </section>

  <section class="card">
    <h2>Поиск результата</h2>
    <div class="form">
      <div class="split">
        <input v-model="gameId" type="text" placeholder="Game ID (например 90813885)" @keyup.enter="loadResult" />
        <select v-model="bookmaker">
          <option value="bet365">Bet365</option>
          <option value="1xbet">1xBet</option>
          <option value="pinnacle">Pinnacle</option>
          <option value="williamhill">William Hill</option>
        </select>
        <button class="btn" @click="loadResult" :disabled="loading || !gameId.trim()">
          {{ loading ? 'Загрузка...' : 'Найти результат' }}
        </button>
      </div>
    </div>
  </section>

  <section v-if="result" class="card">
    <h2>Результат матча</h2>
    <div class="match-card">
      <div class="match-meta">
        <span class="match-league">
          {{ result.league || result.sport || 'Match' }}
        </span>
        <span class="badge" :class="resultBadgeClass">{{ resultStatus }}</span>
      </div>
      <div class="team-row">
        <span class="team-name">{{ result.home || 'Home' }}</span>
        <span class="score">{{ result.score_home !== undefined ? result.score_home : '-' }}</span>
      </div>
      <div class="team-row">
        <span class="team-name">{{ result.away || 'Away' }}</span>
        <span class="score">{{ result.score_away !== undefined ? result.score_away : '-' }}</span>
      </div>
      <div v-if="result.time" class="notice" style="margin-top:8px">
        Время начала: {{ result.time }}
      </div>
    </div>

    <!-- Raw data for debugging -->
    <details style="margin-top: 12px;">
      <summary class="btn ghost">Показать полные данные</summary>
      <pre style="background: var(--surface); padding: 12px; border-radius: 8px; overflow-x: auto; font-size: 0.8em; margin-top: 8px;">{{ JSON.stringify(result, null, 2) }}</pre>
    </details>
  </section>

  <section v-if="error" class="card">
    <div class="notice">{{ error }}</div>
  </section>

  <section class="card">
    <h2>Быстрые ссылки</h2>
    <div class="split">
      <RouterLink to="/account" class="btn secondary">История ставок</RouterLink>
      <RouterLink to="/sport/live" class="btn secondary">Live события</RouterLink>
      <RouterLink to="/sport" class="btn secondary">Линия</RouterLink>
    </div>
  </section>
</template>

<script>
import { apiFetch } from "../services/api.js";

export default {
  data() {
    return {
      gameId: "",
      bookmaker: "bet365",
      result: null,
      loading: false,
      error: "",
    };
  },
  computed: {
    resultStatus() {
      if (!this.result) return '';
      if (this.result.status) return this.result.status;
      if (this.result.score_home !== undefined && this.result.score_away !== undefined) return 'Завершён';
      return 'Неизвестно';
    },
    resultBadgeClass() {
      const status = this.resultStatus.toLowerCase();
      if (status.includes('finish') || status.includes('завершён') || status.includes('ended')) return 'success';
      if (status.includes('live') || status.includes('progress')) return 'warning';
      return '';
    },
  },
  methods: {
    async loadResult() {
      if (!this.gameId.trim()) return;
      this.loading = true;
      this.error = "";
      this.result = null;
      try {
        const data = await apiFetch(`/sports/result?game_id=${this.gameId.trim()}&bookmaker=${this.bookmaker}`);
        if (data && typeof data === 'object') {
          if (data.error) {
            this.error = data.message || 'Результат не найден';
          } else if (data.results) {
            this.result = Array.isArray(data.results) ? data.results[0] : data.results;
          } else {
            this.result = data;
          }
        } else {
          this.error = "Неожиданный формат ответа";
        }
      } catch (e) {
        this.error = "Не удалось загрузить результат";
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
