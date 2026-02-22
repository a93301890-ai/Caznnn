function getCookie(name) {
  let matches = document.cookie.match(
    new RegExp(
      "(?:^|; )" +
        name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, "\\$1") +
        "=([^;]*)",
    ),
  );
  return matches ? decodeURIComponent(matches[1]) : undefined;
}

function isDemoEnv() {
  return (
    typeof api === "string" &&
    api.indexOf("crystalbet.pro") !== -1 &&
    window.location.hostname.indexOf("crystalbet.pro") === -1
  );
}

function getDemoUser() {
  try {
    return JSON.parse(localStorage.getItem("demo_user")) || null;
  } catch (e) {
    return null;
  }
}

function setDemoUser(user) {
  localStorage.setItem("demo_user", JSON.stringify(user));
}

function clearDemoUser() {
  localStorage.removeItem("demo_user");
}

function getAuthState() {
  if (isDemoEnv()) {
    let user = getDemoUser();
    return { isAuth: !!user, user: user };
  }
  let token = $.cookie("token");
  return { isAuth: !!token, user: null };
}

function formatDemoUser(data) {
  let name =
    data && data.name
      ? data.name
      : data && data.email
        ? data.email.split("@")[0]
        : "Игрок";
  let cleaned = name.trim() || "Игрок";
  return {
    name: cleaned,
    email: data && data.email ? data.email : "",
    balance: data && data.balance ? data.balance : "1250.00",
    symbol: data && data.symbol ? data.symbol : "₽",
    bonus: data && data.bonus ? data.bonus : "0.00",
  };
}

function updateBalanceUI(data) {
  if (!data) {
    return;
  }
  if ($(".upd_balance").length) {
    $(".upd_balance").text(data.balance);
    $(".upd_symbol").text(data.symbol);
    $(".menu_balance").css("display", "block");
  }
  let bonusValue = parseFloat(data.bonus || 0);
  if ($(".upd_bonus").length) {
    $(".upd_bonus").text(data.bonus || "0.00");
    $(".upd_symbol").text(data.symbol);
    if (bonusValue > 0) {
      $(".menu_bonus").css("display", "block");
    } else {
      $(".menu_bonus").css("display", "none");
    }
  }
}

function setAdminUI(isAdmin) {
  const adminItems = document.querySelectorAll(".for_admin");
  adminItems.forEach((el) => {
    el.style.display = isAdmin ? "" : "none";
  });
}

function getCachedRole() {
  try {
    return localStorage.getItem("user_role") || "";
  } catch (e) {
    return "";
  }
}

function setCachedRole(role) {
  try {
    if (role) {
      localStorage.setItem("user_role", role);
    } else {
      localStorage.removeItem("user_role");
    }
  } catch (e) {
    // ignore storage errors
  }
}

async function fetchProfileRole() {
  if (isDemoEnv()) {
    return null;
  }
  const token = $.cookie("token");
  if (!token) {
    return null;
  }
  try {
    const response = await fetch(api + "/user/profile", {
      headers: { Authorization: "Bearer " + token },
    });
    if (!response.ok) return null;
    const data = await response.json();
    const role = data && data.role ? data.role : null;
    if (role) {
      setCachedRole(role);
    }
    return role;
  } catch (e) {
    return null;
  }
}

function updateDemoUserBalance(delta) {
  let state = getAuthState();
  if (!state.isAuth || !state.user) {
    return;
  }
  let current = parseFloat(state.user.balance || 0);
  let next = (current + delta).toFixed(2);
  state.user.balance = next;
  setDemoUser(state.user);
  updateBalanceUI({
    balance: state.user.balance,
    symbol: state.user.symbol || "₽",
    bonus: state.user.bonus || "0.00",
  });
}

function buildUserMenuLinks() {
  return `
        <div class="user_menu_links">
            <a href="#demo_deposit" class="modal_link demo_menu_item">Пополнить баланс</a>
            <a href="#demo_withdraw" class="modal_link demo_menu_item">Вывод средств</a>
            <a href="#demo_refer" class="modal_link demo_menu_item">Привод друга</a>
            <a href="#demo_voucher" class="modal_link demo_menu_item">Ваучер</a>
            <a href="#demo_bets" class="modal_link demo_menu_item">Мои ставки</a>
            <a href="#demo_history" class="modal_link demo_menu_item">Финансовая история</a>
            <a href="#demo_settings" class="modal_link demo_menu_item">Настройки</a>
            <a href="#demo_verification" class="modal_link demo_menu_item">Верификация</a>
            <a href="#" class="demo_logout">Выйти</a>
        </div>
    `;
}

function ensureUserPanels(user) {
  let name = user && user.name ? user.name : "Игрок";
  let initial = name.trim() ? name.trim().charAt(0).toUpperCase() : "U";
  let balance = user && user.balance ? user.balance : "0.00";
  let symbol = user && user.symbol ? user.symbol : "₽";
  let menu = `
        <div class="user_panel">
            <button class="user_btn" type="button">
                <span class="user_avatar">${initial}</span>
                <span class="user_info">
                    <span class="user_name">${name}</span>
                    <span class="user_balance"><span class="upd_balance">${balance}</span> <span class="upd_symbol">${symbol}</span></span>
                </span>
                <span class="user_chev"></span>
            </button>
            <div class="user_menu">
                <div class="user_menu_head">
                    <div>Balance</div>
                    <div><span class="upd_balance">${balance}</span> <span class="upd_symbol">${symbol}</span></div>
                </div>
                ${buildUserMenuLinks()}
            </div>
        </div>
    `;
  if ($(".menu.desktop").length && !$(".menu.desktop .user_panel").length) {
    let $menu = $(".menu.desktop");
    let $space = $menu.find(".space").last();
    if ($space.length) {
      $space.after(menu);
    } else {
      $menu.append(menu);
    }
  }
  if ($(".mobile_menu_btns").length) {
    let $mobile = $(".mobile_menu_btns");
    if (!$mobile.data("authBase")) {
      $mobile.data("authBase", $mobile.html());
    }
    if (!$mobile.find(".user_panel").length) {
      $mobile.append(`<div class="mobile_user_panel">${menu}</div>`);
    }
  }
  if ($(".side_menu_btns").length) {
    let $side = $(".side_menu_btns");
    if (!$side.data("authBase")) {
      $side.data("authBase", $side.html());
    }
    if (!$side.find(".user_panel").length) {
      $side.append(`<div class="side_user_panel">${menu}</div>`);
    }
  }
  if (
    $(".side_menu_links").length &&
    !$(".side_menu_links .demo_user_links").length
  ) {
    $(".side_menu_links").prepend(
      `<div class="demo_user_links side_user_links">${buildUserMenuLinks()}</div><div class="middle_seporator"></div>`,
    );
  }
}

function renderAuthUI() {
  let state = getAuthState();
  if (state.isAuth) {
    $(".menu_btn_auth, .menu_btn_reg").addClass("is-hidden");
    ensureUserPanels(state.user);
    updateBalanceUI({
      balance: state.user && state.user.balance ? state.user.balance : "0.00",
      symbol: state.user && state.user.symbol ? state.user.symbol : "₽",
      bonus: state.user && state.user.bonus ? state.user.bonus : "0.00",
    });
    const cachedRole = getCachedRole();
    setAdminUI(cachedRole === "ADMIN");
    fetchProfileRole().then((role) => {
      setAdminUI(role === "ADMIN");
    });
  } else {
    $(".menu_btn_auth, .menu_btn_reg").removeClass("is-hidden");
    $(".user_panel").remove();
    $(".demo_user_links").remove();
    setAdminUI(false);
    setCachedRole("");
    let $mobile = $(".mobile_menu_btns");
    if ($mobile.data("authBase")) {
      $mobile.html($mobile.data("authBase"));
    }
    let $side = $(".side_menu_btns");
    if ($side.data("authBase")) {
      $side.html($side.data("authBase"));
    }
  }
}

function ensureDemoModals() {
  if ($("#demo_deposit").length) {
    return;
  }
  $("body").append(`
        <div id="demo_deposit" class="modal">
            <div class="modal_head">
                <div>Пополнение баланса</div>
                <a href="#" rel="modal:close"></a>
            </div>
            <div class="modal_content">
                <form class="demo_form">
                    <input type="number" name="amount" placeholder="Введите сумму" required>
                    <select name="method" required>
                        <option value="">Выберите платежную систему</option>
                        <option value="card">Карта</option>
                        <option value="wallet">Кошелек</option>
                        <option value="crypto">Крипто</option>
                    </select>
                    <input type="text" name="wallet" placeholder="Кошелек / Карта" required>
                    <div class="notifications"></div>
                    <button type="submit">Пополнить</button>
                </form>
            </div>
        </div>
        <div id="demo_withdraw" class="modal">
            <div class="modal_head">
                <div>Вывод средств</div>
                <a href="#" rel="modal:close"></a>
            </div>
            <div class="modal_content">
                <form class="demo_form">
                    <input type="number" name="amount" placeholder="Введите сумму" required>
                    <select name="method" required>
                        <option value="">Выберите платежную систему</option>
                        <option value="card">Карта</option>
                        <option value="wallet">Кошелек</option>
                        <option value="crypto">Крипто</option>
                    </select>
                    <input type="text" name="wallet" placeholder="Кошелек / Карта" required>
                    <div class="notifications"></div>
                    <button type="submit">Выполнить</button>
                    <div class="modal_hint"><a href="#demo_history" class="modal_link">Посмотреть историю</a></div>
                </form>
            </div>
        </div>
        <div id="demo_refer" class="modal">
            <div class="modal_head">
                <div>Привод друга</div>
                <a href="#" rel="modal:close"></a>
            </div>
            <div class="modal_content">
                <div class="demo_box">
                    <div class="demo_label">Ваша ссылка</div>
                    <div class="demo_row">
                        <input type="text" value="https://crystalbet.pro/ref/demo" readonly>
                        <button type="button" class="demo_copy">Копировать</button>
                    </div>
                </div>
                <div class="notifications"></div>
            </div>
        </div>
        <div id="demo_voucher" class="modal">
            <div class="modal_head">
                <div>Ваучер</div>
                <a href="#" rel="modal:close"></a>
            </div>
            <div class="modal_content">
                <form class="demo_form">
                    <input type="text" name="voucher" placeholder="Введите код ваучера" required>
                    <div class="notifications"></div>
                    <button type="submit">Активировать</button>
                </form>
            </div>
        </div>
        <div id="demo_bets" class="modal">
            <div class="modal_head">
                <div>Мои ставки</div>
                <a href="#" rel="modal:close"></a>
            </div>
            <div class="modal_content">
                <div class="demo_list">
                    <div>Активных ставок нет</div>
                </div>
            </div>
        </div>
        <div id="demo_history" class="modal">
            <div class="modal_head">
                <div>Финансовая история</div>
                <a href="#" rel="modal:close"></a>
            </div>
            <div class="modal_content">
                <div class="demo_list">
                    <div>История операций пуста</div>
                </div>
            </div>
        </div>
        <div id="demo_settings" class="modal">
            <div class="modal_head">
                <div>Настройки</div>
                <a href="#" rel="modal:close"></a>
            </div>
            <div class="modal_content">
                <form class="demo_form">
                    <input type="email" name="email" placeholder="Email">
                    <input type="password" name="new_pass" placeholder="Новый пароль">
                    <div class="notifications"></div>
                    <button type="submit">Сохранить</button>
                </form>
            </div>
        </div>
        <div id="demo_verification" class="modal">
            <div class="modal_head">
                <div>Верификация</div>
                <a href="#" rel="modal:close"></a>
            </div>
            <div class="modal_content">
                <form class="demo_form">
                    <input type="file" name="docs" required>
                    <div class="notifications"></div>
                    <button type="submit">Отправить</button>
                </form>
            </div>
        </div>
    `);
}

function ensureAppBlock() {
  let block = `
        <div class="app_block">
            <div class="app_block_title">Скачайте приложение</div>
            <div class="app_cards">
                <a class="app_item" href="#" target="_blank">
                    <span class="app_icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.8-3.08.35c-1.09-.46-2.09-.48-3.24 0c-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8c1.18-.24 2.31-.93 3.57-.84c1.51.12 2.65.72 3.4 1.8c-3.12 1.87-2.38 5.98.48 7.13c-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25c.29 2.58-2.34 4.5-3.74 4.25"/></svg></span>
                    <span>
                        <div>Приложение</div>
                        <small>для iOS</small>
                    </span>
                </a>
                <a class="app_item" href="#" target="_blank">
                    <span class="app_icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M6.382 3.968A8.96 8.96 0 0 1 12 2c2.125 0 4.078.736 5.618 1.968l1.453-1.453l1.414 1.414l-1.453 1.453A8.96 8.96 0 0 1 21 11v1H3v-1c0-2.125.736-4.078 1.968-5.618L3.515 3.93l1.414-1.414zM3 14h18v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zm6-5a1 1 0 1 0 0-2a1 1 0 0 0 0 2m6 0a1 1 0 1 0 0-2a1 1 0 0 0 0 2"/></svg></span>
                    <span>
                        <div>Приложение</div>
                        <small>для Android</small>
                    </span>
                </a>
                <a class="app_item" href="#" target="_blank">
                    <span class="app_icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M2.75 7.189V2.865c0-.102 0-.115.115-.115h8.622c.128 0 .14 0 .14.128V11.5c0 .128 0 .128-.14.128H2.865c-.102 0-.115 0-.115-.116zM7.189 21.25H2.865c-.102 0-.115 0-.115-.116V12.59c0-.128 0-.128.128-.128h8.635c.102 0 .115 0 .115.115v8.57c0 .09 0 .103-.116.103zM21.25 7.189v4.31c0 .116 0 .116-.116.116h-8.557c-.102 0-.128 0-.128-.115V2.865c0-.09 0-.102.115-.102h8.48c.206 0 .206 0 .206.205zm-8.763 9.661v-4.273c0-.09 0-.115.103-.09h8.621c.026 0 0 .09 0 .142v8.518a.06.06 0 0 1-.017.06a.06.06 0 0 1-.06.017H12.54s-.09 0-.077-.09V16.85z"/></svg></span>
                    <span>
                        <div>Приложение</div>
                        <small>для Windows</small>
                    </span>
                </a>
            </div>
        </div>
    `;
  $(".footer").each(function () {
    let $footer = $(this);
    let $wrap = $footer.find(".wrap_content").first();
    if ($wrap.length === 0) {
      if ($footer.find(".app_block").length === 0) {
        $footer.prepend(block);
      }
      return;
    }
    if ($wrap.find(".app_block").length) {
      return;
    }
    let $sep = $wrap.find(".middle_seporator").first();
    if ($sep.length) {
      $sep.after(block);
    } else {
      $wrap.prepend(block);
    }
  });
}

function initAutoScroll() {
  $("[data-auto-scroll]").each(function () {
    if (this.dataset.autoScrollReady) {
      return;
    }
    this.dataset.autoScrollReady = "1";
    let el = this;
    let dir = 1;
    let speed = 0.4;
    let step = function () {
      if (el.scrollWidth <= el.clientWidth) {
        requestAnimationFrame(step);
        return;
      }
      el.scrollLeft += speed * dir;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 2) {
        dir = -1;
      }
      if (el.scrollLeft <= 2) {
        dir = 1;
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

function exit() {
  $.cookie("token", "", { expires: 0, path: "/" });
  clearDemoUser();
  if (isDemoEnv()) {
    renderAuthUI();
    return false;
  }
  window.location.href = "/";
  return false;
}

function copy(data) {
  navigator.clipboard.writeText(data);
  return true;
}

function get_balance() {
  if (isDemoEnv()) {
    let state = getAuthState();
    if (state.isAuth) {
      updateBalanceUI({
        balance: state.user.balance || "0.00",
        symbol: state.user.symbol || "₽",
        bonus: state.user.bonus || "0.00",
      });
    } else {
      $(".menu_balance").css("display", "none");
      $(".menu_bonus").css("display", "none");
    }
    return;
  }

  let token = $.cookie("token");

  if (token) {
    $.ajax({
      type: "POST",
      url: api + "/user/get_balance",
      data: "token=" + token + "&lang=" + lang,
      success: function (result) {
        if (result["data"] && result["data"] !== false) {
          if ($(".upd_balance").length) {
            $(".upd_balance").text(result["data"]["balance"]);
            $(".upd_symbol").text(result["data"]["curr_symbol"]);
            $(".menu_balance").css("display", "block");
          }

          if (result["data"]["bonus"] > 0) {
            $(".upd_bonus").text(result["data"]["bonus"]);
            $(".upd_symbol").text(result["data"]["curr_symbol"]);
            $(".menu_bonus").css("display", "block");
          } else {
            $(".menu_bonus").css("display", "none");
          }
        }
      },
    });
  }
}

function change_reg_promo() {
  if ($("input[name='have_promo']").prop("checked")) {
    $("input[name='promo']").fadeIn();
  } else {
    $("input[name='promo']").fadeOut();
  }
}

// User Time Zone
var timezone_offset_minutes = new Date().getTimezoneOffset();
timezone_offset_minutes =
  timezone_offset_minutes == 0 ? 0 : -timezone_offset_minutes;

if (
  getCookie("timezone") == undefined ||
  getCookie("timezone") != timezone_offset_minutes
) {
  document.cookie =
    "timezone=" + timezone_offset_minutes + "; path=/; max-age=31536000";
}

// Page Loader
(function () {
  function hideLoader() {
    var loader = document.querySelector(".pageloader");
    if (!loader) {
      return false;
    }
    loader.style.opacity = "0";
    loader.style.pointerEvents = "none";
    setTimeout(function () {
      if (loader && loader.parentNode) {
        loader.parentNode.removeChild(loader);
      }
    }, 200);
    return true;
  }

  var hardTimeout = setTimeout(hideLoader, 1500);

  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    hideLoader();
  } else {
    document.addEventListener("DOMContentLoaded", hideLoader, { once: true });
  }

  window.addEventListener(
    "load",
    function () {
      clearTimeout(hardTimeout);
      hideLoader();
    },
    { once: true },
  );
})();

if (window.location.hash && window.location.hash == "#reg") {
  setTimeout(function () {
    $("#reg").modal({
      fadeDuration: 100,
      clickClose: false,
    });
  }, 300);
}

if (window.location.hash && window.location.hash == "#auth") {
  setTimeout(function () {
    $("#auth").modal({
      fadeDuration: 100,
      clickClose: false,
    });
  }, 300);
}

function upd_count_coupon(count) {
  if (count < 1) {
    $(".foot_menu_cupon div").hide(250);
  } else {
    $(".foot_menu_cupon div").show(250);
  }
  $(".foot_menu_cupon div").html(count);
}

$(document).ready(function () {
  get_balance();

  setInterval(() => {
    get_balance();
  }, 10000);

  renderAuthUI();
  setAdminUI(false);
  ensureDemoModals();
  initAutoScroll();

  $(document).on("click", ".user_btn", function (e) {
    e.preventDefault();
    let $panel = $(this).closest(".user_panel");
    $(".user_panel").not($panel).removeClass("open");
    $panel.toggleClass("open");
  });

  $(document).on("click", function (e) {
    if (!$(e.target).closest(".user_panel").length) {
      $(".user_panel").removeClass("open");
    }
  });

  $(document).on("click", ".demo_logout", function (e) {
    e.preventDefault();
    exit();
    safeCloseModal();
  });

  $(document).on("submit", ".demo_form", function (e) {
    e.preventDefault();
    let $form = $(this);
    notifications({
      text: "Готово",
      type: "success",
      runtime: 1.2,
      selector: $form.find(".notifications"),
    });
    if (isDemoEnv()) {
      let amount = parseFloat($form.find('input[name=\"amount\"]').val() || 0);
      if ($form.closest("#demo_deposit").length && amount > 0) {
        updateDemoUserBalance(amount);
      }
      if ($form.closest("#demo_withdraw").length && amount > 0) {
        updateDemoUserBalance(-amount);
      }
    }
    setTimeout(function () {
      safeCloseModal();
    }, 300);
  });

  $(document).on("click", ".demo_copy", function () {
    let value = $(this).closest(".demo_row").find("input").val();
    copy(value);
    notifications({
      text: "Ссылка скопирована",
      type: "success",
      runtime: 1.2,
      selector: ".modal .notifications",
    });
  });

  function openModalBySelector(selector) {
    const $target = $(selector);
    if (!$target.length) return;
    if (typeof $target.modal === "function") {
      $target.modal({
        fadeDuration: 100,
        clickClose: false,
        showClose: false,
      });
      return;
    }
    const el = $target.get(0);
    el.style.display = "block";
    el.style.opacity = "1";
    el.style.visibility = "visible";
    el.classList.add("is-open");
    document.body.classList.add("modal-open");
  }

  function safeCloseModal() {
    if ($.modal && typeof $.modal.close === "function") {
      $.modal.close();
      return;
    }
    $(".modal.is-open")
      .removeClass("is-open")
      .css({ display: "none", opacity: "", visibility: "" });
    document.body.classList.remove("modal-open");
  }

  // Open modal
  $(document).on("click", ".modal_link", function (e) {
    e.preventDefault();
    const modal = $(this).attr("href");
    openModalBySelector(modal);
  });

  $(document).on("click", 'a[rel="modal:close"]', function (e) {
    e.preventDefault();
    safeCloseModal();
  });

  // Dinamic open line in SportsBook
  $(document).on("click", ".core_sport_line", function (e) {
    e.preventDefault();
    if (typeof $core === "object") {
      $core.openMenu("line");
    } else {
      window.location.href = "/sport/#open_line";
    }
  });

  if (
    window.location.hash &&
    window.location.hash == "#open_line" &&
    window.screen.availWidth <= 1000
  ) {
    if (typeof $core === "object") {
      $core.on("init:finished", () => {
        $core.openMenu("line");
        window.location.hash = "";
      });
    }
  }

  // Dinamic open live in SportsBook
  $(document).on("click", ".core_sport_live", function (e) {
    e.preventDefault();
    if (typeof $core === "object") {
      $core.openMenu("live");
    } else {
      window.location.href = "/sport/#open_live";
    }
  });

  if (
    window.location.hash &&
    window.location.hash == "#open_live" &&
    window.screen.availWidth <= 1000
  ) {
    if (typeof $core === "object") {
      $core.on("init:finished", () => {
        $core.openMenu("live");
        window.location.hash = "";
      });
    }
  }

  // Dinamic open cupon in SportsBook
  $(document).on("click", ".core_cupon", function (e) {
    e.preventDefault();
    if (typeof $core === "object") {
      $core.openCoupon();
    } else {
      window.location.href = "/sport/#open_coupon";
    }
  });

  if (
    window.location.hash &&
    window.location.hash == "#open_coupon" &&
    window.screen.availWidth <= 1000
  ) {
    if (typeof $core === "object") {
      $core.on("init:finished", () => {
        $core.openCoupon();
        window.location.hash = "";
      });
    }
  }

  // Open modal auth if click another buttom
  $(document).on("click", ".for_auth", function (e) {
    e.preventDefault();
    if (!getAuthState().isAuth) {
      openModalBySelector("#auth");
    } else {
      window.location.href = $(this).attr("href");
    }
  });

  // Ajax Auth
  $("#auth_form").submit(function (event) {
    event.preventDefault();
    el = "#" + event.target.getAttribute("id");
    $(el + " button").attr("disabled", true);
    if (isDemoEnv()) {
      let email = $(el + ' input[name="email"]').val();
      let user = formatDemoUser({ email: email });
      setDemoUser(user);
      $.cookie("token", "demo", { expires: 365, path: "/" });
      renderAuthUI();
      notifications({
        text: "Вход выполнен",
        type: "success",
        runtime: 1.5,
        selector: el + " .notifications",
      });
      setTimeout(function () {
        safeCloseModal();
      }, 300);
      $(el + " button").attr("disabled", false);
      return;
    }

    $.ajax({
      type: "POST",
      url: api + "/user/auth",
      data: $("#auth_form").serialize() + "&source=" + source + "&lang=" + lang,
      success: function (result) {
        if (result["token"] && result["token"] != "") {
          $.cookie("token", result["token"], { expires: 365, path: "/" });
          location.reload();
        }

        if (result["error"] != "" && result["error"] != null) {
          notifications({
            text: result["error"],
            type: "error",
            runtime: 1.5,
            selector: el + " .notifications",
          });
        }
      },
      complete: () => {
        $(el + " button").attr("disabled", false);
      },
    });
  });

  // Ajax Forgot Password
  $("#forgot_form").submit(function (event) {
    event.preventDefault();
    el = "#" + event.target.getAttribute("id");
    $(el + " button").attr("disabled", true);

    if (isDemoEnv()) {
      notifications({
        text: "Инструкция отправлена на email",
        type: "success",
        runtime: 1.5,
        selector: el + " .notifications",
      });
      setTimeout(function () {
        safeCloseModal();
      }, 400);
      $(el + " button").attr("disabled", false);
      return;
    }

    $.ajax({
      type: "POST",
      url: api + "/user/forgot",
      data:
        $("#forgot_form").serialize() + "&source=" + source + "&lang=" + lang,
      success: function (result) {
        if (result["success"] != "" && result["success"] != null) {
          notifications({
            text: result["success"],
            type: "success",
            runtime: 1.5,
            selector: el + " .notifications",
          });
        }

        if (result["error"] != "" && result["error"] != null) {
          notifications({
            text: result["error"],
            type: "error",
            runtime: 1.5,
            selector: el + " .notifications",
          });
        }
      },
      complete: () => {
        $(el + " button").attr("disabled", false);
      },
    });
  });

  // Ajax Registration
  var iti = null;
  if ($("#phonelib").length && typeof window.intlTelInput === "function") {
    var input = document.querySelector("#phonelib");

    iti = window.intlTelInput(input, {
      dropdownContainer: document.body,
      formatOnDisplay: true,
      initialCountry: "US",
      nationalMode: false,
      preferredCountries: ["US", "DE", "PT", "KZ", "RU"],
    });

    $(input).keyup(function () {
      let value = input.value;
      let rep = /[\/\\\.;*":'a-zA-Zа-яА-Я]/;
      if (rep.test(value)) {
        value = value.replace(rep, "");
        input.value = value;
      }
      if (window.intlTelInputUtils && iti) {
        $("#full_number").val(
          iti.getNumber(intlTelInputUtils.numberFormat.INTERNATIONAL),
        );
      } else {
        $("#full_number").val(input.value);
      }
    });
  } else if ($("#phonelib").length) {
    $("#phonelib").on("input", function () {
      $("#full_number").val(this.value);
    });
  }

  $("#reg_form").submit(function (event) {
    event.preventDefault();
    el = "#" + event.target.getAttribute("id");
    $(el + " button").attr("disabled", true);

    let partner = $.cookie("partner") ? $.cookie("partner") : 0;
    if (isDemoEnv()) {
      let name = $(el + ' input[name="name"]').val();
      let email = $(el + ' input[name="email"]').val();
      let user = formatDemoUser({
        name: name,
        email: email,
        balance: "2500.00",
      });
      setDemoUser(user);
      $.cookie("token", "demo", { expires: 365, path: "/" });
      renderAuthUI();
      notifications({
        text: "Регистрация выполнена",
        type: "success",
        runtime: 1.5,
        selector: el + " .notifications",
      });
      setTimeout(function () {
        safeCloseModal();
      }, 300);
      $(el + " button").attr("disabled", false);
      return;
    }

    $.ajax({
      type: "POST",
      url: api + "/user/reg",
      data:
        $("#reg_form").serialize() +
        "&phone_valid=" +
        (iti ? iti.isValidNumber() : true) +
        "&partner=" +
        partner +
        "&source=" +
        source +
        "&lang=" +
        lang,
      success: function (result) {
        if (result["token"] && result["token"] != "") {
          $.cookie("token", result["token"], { expires: 365, path: "/" });
          location.reload();
        }

        if (result["error"] != "" && result["error"] != null) {
          notifications({
            text: result["error"],
            type: "error",
            runtime: 1.5,
            selector: el + " .notifications",
          });
        }
      },
      complete: () => {
        $(el + " button").attr("disabled", false);
      },
    });
  });

  // Ajax Account Settings
  $("#settings_form").submit(function (event) {
    event.preventDefault();
    el = "#" + event.target.getAttribute("id");
    $(el + " button").attr("disabled", true);
    let token = $.cookie("token");

    if (isDemoEnv()) {
      notifications({
        text: "Изменения сохранены",
        type: "success",
        runtime: 1.5,
        selector: el + " .notifications",
      });
      $(el + " button").attr("disabled", false);
      return;
    }

    $.ajax({
      type: "POST",
      url: api + "/user/set_info",
      data: $(el).serialize() + "&token=" + token + "&lang=" + lang,
      success: function (result) {
        //console.log(result);

        if (result["success"] != "" && result["success"] != null) {
          get_balance();
          $("input[name=old_pass]").val("");
          $("input[name=new_pass]").val("");
          notifications({
            text: result["success"],
            type: "success",
            runtime: 1.5,
            selector: el + " .notifications",
          });
        }

        if (result["error"] != "" && result["error"] != null) {
          notifications({
            text: result["error"],
            type: "error",
            runtime: 1.5,
            selector: el + " .notifications",
          });
        }
      },
      complete: () => {
        $(el + " button").attr("disabled", false);
      },
    });
  });

  // Upload Documents
  $(".file_area_documents").click(function (e) {
    $(".documents").click();
  });

  $(".documents").change(function (e) {
    let token = $.cookie("token");

    let formData = new FormData();
    formData.append("type", "doc");
    formData.append("token", token);
    formData.append("lang", lang);

    for (var i = 0; i < $(this)[0].files.length; i++) {
      formData.append("files[]", $(this)[0].files[i]);
    }

    if (isDemoEnv()) {
      notifications({
        text: "Документы отправлены",
        type: "success",
        runtime: 1.5,
        selector: "#verification .notifications",
      });
      $(".documents").val("");
      return;
    }

    $.ajax({
      type: "POST",
      url: cdn + "/upload",
      data: formData,
      enctype: "multipart/form-data",
      contentType: false,
      processData: false,
      beforeSend: function () {
        $("#verification .loader").show();
        $("#verification .file_area").hide();
      },
      success: function (result) {
        //console.log(result);

        if (result["success"] != "" && result["success"] != null) {
          for (let i = 0; i < result["success"].length; i++) {
            notifications({
              text: result["success"][i],
              type: "success",
              runtime: 1.5,
              selector: "#verification .notifications",
            });
          }
        }

        if (result["files"] != "" && result["files"] != null) {
          for (let i = 0; i < result["files"].length; i++) {
            $("#verification .files").append(
              `<div style="background-image: url(${cdn + result["files"][i]});"></div>`,
            );
          }
        }

        if (result["error_files"] != "" && result["error_files"] != null) {
          for (let i = 0; i < result["error_files"].length; i++) {
            notifications({
              text: result["error_files"][i],
              type: "error",
              runtime: 2.5,
              selector: "#verification .notifications",
            });
          }
        }

        if (result["error"] != "" && result["error"] != null) {
          notifications({
            text: result["error"],
            type: "error",
            runtime: 2.5,
            selector: "#verification .notifications",
          });
        }
      },
      complete: () => {
        $(".documents").val("");
        $("#verification .loader").hide();
        $("#verification .file_area").show();
      },
    });
  });

  // Upload Avatar
  $(".avatar").click(function (e) {
    $(".avatar_inp")[0].click();
  });

  $(".avatar_inp").change(function (e) {
    let token = $.cookie("token");

    let formData = new FormData();
    formData.append("type", "avatar");
    formData.append("token", token);
    formData.append("lang", lang);

    for (var i = 0; i < $(this)[0].files.length; i++) {
      formData.append("files[]", $(this)[0].files[i]);
    }

    if (isDemoEnv()) {
      notifications({
        text: "Аватар обновлен",
        type: "success",
        runtime: 1.5,
        selector: ".avatar_notifications",
      });
      $(".avatar_inp").val("");
      return;
    }

    $.ajax({
      type: "POST",
      url: cdn + "/upload",
      data: formData,
      enctype: "multipart/form-data",
      contentType: false,
      processData: false,
      beforeSend: function () {
        $(".avatar .loader").show();
      },
      success: function (result) {
        //console.log(result);

        /*
                if(result['success'] != '' && result['success'] != null){
                    for (let i = 0; i < result['success'].length; i++) {
                        notifications({text: result['success'][i], type: 'success', runtime: 1.5, selector: '.avatar_notifications'});
                    }
                }
                */

        if (result["files"] != "" && result["files"] != null) {
          for (let i = 0; i < result["files"].length; i++) {
            $(".avatar").append(
              `<div class="avatar_photo" style="background-image: url(${cdn + result["files"][i]});"></div>`,
            );
          }
        }

        if (result["error_files"] != "" && result["error_files"] != null) {
          for (let i = 0; i < result["error_files"].length; i++) {
            notifications({
              text: result["error_files"][i],
              type: "error",
              runtime: 2.5,
              selector: ".avatar_notifications",
            });
          }
        }

        if (result["error"] != "" && result["error"] != null) {
          notifications({
            text: result["error"],
            type: "error",
            runtime: 2.5,
            selector: ".avatar_notifications",
          });
        }
      },
      complete: () => {
        $(".avatar_inp").val("");
        $(".avatar .loader").hide();
      },
    });
  });

  // Ajax Transfer
  $("#transfer_form").submit(function (event) {
    event.preventDefault();
    el = "#" + event.target.getAttribute("id");
    $(el + " button").attr("disabled", true);
    let token = $.cookie("token");

    if (isDemoEnv()) {
      notifications({
        text: "Перевод выполнен",
        type: "success",
        runtime: 1.5,
        selector: el + " .notifications",
      });
      $(el)[0].reset();
      $(el + " button").attr("disabled", false);
      return;
    }

    $.ajax({
      type: "POST",
      url: api + "/user/transfer",
      data: $(el).serialize() + "&token=" + token + "&lang=" + lang,
      success: function (result) {
        //console.log(result);

        if (result["success"] != "" && result["success"] != null) {
          get_balance();
          $(el)[0].reset();
          notifications({
            text: result["success"],
            type: "success",
            runtime: 3.5,
            selector: el + " .notifications",
          });
        }

        if (result["error"] != "" && result["error"] != null) {
          notifications({
            text: result["error"],
            type: "error",
            runtime: 7.5,
            selector: el + " .notifications",
          });
        }
      },
      complete: () => {
        $(el + " button").attr("disabled", false);
      },
    });
  });

  // Ajax Voucher
  $("#voucher_form").submit(function (event) {
    event.preventDefault();
    el = "#" + event.target.getAttribute("id");
    $(el + " button").attr("disabled", true);
    let token = $.cookie("token");

    if (isDemoEnv()) {
      updateDemoUserBalance(100);
      notifications({
        text: "Ваучер активирован",
        type: "success",
        runtime: 1.5,
        selector: el + " .notifications",
      });
      $(el)[0].reset();
      $(el + " button").attr("disabled", false);
      return;
    }

    $.ajax({
      type: "POST",
      url: api + "/user/voucher",
      data: $(el).serialize() + "&token=" + token + "&lang=" + lang,
      success: function (result) {
        //console.log(result);

        if (result["success"] != "" && result["success"] != null) {
          get_balance();
          $(el)[0].reset();
          notifications({
            text: result["success"],
            type: "success",
            runtime: 3.5,
            selector: el + " .notifications",
          });
        }

        if (result["error"] != "" && result["error"] != null) {
          notifications({
            text: result["error"],
            type: "error",
            runtime: 3.5,
            selector: el + " .notifications",
          });
        }
      },
      complete: () => {
        $(el + " button").attr("disabled", false);
      },
    });
  });

  // Ajax Withdraw
  $("#withdraw_form").submit(function (event) {
    event.preventDefault();
    el = "#" + event.target.getAttribute("id");
    $(el + " button").attr("disabled", true);
    let token = $.cookie("token");

    if (isDemoEnv()) {
      let amount = parseFloat($(el + " input[name=amount]").val() || 0);
      if (amount > 0) {
        updateDemoUserBalance(-amount);
      }
      notifications({
        text: "Заявка на вывод отправлена",
        type: "success",
        runtime: 1.5,
        selector: el + " .notifications",
      });
      $(el)[0].reset();
      $(el + " button").attr("disabled", false);
      return;
    }

    $.ajax({
      type: "POST",
      url: api + "/user/withdraw",
      data: $(el).serialize() + "&token=" + token + "&lang=" + lang,
      success: function (result) {
        //console.log(result);

        if (result["success"] != "" && result["success"] != null) {
          get_balance();
          $(el)[0].reset();
          notifications({
            text: result["success"],
            type: "success",
            runtime: 3.5,
            selector: el + " .notifications",
          });
        }

        if (result["error"] != "" && result["error"] != null) {
          notifications({
            text: result["error"],
            type: "error",
            runtime: 7.5,
            selector: el + " .notifications",
          });
        }
      },
      complete: () => {
        $(el + " button").attr("disabled", false);
      },
    });
  });

  // Ajax Deposit
  $(".deposit_methods div").click(function (event) {
    let form = "#deposit_form";
    let amount = $(form + " input[name=amount]").val();
    let payment = $(this).attr("data-payment");
    let method = $(this).attr("data-method");
    let token = $.cookie("token");

    if (isDemoEnv()) {
      let value = parseFloat(amount || 0);
      if (value > 0) {
        updateDemoUserBalance(value);
      }
      notifications({
        text: "Платеж создан",
        type: "success",
        runtime: 1.5,
        selector: form + " .notifications",
      });
      return;
    }

    $.ajax({
      type: "POST",
      url: api + "/user/deposit",
      data:
        "amount=" +
        amount +
        "&payment=" +
        payment +
        "&method=" +
        method +
        "&token=" +
        token +
        "&lang=" +
        lang,
      success: function (result) {
        //console.log(result);

        if (result["transaction"] != "" && result["transaction"] != null) {
          window.location.href = api + "/pay/" + result["transaction"];
        }

        /*
                if(result['success'] != '' && result['success'] != null){
                    notifications({text: result['success'], type: 'success', runtime: 3.5, selector: form + ' .notifications'});
                }
                */

        if (result["error"] != "" && result["error"] != null) {
          notifications({
            text: result["error"],
            type: "error",
            runtime: 3.5,
            selector: form + " .notifications",
          });
        }
      },
    });
  });
});
