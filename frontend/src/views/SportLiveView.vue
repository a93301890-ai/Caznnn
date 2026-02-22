<template>
  <section class="hero">
    <div>
      <h1>Live-линия</h1>
      <p>События в реальном времени от BookiesAPI. Авто-обновление каждые 15 сек.</p>
    </div>
    <div class="card">
      <h2>Фильтры</h2>
      <div class="form">
        <input v-model="search" type="text" placeholder="Поиск по событию или лиге" />
        <select v-model="sportFilter">
          <option value="">Все виды спорта</option>
          <option v-for="sport in sports" :key="sport" :value="sport">
            {{ sport }}
          </option>
        </select>
      </div>
    </div>
  </section>

  <section class="live-center">
    <div class="live-board">
      <h2>Live-центр</h2>
      <div v-if="featuredEvent" class="match-card">
        <div class="match-meta">
          <span class="match-league">
            <img :src="sportIcon(featuredEvent.sport_id)" alt="" />
            {{ featuredEvent.league }} &middot; {{ featuredEvent.sport }}
          </span>
          <span class="badge success">LIVE</span>
        </div>
        <div class="team-row">
          <span class="team-name">{{ featuredEvent.home }}</span>
          <span class="score">{{ featuredEvent.score_home || '0' }}</span>
        </div>
        <div class="team-row">
          <span class="team-name">{{ featuredEvent.away }}</span>
          <span class="score">{{ featuredEvent.score_away || '0' }}</span>
        </div>
        <div class="live-score">
          {{ featuredEvent.timer || '' }} &middot; Счёт: {{ featuredEvent.score_home || '0' }}:{{ featuredEvent.score_away || '0' }}
        </div>
        <div v-if="featuredOdds" class="odds-row" style="margin-top: 8px;">
          <div v-for="(market, mKey) in featuredOdds" :key="mKey" class="odd">
            {{ mKey }} <span>{{ market }}</span>
          </div>
        </div>
        <button v-if="!featuredOdds && !loadingOdds" class="btn secondary" style="margin-top:8px" @click="loadOddsForGame(featuredEvent.game_id)">
          Показать коэффициенты
        </button>
        <div v-if="loadingOdds" class="notice" style="margin-top:8px">Загрузка кф...</div>
      </div>
      <div v-else class="notice">Нет live-матчей</div>
    </div>
    <div class="card">
      <h2>Пульс</h2>
      <div class="live-feed">
        <div v-for="item in feedItems" :key="item.id" class="live-feed-item">
          {{ item.text }}
        </div>
      </div>
    </div>
  </section>

  <section class="card">
    <h2>Live события ({{ filteredEvents.length }})</h2>
    <div v-if="loading" class="notice">Загрузка live-событий...</div>
    <div v-else-if="error" class="notice">{{ error }}</div>
    <div v-else-if="filteredEvents.length === 0" class="notice">Событий нет</div>
    <div v-else class="grid-2">
      <div v-for="event in filteredEvents" :key="event.game_id" class="match-card">
        <div class="match-meta">
          <span class="match-league">
            <img :src="sportIcon(event.sport_id)" alt="" />
            {{ event.league }} &middot; {{ event.sport }}
          </span>
          <span class="badge success">LIVE</span>
        </div>
        <div class="team-row">
          <span class="team-name">{{ event.home }}</span>
          <span class="score">{{ event.score_home || '0' }}</span>
        </div>
        <div class="team-row">
          <span class="team-name">{{ event.away }}</span>
          <span class="score">{{ event.score_away || '0' }}</span>
        </div>
        <div class="notice" style="font-size:0.85em;">
          {{ event.timer || '' }}
        </div>
        <div v-if="oddsCache[event.game_id]" class="odds-row">
          <div v-for="(val, key) in limitOdds(oddsCache[event.game_id])" :key="key" class="odd">
            {{ key }} <span>{{ val }}</span>
          </div>
        </div>
        <button v-else class="btn secondary" style="margin-top:4px" @click="loadOddsForGame(event.game_id)">
          Коэффициенты
        </button>
      </div>
    </div>
  </section>
</template>

<script>
import { apiFetch } from "../services/api.js";

export default {
  data() {
    return {
      events: [],
      loading: true,
      error: "",
      search: "",
      sportFilter: "",
      oddsCache: {},
      loadingOdds: false,
      refreshTimer: null,
    };
  },
  computed: {
    sports() {
      return Array.from(new Set(this.events.map((e) => e.sport))).filter(Boolean).sort();
    },
    filteredEvents() {
      const term = this.search.toLowerCase();
      return this.events.filter((event) => {
        const text = `${event.home} ${event.away} ${event.league} ${event.sport}`.toLowerCase();
        const okSearch = term ? text.includes(term) : true;
        const okSport = this.sportFilter ? event.sport === this.sportFilter : true;
        return okSearch && okSport;
      });
    },
    featuredEvent() {
      return this.filteredEvents[0] || null;
    },
    featuredOdds() {
      if (!this.featuredEvent) return null;
      return this.oddsCache[this.featuredEvent.game_id] || null;
    },
    feedItems() {
      return this.filteredEvents.slice(0, 8).map((event, index) => ({
        id: `${event.game_id}-${index}`,
        text: `${event.home} vs ${event.away} — ${event.score_home || 0}:${event.score_away || 0} (${event.timer || 'live'})`,
      }));
    },
  },
  mounted() {
    this.loadLive();
    this.refreshTimer = setInterval(() => this.loadLive(), 15000);
  },
  beforeUnmount() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  },
  methods: {
    async loadLive() {
      try {
        const data = await apiFetch("/sports/live");
        if (data && Array.isArray(data)) {
          this.events = data;
        } else if (data && data.results) {
          this.events = data.results;
        } else if (data && typeof data === 'object') {
          // flatten sports -> leagues -> games
          const flat = [];
          for (const sportKey of Object.keys(data)) {
            const sportObj = data[sportKey];
            if (sportObj && typeof sportObj === 'object') {
              for (const leagueKey of Object.keys(sportObj)) {
                const games = sportObj[leagueKey];
                if (Array.isArray(games)) {
                  games.forEach(g => flat.push({ ...g, sport: sportKey, league: leagueKey }));
                }
              }
            }
          }
          this.events = flat.length ? flat : [];
        } else {
          this.events = [];
        }
        this.error = "";
      } catch (e) {
        this.error = "Не удалось загрузить live-события";
      } finally {
        this.loading = false;
      }
    },
    async loadOddsForGame(gameId) {
      if (!gameId) return;
      this.loadingOdds = true;
      try {
        const data = await apiFetch(`/sports/live/odds?game_id=${gameId}`);
        // Store flat odds object or extract from nested
        if (data && typeof data === 'object') {
          if (data.odds) {
            this.oddsCache[gameId] = data.odds;
          } else if (data.results) {
            this.oddsCache[gameId] = data.results;
          } else {
            this.oddsCache[gameId] = data;
          }
        }
      } catch (e) {
        // silent
      } finally {
        this.loadingOdds = false;
      }
    },
    limitOdds(oddsObj) {
      if (!oddsObj || typeof oddsObj !== 'object') return {};
      const entries = Object.entries(oddsObj);
      const limited = entries.slice(0, 6);
      return Object.fromEntries(limited);
    },
    sportIcon(sportId) {
      const id = String(sportId || "");
      if (id === "1" || id === "soccer") return "/img/category/category_1675198236_5281.png";
      if (id === "2" || id === "tennis") return "/img/category/category_1675198376_4119.png";
      if (id === "3" || id === "basketball") return "/img/category/category_1675198441_1832.png";
      if (id === "4" || id === "hockey") return "/img/category/category_1675198324_4587.png";
      if (id === "5" || id === "volleyball") return "/img/category/category_1675198703_9520.png";
      if (id === "8" || id === "baseball") return "/img/category/category_1675199076_2804.png";
      if (id === "12" || id === "rugby") return "/img/category/category_1675198884_7441.png";
      if (id === "15" || id === "table_tennis") return "/img/category/category_1675199784_5955.png";
      return "/img/sport.png";
    },
  },
};
</script>
