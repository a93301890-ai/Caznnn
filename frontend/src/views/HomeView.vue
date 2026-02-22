<template>
  <section
    class="banner-strip banner-strip--hero"
    ref="bannerStrip"
    @mouseenter="pauseAuto"
    @mouseleave="resumeAuto"
  >
    <button class="banner-nav banner-nav--left" type="button" @click="scrollBanner(-1)">
      ‹
    </button>
    <button class="banner-nav banner-nav--right" type="button" @click="scrollBanner(1)">
      ›
    </button>
    <a
      v-for="(banner, index) in banners"
      :key="banner.src"
      href="/sport/line"
      class="banner-card banner-card--hero"
      :data-index="index"
    >
      <img :src="banner.src" :alt="banner.alt" />
    </a>
  </section>
  <div class="banner-dots">
    <button
      v-for="(banner, index) in banners"
      :key="banner.src + '-dot'"
      class="banner-dot"
      :class="{ active: index === activeIndex }"
      type="button"
      @click="scrollToIndex(index)"
    ></button>
  </div>

  <section class="hero">
    <div>
      <h1>Ставки нового уровня</h1>
      <p>
        Прематч и лайв, быстрые выплаты, актуальные коэффициенты и топовые слоты.
      </p>
      <div class="topbar-actions" style="margin-top: 16px">
        <RouterLink to="/sport/line" class="btn">Открыть линию</RouterLink>
        <RouterLink to="/casino" class="btn secondary">Перейти в казино</RouterLink>
      </div>
    </div>
    <div class="card">
      <h2>Сегодня в центре</h2>
      <div class="grid-2">
        <div class="stat">
          <span>Матчей в лайве</span>
          <strong>120+</strong>
        </div>
        <div class="stat">
          <span>Слотов в каталоге</span>
          <strong>800+</strong>
        </div>
        <div class="stat">
          <span>Средняя скорость выплаты</span>
          <strong>30 мин</strong>
        </div>
        <div class="stat">
          <span>Поддержка</span>
          <strong>24/7</strong>
        </div>
      </div>
    </div>
  </section>

  <section class="menu-grid">
    <a class="menu-tile" href="/sport/line">
      <img src="/img/category/category_1675197882_3958.svg" alt="" />
      <span>Футбол</span>
    </a>
    <a class="menu-tile" href="/sport/line">
      <img src="/img/category/category_1675197893_5608.svg" alt="" />
      <span>Хоккей</span>
    </a>
    <a class="menu-tile" href="/sport/line">
      <img src="/img/category/category_1675197948_4033.svg" alt="" />
      <span>Теннис</span>
    </a>
    <a class="menu-tile" href="/sport/line">
      <img src="/img/category/category_1675197976_9671.svg" alt="" />
      <span>Баскетбол</span>
    </a>
    <a class="menu-tile" href="/sport/live">
      <img src="/img/live.svg" alt="" />
      <span>Live</span>
    </a>
    <a class="menu-tile" href="/casino">
      <img src="/slots/game-wheel.svg" alt="" />
      <span>Казино</span>
    </a>
  </section>

  <section class="grid-2">
    <div class="card">
      <h2>Линия и live</h2>
      <p class="notice">Быстрый купон, маркеты и обновления коэффициентов.</p>
      <div class="topbar-actions" style="margin-top: 12px">
        <RouterLink class="btn secondary" to="/sport/line">Линия</RouterLink>
        <RouterLink class="btn secondary" to="/sport/live">Live</RouterLink>
      </div>
    </div>
    <div class="card">
      <h2>Казино</h2>
      <p class="notice">Слоты, провайдеры и быстрые спины.</p>
      <RouterLink class="btn secondary" to="/casino">Открыть казино</RouterLink>
    </div>
  </section>
</template>

<script>
export default {
  data() {
    return {
      banners: [
        { src: "/img/banners/banner_1713400023_8084.jpg", alt: "Promo 1" },
        { src: "/img/banners/banner_1713400040_3165.jpg", alt: "Promo 2" },
        { src: "/img/banners/banner_1713399965_5290.jpg", alt: "Promo 3" },
        { src: "/img/banners/banner_1713399979_5810.jpg", alt: "Promo 4" },
        { src: "/img/banners/banner_1713400008_5280.jpg", alt: "Promo 5" },
        { src: "/img/banners/banner_1713399907_8386.jpg", alt: "Promo 6" },
        { src: "/img/banners/banner_1713399915_2009.jpg", alt: "Promo 7" },
        { src: "/img/banners/banner_1713399924_7227.jpg", alt: "Promo 8" },
        { src: "/img/banners/banner_1713399932_1554.jpg", alt: "Promo 9" },
        { src: "/img/banners/banner_1713399937_5833.jpg", alt: "Promo 10" },
      ],
      bannerTimer: null,
      isPaused: false,
      activeIndex: 0,
      scrollHandler: null,
    };
  },
  mounted() {
    this.startAutoScroll();
    this.bindScroll();
  },
  beforeUnmount() {
    if (this.bannerTimer) {
      clearInterval(this.bannerTimer);
    }
    this.unbindScroll();
  },
  methods: {
    getBannerStep() {
      const el = this.$refs.bannerStrip;
      if (!el) return 0;
      const card = el.querySelector(".banner-card");
      if (!card) return el.clientWidth;
      const gapValue =
        Number.parseFloat(getComputedStyle(el).columnGap || getComputedStyle(el).gap) || 0;
      return card.offsetWidth + gapValue;
    },
    startAutoScroll() {
      const el = this.$refs.bannerStrip;
      if (!el) return;
      this.bannerTimer = setInterval(() => {
        if (this.isPaused) return;
        const nextIndex = (this.activeIndex + 1) % this.banners.length;
        this.scrollToIndex(nextIndex);
      }, 3200);
    },
    pauseAuto() {
      this.isPaused = true;
    },
    resumeAuto() {
      this.isPaused = false;
    },
    scrollBanner(direction) {
      const nextIndex = Math.max(
        0,
        Math.min(this.banners.length - 1, this.activeIndex + direction),
      );
      this.scrollToIndex(nextIndex);
    },
    scrollToIndex(index) {
      const el = this.$refs.bannerStrip;
      const step = this.getBannerStep();
      if (!el || !step) return;
      el.scrollTo({ left: step * index, behavior: "smooth" });
      this.activeIndex = index;
    },
    bindScroll() {
      const el = this.$refs.bannerStrip;
      if (!el) return;
      this.scrollHandler = () => {
        const step = this.getBannerStep();
        if (!step) return;
        const index = Math.round(el.scrollLeft / step);
        this.activeIndex = Math.max(0, Math.min(this.banners.length - 1, index));
      };
      el.addEventListener("scroll", this.scrollHandler, { passive: true });
    },
    unbindScroll() {
      const el = this.$refs.bannerStrip;
      if (el && this.scrollHandler) {
        el.removeEventListener("scroll", this.scrollHandler);
      }
    },
  },
};
</script>
