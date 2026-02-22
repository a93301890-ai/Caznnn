<template>
  <div>
    <div v-html="top"></div>
    <slot />
    <div v-html="bottom"></div>
  </div>
</template>

<script>
import top from "./layout-top.html?raw";
import bottom from "./layout-bottom.html?raw";

export default {
  data() {
    return {
      top,
      bottom,
    };
  },
  mounted() {
    this.initLayout();
  },
  watch: {
    $route() {
      this.initLayout();
    },
  },
  methods: {
    initLayout() {
      this.$nextTick(() => {
        if (typeof window.renderAuthUI === "function") {
          window.renderAuthUI();
        }
        if (typeof window.ensureDemoModals === "function") {
          window.ensureDemoModals();
        }
        if (typeof window.initAutoScroll === "function") {
          window.initAutoScroll();
        }
        if (typeof window.initSportFront === "function") {
          window.initSportFront();
        }
      });
    },
  },
};
</script>
