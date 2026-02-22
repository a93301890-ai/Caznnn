import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import CasinoView from "../views/CasinoView.vue";
import ResultView from "../views/ResultView.vue";
import KycView from "../views/KycView.vue";
import RulesSportView from "../views/RulesSportView.vue";
import ReturnPolicyView from "../views/ReturnPolicyView.vue";
import RiskNotificationView from "../views/RiskNotificationView.vue";
import TermsView from "../views/TermsView.vue";
import PrivacyPolicyView from "../views/PrivacyPolicyView.vue";
import SupportView from "../views/SupportView.vue";
import SportLineView from "../views/SportLineView.vue";
import SportLiveView from "../views/SportLiveView.vue";
import SportCheckbetView from "../views/SportCheckbetView.vue";
import SportHistoryView from "../views/SportHistoryView.vue";
import AccountView from "../views/AccountView.vue";
import AdminView from "../views/AdminView.vue";
import NotFoundView from "../views/NotFoundView.vue";

const routes = [
  { path: "/", component: HomeView, meta: { title: "Букмекерская компания" } },
  { path: "/casino", component: CasinoView, meta: { title: "Казино" } },
  {
    path: "/result",
    component: ResultView,
    meta: { title: "Спортивные результаты" },
  },
  { path: "/kyc", component: KycView, meta: { title: "KYC & AML" } },
  { path: "/support", component: SupportView, meta: { title: "Поддержка" } },
  {
    path: "/rules-sport",
    component: RulesSportView,
    meta: { title: "Правила по отдельным видам спорта" },
  },
  {
    path: "/return-policy",
    component: ReturnPolicyView,
    meta: { title: "Условия возврата" },
  },
  {
    path: "/risk-notification",
    component: RiskNotificationView,
    meta: { title: "Уведомление о рисках" },
  },
  {
    path: "/terms",
    component: TermsView,
    meta: { title: "Правила и условия" },
  },
  {
    path: "/privacy-policy",
    component: PrivacyPolicyView,
    meta: { title: "Политика конфиденциальности" },
  },
  { path: "/sport", redirect: "/sport/line" },
  { path: "/sport/line", component: SportLineView, meta: { title: "Спорт" } },
  {
    path: "/sport/live",
    component: SportLiveView,
    meta: { title: "Лайв спорт" },
  },
  {
    path: "/sport/checkbet",
    component: SportCheckbetView,
    meta: { title: "Проверка ставки" },
  },
  {
    path: "/sport/history",
    component: SportHistoryView,
    meta: { title: "Мои ставки" },
  },
  {
    path: "/account",
    component: AccountView,
    meta: { title: "Личный кабинет" },
  },
  {
    path: "/admin",
    component: AdminView,
    meta: { title: "Админ‑панель" },
  },
  {
    path: "/:pathMatch(.*)*",
    component: NotFoundView,
    meta: { title: "Страница не найдена" },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

router.afterEach((to) => {
  if (to.meta && to.meta.title) {
    document.title = to.meta.title;
  }
});

export default router;
