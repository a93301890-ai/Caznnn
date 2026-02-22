(() => {
  window.initSportFront = function initSportFront() {
    if (window.__sportFrontCleanup) {
      window.__sportFrontCleanup();
    }
    const root = document.querySelector("[data-sport-page]");
    if (!root) return;

  const betList = root.querySelector("[data-betslip-list]");
  const betPlaceholder = root.querySelector("[data-betslip-empty]");
  const betCount = root.querySelector("[data-bets-count]");
  const totalOddsEl = root.querySelector("[data-total-odds]");
  const totalWinEl = root.querySelector("[data-total-win]");
  const stakeInput = root.querySelector("[data-stake]");
  const messageEl = root.querySelector("[data-bets-message]");

  const bets = new Map();

  const formatNumber = (value) => {
    if (!Number.isFinite(value)) return "0.00";
    return value.toFixed(2);
  };

  const buildBetId = (data) => `${data.event}__${data.market}`;

  const updateBetslip = () => {
    if (!betList || !betPlaceholder || !betCount || !totalOddsEl || !totalWinEl)
      return;

    betList.innerHTML = "";
    let totalOdds = 1;

    bets.forEach((bet) => {
      totalOdds *= bet.odd;
      const item = document.createElement("li");
      item.className = "bet-item";
      item.innerHTML = `
                <div class="bet-info">
                    <div class="bet-title">${bet.event}</div>
                    <div class="bet-meta">${bet.market} · ${formatNumber(bet.odd)}</div>
                </div>
                <button class="bet-remove" type="button" data-remove="${bet.id}">×</button>
            `;
      betList.appendChild(item);
    });

    const stake = Number.parseFloat(stakeInput ? stakeInput.value : "0") || 0;
    const win = stake * totalOdds;

    betCount.textContent = String(bets.size);
    totalOddsEl.textContent = formatNumber(
      totalOdds === 1 && bets.size === 0 ? 0 : totalOdds,
    );
    totalWinEl.textContent = formatNumber(win);

    betPlaceholder.style.display = bets.size === 0 ? "block" : "none";
  };

  const syncOddButtons = () => {
    const oddButtons = root.querySelectorAll("[data-odd]");
    oddButtons.forEach((btn) => {
      const id = buildBetId({
        event: btn.dataset.event,
        market: btn.dataset.market,
      });
      btn.classList.toggle("is-active", bets.has(id));
    });
  };

  const toggleBet = (btn) => {
    const oddValue = Number.parseFloat(btn.dataset.odd);
    if (!Number.isFinite(oddValue)) return;
    const data = {
      event: btn.dataset.event,
      market: btn.dataset.market,
      odd: oddValue,
    };
    data.id = buildBetId(data);

    if (bets.has(data.id)) {
      bets.delete(data.id);
    } else {
      bets.set(data.id, data);
    }

    updateBetslip();
    syncOddButtons();
  };

  const handleAccordion = (btn) => {
    const block = btn.closest(".sport-accordion");
    if (!block) return;
    block.classList.toggle("is-collapsed");
  };

  const setActiveGroup = (btn, selector) => {
    const group = btn.closest(selector);
    if (!group) return;
    group
      .querySelectorAll(".is-active")
      .forEach((el) => el.classList.remove("is-active"));
    btn.classList.add("is-active");
  };

  const handleBetType = (btn) => {
    setActiveGroup(btn, "[data-betslip-tabs]");
    if (messageEl) {
      messageEl.textContent =
        btn.dataset.betType === "ordinary"
          ? "Обычный режим"
          : "Демо режим для мультиставок";
    }
  };

  const handleCategory = (btn) => {
    setActiveGroup(btn, "[data-categories]");
  };

  const handleRemove = (btn) => {
    const id = btn.dataset.remove;
    if (!id) return;
    bets.delete(id);
    updateBetslip();
    syncOddButtons();
  };

  const handleMakeBet = () => {
    if (!messageEl) return;
    if (bets.size === 0) {
      messageEl.textContent = "Добавьте событие в купон";
      return;
    }
    const stake = Number.parseFloat(stakeInput ? stakeInput.value : "0") || 0;
    if (stake <= 0) {
      messageEl.textContent = "Введите сумму ставки";
      return;
    }
    const token = getCookie("token");
    if (!token) {
      messageEl.textContent = "Нужна авторизация";
      return;
    }
    const type = getActiveBetType();
    const selections = Array.from(bets.values()).map((bet) => ({
      eventName: bet.event,
      market: bet.market,
      odd: bet.odd,
    }));
    fetch(`${window.api}/bets`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type, stake, selections }),
    })
      .then((res) => res.json())
      .then(() => {
        messageEl.textContent = "Ставка принята";
        bets.clear();
        if (stakeInput) stakeInput.value = "";
        updateBetslip();
        syncOddButtons();
      })
      .catch(() => {
        messageEl.textContent = "Ошибка отправки ставки";
      });
  };

  const handleSearch = (input) => {
    const value = input.value.trim().toLowerCase();
    const target = input.dataset.searchTarget;
    const items = root.querySelectorAll(
      `[data-search-group="${target}"] [data-filter]`,
    );
    items.forEach((item) => {
      const text = item.dataset.filter || "";
      item.style.display = text.toLowerCase().includes(value) ? "" : "none";
    });
  };

  const handleSwitch = (btn) => {
    btn.classList.toggle("is-on");
    btn.setAttribute(
      "aria-checked",
      btn.classList.contains("is-on") ? "true" : "false",
    );
  };

  const handleScrollToBet = () => {
    const betslip = root.querySelector("#bet-slip");
    if (!betslip) return;
    betslip.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const startAutoScroll = (el) => {
    const speed = 0.4;
    let dir = 1;
    let rafId;

    const tick = () => {
      if (el.scrollWidth <= el.clientWidth) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      el.scrollLeft += speed * dir;
      if (el.scrollLeft <= 0) {
        dir = 1;
      }
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 1) {
        dir = -1;
      }
      rafId = requestAnimationFrame(tick);
    };

    const start = () => {
      if (!rafId) rafId = requestAnimationFrame(tick);
    };

    const stop = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    };

    el.addEventListener("mouseenter", stop);
    el.addEventListener("mouseleave", start);
    el.addEventListener("touchstart", stop, { passive: true });
    el.addEventListener("touchend", start);
    start();
  };

  root
    .querySelectorAll("[data-auto-scroll]")
    .forEach((el) => startAutoScroll(el));

  const onDocumentClick = (event) => {
    const oddBtn = event.target.closest("[data-odd]");
    if (oddBtn) {
      event.preventDefault();
      toggleBet(oddBtn);
      return;
    }

    const accBtn = event.target.closest("[data-accordion-toggle]");
    if (accBtn) {
      event.preventDefault();
      handleAccordion(accBtn);
      return;
    }

    const betTypeBtn = event.target.closest("[data-bet-type]");
    if (betTypeBtn) {
      event.preventDefault();
      handleBetType(betTypeBtn);
      return;
    }

    const categoryBtn = event.target.closest("[data-category]");
    if (categoryBtn) {
      event.preventDefault();
      handleCategory(categoryBtn);
      return;
    }

    const removeBtn = event.target.closest("[data-remove]");
    if (removeBtn) {
      event.preventDefault();
      handleRemove(removeBtn);
      return;
    }

    const makeBetBtn = event.target.closest('[data-action="make-bet"]');
    if (makeBetBtn) {
      event.preventDefault();
      handleMakeBet();
      return;
    }

    const switchBtn = event.target.closest("[data-switch]");
    if (switchBtn) {
      event.preventDefault();
      handleSwitch(switchBtn);
      return;
    }

    const couponBtn = event.target.closest(".core_cupon");
    if (couponBtn) {
      event.preventDefault();
      handleScrollToBet();
    }
  };

  const onRootInput = (event) => {
    const input = event.target.closest("[data-search-input]");
    if (!input) return;
    handleSearch(input);
  };

  document.addEventListener("click", onDocumentClick);
  root.addEventListener("input", onRootInput);

  if (stakeInput) {
    stakeInput.addEventListener("input", updateBetslip);
  }

  updateBetslip();

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

  function getActiveBetType() {
    const active = root.querySelector(
      "[data-betslip-tabs] .betslip-tab.is-active",
    );
    const type = active ? active.dataset.betType : "ordinary";
    if (type === "express") return "EXPRESS";
    if (type === "system") return "SYSTEM";
    return "SINGLE";
  }

    window.__sportFrontCleanup = () => {
      document.removeEventListener("click", onDocumentClick);
      root.removeEventListener("input", onRootInput);
      if (stakeInput) {
        stakeInput.removeEventListener("input", updateBetslip);
      }
    };
  };

  window.initSportFront();
})();
