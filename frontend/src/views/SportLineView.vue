<template>
  <section class="hero">
    <div>
      <h1>Спортивная линия</h1>
      <p>Актуальные прематч события, коэффициенты и быстрый купон.</p>
    </div>
    <div class="card">
      <h2>Фильтры</h2>
      <div class="form">
        <input v-model="search" type="text" placeholder="Поиск по событию или лиге" />
        <div class="split">
          <select v-model="sportFilter" @change="loadEvents">
            <option value="soccer">Футбол</option>
            <option value="basketball">Баскетбол</option>
            <option value="tennis">Теннис</option>
            <option value="hockey">Хоккей</option>
            <option value="volleyball">Волейбол</option>
            <option value="baseball">Бейсбол</option>
            <option value="rugby">Регби</option>
            <option value="table_tennis">Настольный теннис</option>
            <option value="esports">Киберспорт</option>
          </select>
          <button class="btn secondary" @click="loadEvents">Обновить</button>
        </div>
      </div>
    </div>
  </section>

  <section class="grid-2">
    <div class="card">
      <h2>События ({{ filteredEvents.length }})</h2>
      <div v-if="loading" class="notice">Загрузка событий...</div>
      <div v-else-if="error" class="notice">{{ error }}</div>
      <div v-else-if="filteredEvents.length === 0" class="notice">Событий нет</div>
      <div v-else class="form">
        <div v-for="event in filteredEvents" :key="event.game_id" class="match-card">
          <div class="match-meta">
            <span class="match-league">
              <img :src="sportIcon(sportFilter)" alt="" />
              {{ event.league || 'League' }} &middot; {{ sportLabel(sportFilter) }}
            </span>
            <span class="badge">{{ formatDate(event.time) }}</span>
          </div>
          <div class="team-row">
            <span class="team-name">{{ event.home }}</span>
            <span class="score">--</span>
          </div>
          <div class="team-row">
            <span class="team-name">{{ event.away }}</span>
            <span class="score">--</span>
          </div>

          <!-- Inline odds if loaded -->
          <div v-if="oddsCache[event.game_id]" class="market-grid" style="margin-top: 6px;">
            <div v-for="(market, mName) in limitMarkets(oddsCache[event.game_id])" :key="mName" class="market-box">
              <div class="market-title">{{ mName }}</div>
              <div class="market-odds">
                <button
                  v-for="(val, outKey) in market"
                  :key="outKey"
                  class="odd compact"
                  :class="{ active: isSelected(event.game_id, `${mName}_${outKey}`) }"
                  @click="toggleSelection(event, `${mName}_${outKey}`, val, outKey)"
                >
                  {{ outKey }} <span>{{ val }}</span>
                </button>
              </div>
            </div>
          </div>

          <button
            v-if="!oddsCache[event.game_id] && !loadingOdds[event.game_id]"
            class="btn secondary"
            style="margin-top: 6px"
            @click="loadOddsForGame(event.game_id)"
          >
            Загрузить коэффициенты
          </button>
          <div v-if="loadingOdds[event.game_id]" class="notice" style="margin-top:4px">Загрузка кф...</div>
        </div>
      </div>
    </div>

    <aside class="betslip card">
      <h2>Купон</h2>
      <div v-if="selections.length === 0" class="notice">Выберите исходы.</div>
      <div v-else class="form">
        <div v-for="item in selections" :key="item.key" class="betslip-item">
          <strong>{{ item.eventName }}</strong>
          <div class="notice">{{ item.market }} &middot; {{ item.odd }}</div>
          <button class="btn ghost" @click="removeSelection(item.key)">Удалить</button>
        </div>
        <select v-model="betType">
          <option value="SINGLE">Одиночная</option>
          <option value="EXPRESS">Экспресс</option>
          <option value="SYSTEM">Система</option>
        </select>
        <input v-model.number="stake" type="number" min="1" placeholder="Ставка" />
        <div class="notice">
          Коэф: {{ totalOdds }} &middot; Потенц. выигрыш: {{ potentialWin }}
        </div>
        <button class="btn" @click="placeBet">Сделать ставку</button>
        <div v-if="message" class="notice">{{ message }}</div>
      </div>
    </aside>
  </section>
</template>

<script>
import { apiFetch } from "../services/api.js";
import { authState } from "../state/auth.js";
import { notify } from "../state/notifications.js";

export default {
  data() {
    return {
      events: [],
      loading: false,
      error: "",
      search: "",
      sportFilter: "soccer",
      selections: [],
      betType: "SINGLE",
      stake: 50,
      message: "",
      oddsCache: {},
      loadingOdds: {},
    };
  },
  computed: {
    filteredEvents() {
      const term = this.search.toLowerCase();
      return this.events.filter((event) => {
        const text = `${event.home || ''} ${event.away || ''} ${event.league || ''}`.toLowerCase();
        return term ? text.includes(term) : true;
      });
    },
    totalOdds() {
      const total = this.selections.reduce((acc, s) => acc * s.odd, 1);
      return total.toFixed(2);
    },
    potentialWin() {
      return (Number(this.stake || 0) * Number(this.totalOdds || 0)).toFixed(2);
    },
  },
  mounted() {
    this.loadEvents();
  },
  methods: {
    async loadEvents() {
      this.loading = true;
      this.error = "";
      this.oddsCache = {};
      try {
        const data = await apiFetch(`/sports/prematch?sport=${this.sportFilter}`);
        if (data && Array.isArray(data)) {
          this.events = data;
        } else if (data && data.results) {
          this.events = data.results;
        } else if (data && typeof data === 'object') {
          // flatten leagues -> games
          const flat = [];
          for (const leagueKey of Object.keys(data)) {
            const games = data[leagueKey];
            if (Array.isArray(games)) {
              games.forEach(g => flat.push({ ...g, league: leagueKey }));
            } else if (games && typeof games === 'object' && !games.home) {
              for (const subKey of Object.keys(games)) {
                const subGames = games[subKey];
                if (Array.isArray(subGames)) {
                  subGames.forEach(g => flat.push({ ...g, league: `${leagueKey} - ${subKey}` }));
                }
              }
            }
          }
          this.events = flat.length ? flat : [];
        } else {
          this.events = [];
        }
      } catch (e) {
        this.error = "Не удалось загрузить события";
      } finally {
        this.loading = false;
      }
    },
    async loadOddsForGame(gameId) {
      if (!gameId) return;
      this.loadingOdds = { ...this.loadingOdds, [gameId]: true };
      try {
        const data = await apiFetch(`/sports/prematch/odds?game_id=${gameId}`);
        if (data && typeof data === 'object') {
          if (data.odds) {
            this.oddsCache = { ...this.oddsCache, [gameId]: this.normalizeOdds(data.odds) };
          } else if (data.results) {
            this.oddsCache = { ...this.oddsCache, [gameId]: this.normalizeOdds(data.results) };
          } else {
            this.oddsCache = { ...this.oddsCache, [gameId]: this.normalizeOdds(data) };
          }
        }
      } catch (e) {
        // silent
      } finally {
        this.loadingOdds = { ...this.loadingOdds, [gameId]: false };
      }
    },
    normalizeOdds(raw) {
      // If it's already { marketName: { outcome: value } }, return it
      if (typeof raw !== 'object') return {};
      // Check if top-level keys look like markets (strings mapping to objects)
      const result = {};
      for (const key of Object.keys(raw)) {
        const val = raw[key];
        if (val && typeof val === 'object' && !Array.isArray(val)) {
          result[key] = val;
        } else if (typeof val === 'number' || typeof val === 'string') {
          // Flat structure like { "1": 2.5, "X": 3.1, "2": 2.8 }
          if (!result['Main']) result['Main'] = {};
          result['Main'][key] = val;
        }
      }
      return Object.keys(result).length ? result : { 'Raw': raw };
    },
    limitMarkets(marketsObj) {
      if (!marketsObj || typeof marketsObj !== 'object') return {};
      const entries = Object.entries(marketsObj);
      return Object.fromEntries(entries.slice(0, 5));
    },
    isSelected(gameId, market) {
      return this.selections.some((s) => s.eventId === gameId && s.market === market);
    },
    toggleSelection(event, market, odd, outKey) {
      const key = `${event.game_id}-${market}`;
      const existing = this.selections.find((s) => s.key === key);
      if (existing) {
        this.selections = this.selections.filter((s) => s.key !== key);
        return;
      }
      this.selections.push({
        key,
        eventId: event.game_id,
        eventName: `${event.home} - ${event.away}`,
        market,
        odd: Number(odd) || 1.0,
        outcome: outKey,
      });
    },
    removeSelection(key) {
      this.selections = this.selections.filter((s) => s.key !== key);
    },
    async placeBet() {
      if (!authState.token) {
        notify({ type: "warn", text: "Нужна авторизация" });
        return;
      }
      if (!this.selections.length) {
        notify({ type: "warn", text: "Добавьте исходы" });
        return;
      }
      try {
        await apiFetch("/bets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authState.token}`,
          },
          body: JSON.stringify({
            type: this.betType,
            stake: Number(this.stake),
            selections: this.selections.map((s) => ({
              eventId: s.eventId,
              eventName: s.eventName,
              market: s.market,
              odd: s.odd,
              outcome: s.outcome,
            })),
          }),
        });
        this.message = "Ставка принята";
        notify({ type: "success", text: "Ставка принята" });
        this.selections = [];
      } catch (e) {
        this.message = e?.data?.message || "Не удалось сделать ставку";
        notify({ type: "error", text: this.message });
      }
    },
    formatDate(value) {
      if (!value) return '';
      const date = new Date(value);
      if (isNaN(date.getTime())) return String(value);
      return date.toLocaleString();
    },
    sportLabel(key) {
      const map = {
        soccer: 'Футбол', basketball: 'Баскетбол', tennis: 'Теннис',
        hockey: 'Хоккей', volleyball: 'Волейбол', baseball: 'Бейсбол',
        rugby: 'Регби', table_tennis: 'Настольный теннис', esports: 'Киберспорт',
      };
      return map[key] || key;
    },
    sportIcon(sport) {
      const key = String(sport || "").toLowerCase();
      if (key.includes("soccer") || key.includes("футбол")) return "/img/category/category_1675198236_5281.png";
      if (key.includes("hockey") || key.includes("хоккей")) return "/img/category/category_1675198324_4587.png";
      if (key.includes("tennis")) return "/img/category/category_1675198376_4119.png";
      if (key.includes("basketball") || key.includes("баскетбол")) return "/img/category/category_1675198441_1832.png";
      if (key.includes("baseball") || key.includes("бейсбол")) return "/img/category/category_1675199076_2804.png";
      if (key.includes("volleyball") || key.includes("волейбол")) return "/img/category/category_1675198703_9520.png";
      if (key.includes("rugby") || key.includes("регби")) return "/img/category/category_1675198884_7441.png";
      if (key.includes("table_tennis") || key.includes("настол")) return "/img/category/category_1675199784_5955.png";
      return "/img/sport.png";
    },
  },
};
</script>
