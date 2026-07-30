(function () {
  "use strict";

  /* ---------- Telegram WebApp integration ---------- */
  var tg = window.Telegram && window.Telegram.WebApp;

  if (tg) {
    tg.ready();
    tg.expand();
    applyTelegramTheme();
    tg.onEvent("themeChanged", applyTelegramTheme);
  }

  function applyTelegramTheme() {
    var scheme = (tg && tg.colorScheme) || "dark";
    document.documentElement.setAttribute("data-theme", scheme);
  }

  /* ---------- State ---------- */
  var state = {
    all: [],
    activeTags: new Set(),
    query: ""
  };

  /* ---------- DOM refs ---------- */
  var el = {
    list: document.getElementById("list"),
    tagRow: document.getElementById("tagRow"),
    searchInput: document.getElementById("searchInput"),
    clearSearch: document.getElementById("clearSearch"),
    resultCount: document.getElementById("resultCount"),
    emptyState: document.getElementById("emptyState"),
    resetFilters: document.getElementById("resetFilters"),
    pageTitle: document.getElementById("pageTitle"),
    pageSubtitle: document.getElementById("pageSubtitle")
  };

  /* ---------- Load data ---------- */
  fetch("data.json")
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data.meta) {
        if (data.meta.title) el.pageTitle.textContent = data.meta.title;
        if (data.meta.subtitle) el.pageSubtitle.textContent = data.meta.subtitle;
      }
      state.all = data.services || [];
      renderTags(data.tags || collectTags(state.all));
      render();
    })
    .catch(function (err) {
      el.list.innerHTML =
        '<p style="color:var(--text-muted);padding:24px;text-align:center;">Couldn\'t load data.json</p>';
      console.error(err);
    });

  function collectTags(services) {
    var s = new Set();
    services.forEach(function (svc) { (svc.tags || []).forEach(function (t) { s.add(t); }); });
    return Array.from(s);
  }

  /* ---------- Tag chips ---------- */
  function renderTags(tags) {
    var frag = document.createDocumentFragment();
    frag.appendChild(makeChip("All", true));
    tags.forEach(function (t) { frag.appendChild(makeChip(t, false)); });
    el.tagRow.appendChild(frag);
  }

  function makeChip(label, isAll) {
    var btn = document.createElement("button");
    btn.className = "chip";
    btn.type = "button";
    btn.textContent = label;
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-selected", isAll ? "true" : "false");
    btn.dataset.tag = isAll ? "__all__" : label;

    btn.addEventListener("click", function () {
      if (isAll) {
        state.activeTags.clear();
      } else {
        if (state.activeTags.has(label)) {
          state.activeTags.delete(label);
        } else {
          state.activeTags.add(label);
        }
      }
      syncChipStates();
      render();
    });

    return btn;
  }

  function syncChipStates() {
    var chips = el.tagRow.querySelectorAll(".chip");
    chips.forEach(function (chip) {
      var tag = chip.dataset.tag;
      if (tag === "__all__") {
        chip.setAttribute("aria-selected", state.activeTags.size === 0 ? "true" : "false");
      } else {
        chip.setAttribute("aria-selected", state.activeTags.has(tag) ? "true" : "false");
      }
    });
  }

  /* ---------- Search ---------- */
  el.searchInput.addEventListener("input", function (e) {
    state.query = e.target.value.trim().toLowerCase();
    el.clearSearch.hidden = state.query.length === 0;
    render();
  });

  el.clearSearch.addEventListener("click", function () {
    el.searchInput.value = "";
    state.query = "";
    el.clearSearch.hidden = true;
    el.searchInput.focus();
    render();
  });

  el.resetFilters.addEventListener("click", function () {
    state.activeTags.clear();
    state.query = "";
    el.searchInput.value = "";
    el.clearSearch.hidden = true;
    syncChipStates();
    render();
  });

  /* ---------- Filtering + rendering ---------- */
  function getFiltered() {
    return state.all.filter(function (svc) {
      var matchesQuery =
        state.query.length === 0 ||
        svc.name.toLowerCase().indexOf(state.query) !== -1;

      var matchesTags =
        state.activeTags.size === 0 ||
        (svc.tags || []).some(function (t) { return state.activeTags.has(t); });

      return matchesQuery && matchesTags;
    }).sort(function (a, b) {
      if (!!b.featured !== !!a.featured) return b.featured ? 1 : -1;
      return (b.rating || 0) - (a.rating || 0);
    });
  }

  function render() {
    var results = getFiltered();
    el.resultCount.textContent = results.length;
    el.list.innerHTML = "";

    if (results.length === 0) {
      el.emptyState.hidden = false;
      return;
    }
    el.emptyState.hidden = true;

    var frag = document.createDocumentFragment();
    results.forEach(function (svc, i) {
      frag.appendChild(buildRow(svc, i + 1));
    });
    el.list.appendChild(frag);
  }

  function buildRow(svc, rank) {
    var row = document.createElement("div");
    row.className = "row" + (svc.featured ? " row--featured" : "");

    var top = document.createElement("div");
    top.className = "row__top";

    var rankEl = document.createElement("span");
    rankEl.className = "row__rank";
    rankEl.textContent = String(rank).padStart(2, "0");

    var logo = document.createElement("div");
    logo.className = "row__logo";
    if (svc.logo) {
      var img = document.createElement("img");
      img.src = svc.logo;
      img.alt = "";
      logo.appendChild(img);
    } else {
      logo.textContent = (svc.name || "?").charAt(0).toUpperCase();
    }

    var name = document.createElement("span");
    name.className = "row__name";
    name.textContent = svc.name;

    top.appendChild(rankEl);
    top.appendChild(logo);
    top.appendChild(name);

    var tagsWrap = document.createElement("div");
    tagsWrap.className = "row__tags";
    (svc.tags || []).forEach(function (t) {
      var tagEl = document.createElement("span");
      tagEl.className = "tag";
      tagEl.textContent = t;
      tagsWrap.appendChild(tagEl);
    });

    var bottom = document.createElement("div");
    bottom.className = "row__bottom";

    var meta = document.createElement("div");
    meta.className = "row__meta";

    if (typeof svc.rating === "number") {
      var ratingWrap = document.createElement("div");
      ratingWrap.className = "rating";
      var num = document.createElement("span");
      num.className = "rating__num";
      num.textContent = svc.rating.toFixed(1);
      var meter = document.createElement("div");
      meter.className = "rating__meter";
      var meterFill = document.createElement("span");
      meterFill.style.width = Math.min(100, (svc.rating / 5) * 100) + "%";
      meter.appendChild(meterFill);
      ratingWrap.appendChild(num);
      ratingWrap.appendChild(meter);
      if (svc.reviews) {
        var reviews = document.createElement("span");
        reviews.className = "rating__reviews";
        reviews.textContent = svc.reviews + " reviews";
        ratingWrap.appendChild(reviews);
      }
      meta.appendChild(ratingWrap);
    }

    if (svc.note) {
      var note = document.createElement("span");
      note.className = "note";
      note.textContent = svc.note;
      meta.appendChild(note);
    }

    bottom.appendChild(meta);

    var cta = document.createElement("a");
    cta.className = "row__cta";
    cta.textContent = "View \u2192";
    cta.href = svc.link || "#";
    cta.target = "_blank";
    cta.rel = "noopener noreferrer";
    cta.addEventListener("click", function (e) {
      if (tg && svc.link) {
        e.preventDefault();
        tg.openLink(svc.link);
      }
    });

    bottom.appendChild(cta);

    row.appendChild(top);
    if ((svc.tags || []).length) row.appendChild(tagsWrap);
    row.appendChild(bottom);

    return row;
  }
})();
