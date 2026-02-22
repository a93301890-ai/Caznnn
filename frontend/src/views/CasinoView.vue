<template>
  <section class="hero casino-hero">
    <div>
      <h1>Казино</h1>
      <p>Игры от провайдеров, доступны только через API.</p>
    </div>
  </section>

  <section class="card">
    <div class="split" style="align-items: center">
      <h2>Игры</h2>
      <div class="topbar-actions">
        <button class="btn secondary" @click="loadSlots">Обновить</button>
      </div>
    </div>
    <p class="notice">Подборка игр от провайдеров. Показываются только данные API.</p>
    <div class="form" style="margin-top: 12px">
      <div class="split">
        <select v-model="arcadeCategory">
          <option value="">Все категории</option>
          <option v-for="c in arcadeCategories" :key="c" :value="c">{{ c }}</option>
        </select>
        <input v-model="search" type="text" placeholder="Поиск по названию" />
      </div>
    </div>
  </section>

  <section class="card slots-section">
    <div class="split" style="align-items: center">
      <h2>Каталог игр</h2>
    </div>
    <div v-if="loading" class="notice">Загрузка игр...</div>
    <div v-else-if="error" class="notice">{{ error }}</div>
    <div v-else-if="filteredSlots.length === 0" class="notice">Игры не найдены</div>
    <div v-else class="slot-groups">
      <div v-for="group in groupedSlots" :key="group.category" class="slot-group">
        <h3>{{ group.category }}</h3>
        <div class="grid-3 slot-grid">
          <div v-for="slot in group.slots" :key="slot.id" class="card slot-card">
            <div class="slot-card__media">
              <img
                class="slot-card__image"
                :src="slotImage(slot)"
                :alt="slot.name"
                @error="onSlotImageError($event, slot)"
              />
              <span class="slot-card__glow"></span>
            </div>
            <h3 class="slot-card__title">{{ slot.name }}</h3>
            <p class="notice">{{ slot.provider }} · {{ slot.category }}</p>
            <div class="split slot-card__actions">
              <button class="btn" @click="openSpin(slot)">Играть</button>
              <button class="btn secondary" @click="toggleFavorite(slot)">
                {{ favorites.has(slot.id) ? "★" : "☆" }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="filteredSlots.length" class="slots-footer">
      <div class="notice">
        Показано {{ Math.min(visibleCount, filteredSlots.length) }} из
        {{ filteredSlots.length }}
      </div>
      <button
        v-if="visibleCount < filteredSlots.length"
        class="btn secondary"
        @click="loadMoreSlots"
      >
        Показать еще
      </button>
    </div>
  </section>

  <section v-if="showLocalCasino" class="card slots-section">
    <h2>История игр</h2>
    <div class="spin-history">
      <div v-if="spinHistory.length === 0" class="notice">Пока нет раундов</div>
      <div v-else class="spin-item" v-for="item in spinHistory" :key="item.id">
        <div>
          <strong>{{ item.slot }}</strong>
          <div class="notice">{{ item.time }}</div>
        </div>
        <div class="spin-meta">
          <span>Ставка: {{ item.bet }}</span>
          <span>Выигрыш: {{ item.win }}</span>
        </div>
      </div>
    </div>
    <div v-if="filteredSlots.length" class="slots-footer">
      <div class="notice">
        Показано {{ Math.min(visibleCount, filteredSlots.length) }} из
        {{ filteredSlots.length }}
      </div>
      <button
        v-if="visibleCount < filteredSlots.length"
        class="btn secondary"
        @click="loadMoreSlots"
      >
        Показать еще
      </button>
    </div>
  </section>

  <section v-if="showLocalCasino" class="card lootboxes">
    <div class="split" style="align-items: center">
      <h2>Лутбоксы</h2>
      <div class="topbar-actions">
        <button class="btn secondary" @click="resetLootboxHistory">Сбросить историю</button>
      </div>
    </div>
    <p class="notice">
      Крути кейсы, открывай редкие призы и забирай награды в один клик.
    </p>
    <div class="grid-3 lootbox-grid">
      <div v-for="box in lootboxes" :key="box.id" class="card lootbox-card">
        <div class="lootbox-card__glow"></div>
        <div class="lootbox-card__head">
          <div>
            <h3>{{ box.title }}</h3>
            <p class="notice">{{ box.subtitle }}</p>
          </div>
          <span class="lootbox-price">{{ formatCoins(box.price) }}</span>
        </div>
        <div class="lootbox-card__preview">
          <div class="lootbox-chip" :class="`rarity-${box.theme}`">
            {{ box.theme.toUpperCase() }}
          </div>
          <div class="lootbox-orb"></div>
        </div>
        <div class="lootbox-card__footer">
          <button class="btn" @click="openLootbox(box)" :disabled="openingLootbox">
            Открыть
          </button>
          <button class="btn secondary" @click="previewLootbox(box)" :disabled="openingLootbox">
            Превью
          </button>
        </div>
      </div>
    </div>
  </section>

  <div v-if="showLocalCasino && showSpin" class="modal-overlay" @click.self="closeSpin">
    <div class="modal slot-modal">
      <h3>{{ activeSlot?.name }}</h3>
      <div class="slot-demo-title">Тип: {{ activeSlot?.category || "Слот" }}</div>
      <div class="slot-demo">
        <iframe
          ref="demoFrame"
          class="slot-demo-frame"
          :src="slotDemoUrl"
          title="Slot demo"
          @load="handleDemoLoad"
        ></iframe>
      </div>
      <div class="form">
        <input v-model.number="bet" type="number" min="1" placeholder="Ставка" />
        <button v-if="!isArcadeSlot(activeSlot)" class="btn" @click="spin" :disabled="!canSpin">
          {{ isSpinning ? "Крутится..." : demoReady ? "Крутить" : "Загрузка..." }}
        </button>
        <div v-else class="notice">Управление игрой внутри окна</div>
        <button class="btn secondary" @click="closeSpin">Закрыть</button>
      </div>
      <div v-if="spinResult && isArcadeSlot(activeSlot)" class="notice spin-result">
        {{ arcadeResultText || "Раунд завершен" }}
      </div>
      <div v-else-if="spinResult" class="notice spin-result">
        <div v-if="!isArcadeSlot(activeSlot)" class="spin-result-icons">
          <img
            v-for="(symbolId, index) in spinSymbols"
            :key="`result-${symbolId}-${index}`"
            :src="symbolById(symbolId)?.image"
            :alt="symbolById(symbolId)?.label"
          />
        </div>
        Результат: {{ spinResult.win }} (ставка {{ spinResult.bet }})
      </div>
    </div>
  </div>

  <div v-if="showLocalCasino && showLootbox" class="modal-overlay" @click.self="closeLootbox">
    <div class="modal lootbox-modal">
      <div class="lootbox-modal__head">
        <div>
          <h3>{{ activeLootbox?.title }}</h3>
          <p class="notice">{{ activeLootbox?.subtitle }}</p>
        </div>
        <button class="btn secondary" @click="closeLootbox">Закрыть</button>
      </div>
      <div class="lootbox-reel">
        <div class="lootbox-reel__track" :style="lootboxTrackStyle">
          <div
            v-for="(item, index) in lootboxRollItems"
            :key="`${item.id}-${index}`"
            class="lootbox-reel__item"
            :class="`rarity-${item.rarity}`"
          >
            <div class="lootbox-reel__title">{{ item.name }}</div>
            <div class="lootbox-reel__value">{{ formatCoins(item.value) }}</div>
          </div>
        </div>
        <div class="lootbox-reel__marker"></div>
      </div>
      <div class="lootbox-modal__result" v-if="lootboxResult">
        <div class="lootbox-result">
          <span class="lootbox-result__label">Выпало:</span>
          <span class="lootbox-result__name">{{ lootboxResult.name }}</span>
          <span class="lootbox-result__value">{{ formatCoins(lootboxResult.value) }}</span>
        </div>
      </div>
      <div class="lootbox-modal__actions">
        <button class="btn" @click="startLootboxRoll" :disabled="openingLootbox">
          {{ openingLootbox ? "Крутится..." : "Крутить" }}
        </button>
        <button class="btn secondary" @click="closeLootbox">Закрыть</button>
      </div>
      <div v-if="lootboxHistory.length" class="lootbox-history">
        <div class="notice">Последние открытия:</div>
        <div class="lootbox-history__row">
          <span v-for="item in lootboxHistory" :key="item.id" :class="`rarity-${item.rarity}`">
            {{ item.name }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { authState } from "../state/auth.js";
import { apiFetch, getApiBase } from "../services/api.js";
import { notify } from "../state/notifications.js";

export default {
  data() {
    return {
      slots: [],
      loading: false,
      openingRemote: false,
      showLocalCasino: false,
      error: "",
      search: "",
      provider: "",
      category: "",
      arcadeCategory: "",
      favorites: new Set(),
      showSpin: false,
      activeSlot: null,
      bet: 50,
      spinResult: null,
      arcadeResultText: "",
      spinHistory: [],
      isSpinning: false,
      reelCount: 5,
      visibleCount: 48,
      pageSize: 48,
      spinSymbols: [],
      demoReady: false,
      pendingDemoPayload: null,
      pendingSpinResolve: null,
      demoMessageHandler: null,
      arcadeBalance: 0,
      arcadeBalanceLoaded: false,
      arcadeBalanceFetchedAt: 0,
      arcadeBalanceSource: "demo",
      lootboxes: [
        {
          id: "neon-core",
          title: "Neon Core",
          subtitle: "Быстрый кейс с неоновыми наградами.",
          price: 150,
          theme: "rare",
        },
        {
          id: "gold-rush",
          title: "Gold Rush",
          subtitle: "Легендарные призы и золото.",
          price: 450,
          theme: "legendary",
        },
        {
          id: "crystal-elite",
          title: "Crystal Elite",
          subtitle: "Максимальная редкость и сияние.",
          price: 900,
          theme: "epic",
        },
      ],
      lootboxItems: [
        { id: "coins-80", name: "80 монет", value: 80, rarity: "common", weight: 50 },
        { id: "coins-120", name: "120 монет", value: 120, rarity: "common", weight: 40 },
        { id: "coins-250", name: "250 монет", value: 250, rarity: "rare", weight: 20 },
        { id: "coins-500", name: "500 монет", value: 500, rarity: "rare", weight: 12 },
        { id: "coins-900", name: "900 монет", value: 900, rarity: "epic", weight: 6 },
        { id: "coins-1500", name: "1500 монет", value: 1500, rarity: "legendary", weight: 3 },
      ],
      showLootbox: false,
      activeLootbox: null,
      openingLootbox: false,
      lootboxRollItems: [],
      lootboxTrackOffset: 0,
      lootboxResult: null,
      lootboxHistory: [],
      symbols: [
        {
          id: "A",
          label: "A",
          image: "/slots/symbol-a.svg",
        },
        {
          id: "K",
          label: "K",
          image: "/slots/symbol-k.svg",
        },
        {
          id: "Q",
          label: "Q",
          image: "/slots/symbol-q.svg",
        },
        {
          id: "J",
          label: "J",
          image: "/slots/symbol-j.svg",
        },
        {
          id: "10",
          label: "10",
          image: "/slots/symbol-10.svg",
        },
        {
          id: "cherry",
          label: "Cherry",
          image: "/slots/symbol-cherry.svg",
        },
        {
          id: "lemon",
          label: "Lemon",
          image: "/slots/symbol-lemon.svg",
        },
        {
          id: "bell",
          label: "Bell",
          image: "/slots/symbol-bell.svg",
        },
        {
          id: "bar",
          label: "Bar",
          image: "/slots/symbol-bar.svg",
        },
        {
          id: "seven",
          label: "Seven",
          image: "/slots/symbol-seven.svg",
        },
        {
          id: "diamond",
          label: "Diamond",
          image: "/slots/symbol-diamond.svg",
        },
      ],
    };
  },
  computed: {
    slotDemoUrl() {
      return this.slotDemoSrc(this.activeSlot);
    },
    providers() {
      return Array.from(new Set(this.slots.map((s) => s.provider))).filter(Boolean);
    },
    categories() {
      return Array.from(new Set(this.slots.map((s) => s.category))).filter(Boolean);
    },
    arcadeCategories() {
      return Array.from(
        new Set(this.slots.map((slot) => slot.category || "Без категории")),
      ).filter(Boolean);
    },
    filteredSlots() {
      const term = this.search.toLowerCase();
      return this.slots.filter((slot) => {
        const name = String(slot.name || "").toLowerCase();
        const okSearch = term ? name.includes(term) : true;
        const category = slot.category || "Без категории";
        const okCategory = this.arcadeCategory ? category === this.arcadeCategory : true;
        return okSearch && okCategory;
      });
    },
    visibleSlots() {
      return this.filteredSlots.slice(0, this.visibleCount);
    },
    groupedSlots() {
      const groups = {};
      this.visibleSlots.forEach((slot) => {
        const category = slot.category || "Без категории";
        if (!groups[category]) groups[category] = [];
        groups[category].push(slot);
      });
      return Object.keys(groups)
        .sort()
        .map((category) => ({ category, slots: groups[category] }));
    },
    canSpin() {
      return this.demoReady && !this.isSpinning;
    },
    lootboxTrackStyle() {
      return {
        transform: `translateX(${this.lootboxTrackOffset}px)`,
      };
    },
  },
  watch: {
    search() {
      this.visibleCount = this.pageSize;
    },
    provider() {
      this.visibleCount = this.pageSize;
    },
    category() {
      this.visibleCount = this.pageSize;
    },
    arcadeCategory() {
      this.visibleCount = this.pageSize;
    },
    bet() {
      if (this.showSpin && this.isArcadeSlot(this.activeSlot)) {
        this.postDemoMessage({ type: "betUpdate", bet: this.bet });
      }
    },
  },
  mounted() {
    this.loadSlots();
    this.loadFavorites();
    this.demoMessageHandler = (event) => this.onDemoMessage(event);
    window.addEventListener("message", this.demoMessageHandler);
    this.ensureArcadeBalance();
  },
  beforeUnmount() {
    if (this.demoMessageHandler) {
      window.removeEventListener("message", this.demoMessageHandler);
    }
  },
  methods: {
    slotImage(slot) {
      return slot?.image || this.placeholderImage(slot?.name);
    },
    onSlotImageError(event, slot) {
      const target = event?.target;
      if (!target) return;
      const fallback = this.placeholderImage(slot?.name);
      if (target.src !== fallback) {
        target.src = fallback;
      }
    },
    placeholderImage(name) {
      const base = getApiBase();
      const title = encodeURIComponent(name || "Slot");
      return `${base}/casino/slots/placeholder?title=${title}`;
    },
    async ensureArcadeBalance(force = false) {
      if (this.arcadeBalanceLoaded && !force) return;
      if (authState.token) {
        try {
          const data = await apiFetch("/user/get_balance", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${authState.token}`,
            },
          });
          const balance = Number.parseFloat(String(data?.data?.balance || 0));
          this.arcadeBalance = Number.isFinite(balance) ? balance : 0;
          this.arcadeBalanceSource = "api";
          this.arcadeBalanceLoaded = true;
          this.arcadeBalanceFetchedAt = Date.now();
          return;
        } catch (e) {
          notify({ type: "warn", text: "Не удалось получить баланс" });
        }
      }
      const stored = Number(localStorage.getItem("arcade_balance_demo") || "10000");
      this.arcadeBalance = Number.isFinite(stored) ? stored : 10000;
      this.arcadeBalanceSource = "demo";
      this.arcadeBalanceLoaded = true;
      this.arcadeBalanceFetchedAt = Date.now();
    },
    persistArcadeBalance() {
      if (this.arcadeBalanceSource !== "demo") return;
      localStorage.setItem("arcade_balance_demo", String(Math.max(0, this.arcadeBalance)));
    },
    updateArcadeBalance(delta) {
      this.arcadeBalance = Math.max(0, this.arcadeBalance + delta);
      this.persistArcadeBalance();
      this.postDemoMessage({ type: "arcadeBalance", balance: this.arcadeBalance });
      window.dispatchEvent(
        new CustomEvent("balance:update", { detail: { balance: this.arcadeBalance } }),
      );
    },
    loadMoreSlots() {
      this.visibleCount += this.pageSize;
    },
    async loadSlots() {
      this.loading = true;
      this.error = "";
      try {
        const data = await apiFetch("/casino/slots");
        if (Array.isArray(data)) {
          const remoteOnly = data.filter((slot) => slot?.remote === true);
          this.slots = remoteOnly;
          if (!remoteOnly.length) {
            this.error = "Данные от API пока недоступны";
          }
          return;
        }
        this.slots = [];
        this.error = "Данные от API пока недоступны";
      } catch (e) {
        this.slots = [];
        this.error = "Данные от API пока недоступны";
      } finally {
        this.loading = false;
      }
    },
    loadFavorites() {
      try {
        const stored = JSON.parse(localStorage.getItem("casino_favorites") || "[]");
        this.favorites = new Set(stored);
      } catch (e) {
        this.favorites = new Set();
      }
    },
    saveFavorites() {
      localStorage.setItem("casino_favorites", JSON.stringify(Array.from(this.favorites)));
    },
    toggleFavorite(slot) {
      if (this.favorites.has(slot.id)) {
        this.favorites.delete(slot.id);
      } else {
        this.favorites.add(slot.id);
      }
      this.saveFavorites();
    },
    isRemoteSlot(slot) {
      return slot?.remote === true || slot?.source === "provider";
    },
    isArcadeSlot(slot) {
      const demoUrl = String(slot?.demoUrl || "");
      return demoUrl.includes("/games/arcade.html");
    },
    isDemoSlot(slot) {
      return String(slot?.id || "").startsWith("demo-");
    },
    createDemoResult() {
      const winRoll = Math.random();
      const winMultiplier = winRoll > 0.8 ? 4 : winRoll > 0.6 ? 2 : winRoll > 0.45 ? 1 : 0;
      return {
        win: Math.round(this.bet * winMultiplier),
        bet: this.bet,
        slot: { name: this.activeSlot?.name || "Слот" },
      };
    },
    openSpin(slot) {
      if (!authState.token) {
        notify({ type: "warn", text: "Нужна авторизация" });
        return;
      }
      if (this.isRemoteSlot(slot)) {
        this.openRemoteGame(slot);
        return;
      }
      if (this.isArcadeSlot(slot)) {
        const targetUrl = this.slotDemoSrc(slot);
        try {
          const url = new URL(targetUrl, window.location.origin);
          url.searchParams.set("bet", String(Math.max(1, Number(this.bet || 50))));
          window.location.assign(`${url.pathname}${url.search}`);
        } catch (e) {
          window.location.assign(targetUrl);
        }
        return;
      }
      this.activeSlot = slot;
      this.spinResult = null;
      this.showSpin = true;
      this.initReels();
      if (this.isArcadeSlot(slot)) {
        this.ensureArcadeBalance(true).then(() => {
          this.postDemoMessage({
            type: "arcadeInit",
            bet: this.bet,
            balance: this.arcadeBalance,
            source: this.arcadeBalanceSource,
          });
        });
      }
    },
    async openRemoteGame(slot) {
      if (this.openingRemote) return;
      this.openingRemote = true;
      try {
        const data = await apiFetch("/casino/open", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authState.token}`,
          },
          body: JSON.stringify({ gameId: slot?.id, demo: "1" }),
        });
        if (data?.status && data.status !== "success") {
          notify({
            type: "error",
            text: data?.error || "Не удалось открыть игру",
          });
          return;
        }
        const game = data?.content?.game || data?.game || data?.content || {};
        const url = game?.url || data?.url;
        if (!url) {
          throw new Error("Game URL not provided");
        }
        window.location.assign(url);
      } catch (e) {
        notify({
          type: "error",
          text: e?.data?.error || e?.data?.message || e?.message || "Не удалось открыть игру",
        });
      } finally {
        this.openingRemote = false;
      }
    },
    closeSpin() {
      this.showSpin = false;
      this.activeSlot = null;
      this.isSpinning = false;
      this.demoReady = false;
      this.pendingDemoPayload = null;
      this.spinSymbols = [];
      this.arcadeResultText = "";
    },
    formatCoins(value) {
      return `${Number(value || 0).toLocaleString("ru-RU")} ₵`;
    },
    openLootbox(box) {
      this.activeLootbox = box;
      this.showLootbox = true;
      this.lootboxResult = null;
      this.prepareLootboxRoll();
    },
    previewLootbox(box) {
      this.activeLootbox = box;
      this.showLootbox = true;
      this.lootboxResult = null;
      this.prepareLootboxRoll(true);
    },
    closeLootbox() {
      this.showLootbox = false;
      this.activeLootbox = null;
      this.openingLootbox = false;
      this.lootboxTrackOffset = 0;
      this.lootboxRollItems = [];
      this.lootboxResult = null;
    },
    resetLootboxHistory() {
      this.lootboxHistory = [];
    },
    prepareLootboxRoll(previewOnly = false) {
      const items = [];
      for (let i = 0; i < 24; i += 1) {
        items.push(this.pickLootboxItem());
      }
      this.lootboxRollItems = items;
      this.lootboxTrackOffset = 0;
      if (previewOnly) return;
    },
    pickLootboxItem() {
      const totalWeight = this.lootboxItems.reduce((sum, item) => sum + item.weight, 0);
      let roll = Math.random() * totalWeight;
      for (const item of this.lootboxItems) {
        roll -= item.weight;
        if (roll <= 0) return item;
      }
      return this.lootboxItems[this.lootboxItems.length - 1];
    },
    startLootboxRoll() {
      if (!this.activeLootbox || this.openingLootbox) return;
      this.openingLootbox = true;
      this.lootboxResult = null;
      const prize = this.pickLootboxItem();
      const rollItems = [];
      for (let i = 0; i < 20; i += 1) {
        rollItems.push(this.pickLootboxItem());
      }
      rollItems.push(prize);
      for (let i = 0; i < 12; i += 1) {
        rollItems.push(this.pickLootboxItem());
      }
      this.lootboxRollItems = rollItems;
      this.$nextTick(() => {
        const itemWidth = 180;
        const targetIndex = 20;
        const offset = -(itemWidth * targetIndex) + 140;
        this.lootboxTrackOffset = offset;
        window.setTimeout(() => {
          this.openingLootbox = false;
          this.lootboxResult = prize;
          this.lootboxHistory.unshift({
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            name: prize.name,
            rarity: prize.rarity,
          });
          this.lootboxHistory = this.lootboxHistory.slice(0, 8);
        }, 2200);
      });
    },
    async spin() {
      if (!this.activeSlot) return;
      if (!this.demoReady) return;
      if (this.isDemoSlot(this.activeSlot) && this.isArcadeSlot(this.activeSlot)) {
        this.isSpinning = true;
        this.arcadeResultText = "";
        const reelSymbols = this.randomSymbols(this.reelCount).map((s) => s.id);
        await this.spinReels(reelSymbols, { win: false });
        if (!this.arcadeResultText) {
          this.arcadeResultText = `${this.activeSlot?.name || "Игра"}: раунд завершен`;
        }
        this.spinResult = { win: 0, bet: this.bet };
        this.isSpinning = false;
        return;
      }
      if (this.isDemoSlot(this.activeSlot)) {
        this.isSpinning = true;
        const result = this.createDemoResult();
        const reelSymbols = this.pickSymbolsForResult(result);
        await this.spinReels(reelSymbols, { win: result?.win > 0 });
        this.spinResult = result;
        this.spinHistory.unshift({
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          slot: result.slot?.name || this.activeSlot?.name || "Слот",
          bet: result.bet,
          win: result.win,
          time: new Date().toLocaleTimeString(),
        });
        this.isSpinning = false;
        return;
      }
      try {
        this.isSpinning = true;
        const result = await apiFetch("/casino/spin", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authState.token}`,
          },
          body: JSON.stringify({ slotId: this.activeSlot.id, bet: this.bet }),
        });
        const reelSymbols = this.pickSymbolsForResult(result);
        await this.spinReels(reelSymbols, { win: result?.win > 0 });
        this.spinResult = result;
        this.spinHistory.unshift({
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          slot: result.slot?.name || this.activeSlot?.name || "Слот",
          bet: result.bet,
          win: result.win,
          time: new Date().toLocaleTimeString(),
        });
        notify({ type: "success", text: "Спин выполнен" });
      } catch (e) {
        const reelSymbols = this.randomSymbols(this.reelCount).map((s) => s.id);
        await this.spinReels(reelSymbols, { win: false });
        notify({
          type: "error",
          text: e?.data?.message || e?.message || "Не удалось выполнить спин",
        });
      } finally {
        this.isSpinning = false;
      }
    },
    initReels() {
      this.demoReady = false;
      this.pendingDemoPayload = null;
    },
    async spinReels(symbolIds, { win = false } = {}) {
      this.spinSymbols = this.isArcadeSlot(this.activeSlot) ? [] : symbolIds;
      const payload = {
        type: "spin",
        reels: symbolIds.map((symbolId) => {
          const target = this.symbolById(symbolId);
          return [
            this.randomSymbol()?.image,
            target?.image,
            this.randomSymbol()?.image,
          ].filter(Boolean);
        }),
        win,
        lines: win ? [0, 1, 2] : [],
      };
      return new Promise((resolve) => {
        this.pendingSpinResolve = resolve;
        this.postDemoMessage(payload);
        window.setTimeout(() => {
          if (this.pendingSpinResolve === resolve) {
            this.pendingSpinResolve = null;
            resolve();
          }
        }, 6000);
      });
    },
    pickSymbolsForResult(result) {
      const ids = this.randomSymbols(this.reelCount).map((s) => s.id);
      if (!result) return ids;
      if (result.win >= result.bet * 2) {
        const lucky = this.symbols[Math.floor(Math.random() * this.symbols.length)];
        return Array(this.reelCount).fill(lucky.id);
      }
      if (result.win > 0) {
        ids[1] = ids[0];
      }
      return ids;
    },
    randomSymbol() {
      return this.symbols[Math.floor(Math.random() * this.symbols.length)];
    },
    randomSymbols(count) {
      const pool = this.shuffle([...this.symbols]);
      return Array.from({ length: count }, (_, index) => pool[index % pool.length]);
    },
    shuffle(list) {
      for (let i = list.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
      }
      return list;
    },
    symbolById(id) {
      return this.symbols.find((symbol) => symbol.id === id);
    },
    slotDemoSrc(slot) {
      if (slot?.demoUrl) return slot.demoUrl;
      const category = String(slot?.category || "").toLowerCase();
      const id = String(slot?.id || "").toLowerCase();
      const name = String(slot?.name || "").toLowerCase();
      const key = `${category} ${id} ${name}`;
      if (
        key.includes("hyperdrive") ||
        key.includes("github") ||
        key.includes("opensource") ||
        key.includes("open source")
      ) {
        return "/slots/hyperdrive.html";
      }
      if (
        key.includes("dice") ||
        key.includes("кости")
      ) {
        return "/games/arcade.html?game=dice";
      }
      if (key.includes("plinko")) {
        return "/games/arcade.html?game=plinko";
      }
      if (key.includes("mines") || key.includes("мины")) {
        return "/games/arcade.html?game=mines";
      }
      if (key.includes("crash") || key.includes("краш")) {
        return "/games/arcade.html?game=crash";
      }
      if (key.includes("tower") || key.includes("башн")) {
        return "/games/arcade.html?game=tower";
      }
      if (key.includes("coinflip") || key.includes("coin") || key.includes("монет")) {
        return "/games/arcade.html?game=coinflip";
      }
      if (key.includes("jackpot") || key.includes("джекпот")) {
        return "/games/arcade.html?game=jackpot";
      }
      if (key.includes("roulette") || key.includes("рулет")) {
        return "/games/arcade.html?game=roulette";
      }
      if (key.includes("slots") || key.includes("слот")) {
        return "/slots/midas.html";
      }
      if (key.includes("wheel") || key.includes("колес")) return "/slots/wheel.html";
      if (key.includes("adventure") || key.includes("приключ")) return "/slots/adventure.html";
      if (key.includes("fantasy") || key.includes("фэнтези")) return "/slots/fantasy.html";
      if (key.includes("classic") || key.includes("класс")) return "/slots/midas.html";
      return "/slots/midas.html";
    },
    postDemoMessage(payload) {
      if (this.demoReady) {
        this.$refs.demoFrame?.contentWindow?.postMessage(payload, window.location.origin);
      } else {
        this.pendingDemoPayload = payload;
      }
    },
    handleDemoLoad() {
      if (this.isArcadeSlot(this.activeSlot)) {
        this.ensureArcadeBalance();
        const payload = {
          type: "arcadeInit",
          bet: this.bet,
          balance: this.arcadeBalance,
          source: this.arcadeBalanceSource,
        };
        this.$refs.demoFrame?.contentWindow?.postMessage(payload, window.location.origin);
        window.setTimeout(() => {
          if (!this.demoReady) {
            this.demoReady = true;
          }
        }, 1000);
        return;
      }
      const payload = {
        type: "init",
        reelCount: this.reelCount,
        symbols: this.symbols.map((symbol) => ({
          id: symbol.id,
          image: symbol.image,
          label: symbol.label,
        })),
      };
      this.$refs.demoFrame?.contentWindow?.postMessage(payload, window.location.origin);
    },
    onDemoMessage(event) {
      if (event.origin !== window.location.origin && event.origin !== "null") return;
      if (!event.data || typeof event.data !== "object") return;
      if (event.data.type === "arcadeBet") {
        const amount = Number(event.data.amount || 0);
        const id = event.data.id;
        const stale = Date.now() - this.arcadeBalanceFetchedAt > 10000;
        if (authState.token && stale) {
          this.ensureArcadeBalance(true).finally(() => undefined);
        }
        if (!Number.isFinite(amount) || amount <= 0) {
          this.postDemoMessage({ type: "arcadeBetResult", id, ok: false, balance: this.arcadeBalance });
          return;
        }
        if (this.arcadeBalance < amount) {
          this.postDemoMessage({ type: "arcadeBetResult", id, ok: false, balance: this.arcadeBalance });
          return;
        }
        this.updateArcadeBalance(-amount);
        this.postDemoMessage({ type: "arcadeBetResult", id, ok: true, balance: this.arcadeBalance });
        return;
      }
      if (event.data.type === "arcadePayout") {
        const amount = Number(event.data.amount || 0);
        if (Number.isFinite(amount) && amount > 0) {
          this.updateArcadeBalance(amount);
        }
        return;
      }
      if (event.data.type === "arcadeRequestBalance") {
        this.postDemoMessage({ type: "arcadeBalance", balance: this.arcadeBalance });
        return;
      }
      if (event.data.type === "ready") {
        this.demoReady = true;
        if (this.pendingDemoPayload) {
          this.postDemoMessage(this.pendingDemoPayload);
          this.pendingDemoPayload = null;
        }
        return;
      }
      if (event.data.type === "spinComplete") {
        if (this.isArcadeSlot(this.activeSlot)) {
          const text = String(event.data.resultText || "").trim();
          this.arcadeResultText = text || `${this.activeSlot?.name || "Игра"}: раунд завершен`;
          this.spinResult = { win: event.data.win ? this.bet : 0, bet: this.bet };
        }
        if (this.pendingSpinResolve) {
          this.pendingSpinResolve();
          this.pendingSpinResolve = null;
        }
      }
    },
    fallbackSlots() {
      return [
        {
          id: "demo-hyperdrive",
          name: "Hyperdrive Spin",
          provider: "OpenSource",
          category: "Sci-Fi",
          image: "/slots/symbol-seven.svg",
          demoUrl: "/slots/hyperdrive.html",
        },
        {
          id: "demo-crash",
          name: "Crash",
          provider: "Arcade",
          category: "Fast",
          image: "/slots/game-crash.svg",
          demoUrl: "/games/arcade.html?game=crash",
        },
        {
          id: "demo-dice",
          name: "Dice",
          provider: "Arcade",
          category: "Table",
          image: "/slots/game-dice.svg",
          demoUrl: "/games/arcade.html?game=dice",
        },
        {
          id: "demo-plinko",
          name: "Plinko",
          provider: "Arcade",
          category: "Classic",
          image: "/slots/game-plinko.svg",
          demoUrl: "/games/arcade.html?game=plinko",
        },
        {
          id: "demo-tower",
          name: "Tower",
          provider: "Arcade",
          category: "Adventure",
          image: "/slots/game-tower.svg",
          demoUrl: "/games/arcade.html?game=tower",
        },
        {
          id: "demo-mines",
          name: "Mines",
          provider: "Arcade",
          category: "Strategy",
          image: "/slots/game-mines.svg",
          demoUrl: "/games/arcade.html?game=mines",
        },
        {
          id: "demo-coinflip",
          name: "Coinflip",
          provider: "Arcade",
          category: "Chance",
          image: "/slots/game-coinflip.svg",
          demoUrl: "/games/arcade.html?game=coinflip",
        },
        {
          id: "demo-jackpot",
          name: "Jackpot",
          provider: "Arcade",
          category: "Bonus",
          image: "/slots/game-jackpot.svg",
          demoUrl: "/games/arcade.html?game=jackpot",
        },
        {
          id: "demo-roulette",
          name: "Roulette",
          provider: "Arcade",
          category: "Table",
          image: "/slots/game-roulette.svg",
          demoUrl: "/games/arcade.html?game=roulette",
        },
        {
          id: "demo-wheel",
          name: "Wheel",
          provider: "Arcade",
          category: "Wheel",
          image: "/slots/game-wheel.svg",
          demoUrl: "/slots/wheel.html",
        },
        {
          id: "demo-slots",
          name: "Slots",
          provider: "Arcade",
          category: "Slots",
          image: "/slots/game-slots.svg",
          demoUrl: "/slots/midas.html",
        },
        {
          id: "demo-aztec",
          name: "Aztec Gold",
          provider: "DemoPlay",
          category: "Adventure",
          image: "/img/games/AncientRichesCasinoRedHotFirepotGM.jpg",
        },
        {
          id: "demo-joker",
          name: "Joker Reels",
          provider: "SpinHub",
          category: "Classic",
          image: "/img/games/FruitShopChristmasNET.jpg",
        },
        {
          id: "demo-dragon",
          name: "Dragon Fire",
          provider: "SkySlots",
          category: "Adventure",
          image: "/img/games/GrandSpinnSuperpotNET.jpg",
        },
        {
          id: "demo-fruits",
          name: "Fruits Deluxe",
          provider: "RetroBet",
          category: "Classic",
          image: "/img/games/FruitShopNET.jpg",
        },
        {
          id: "demo-starlight",
          name: "Starlight Rush",
          provider: "NovaPlay",
          category: "Fantasy",
          image: "/img/games/GoBananasNET.jpg",
        },
        {
          id: "demo-vikings",
          name: "Vikings Wild",
          provider: "NorthSpin",
          category: "Adventure",
          image: "/img/games/GreatRhinoPM.jpg",
        },
      ];
    },
  },
};
</script>
