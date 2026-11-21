// Prototype behaviour. Real site: popup text/on-off and show-prices come from the admin,
// product cards are rendered by Django templates, the callback form posts to the server.
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const store = {
  get: (key) => JSON.parse(localStorage.getItem(key) || "[]"),
  set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
};
const money = (v) => "$" + v.toFixed(2);
const icon = (paths) =>
  `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
const ICON = {
  heart: icon('<path d="M12 21s-6.7-4.35-9.33-8.36C.5 9.4 2.24 5 6.5 5c2.2 0 3.6 1.2 5.5 3.2C13.9 6.2 15.3 5 17.5 5c4.26 0 6 4.4 3.83 7.64C18.7 16.65 12 21 12 21z"/>'),
  eye: icon('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  phone: icon('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>'),
  chat: icon('<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.8-.9L3 21l1.9-5.1A8.4 8.4 0 1 1 21 11.5z"/>'),
  grid: icon('<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>'),
  compare: icon('<path d="m7 4-4 4 4 4"/><path d="M3 8h13"/><path d="m17 20 4-4-4-4"/><path d="M21 16H8"/>'),
};
const VIBER = "viber://chat?number=%2B380983678436";
const MAX_COMPARE = 4;

// ---------- mascot Бенсі ----------
// Animations play with the Masko player (transparent WebM, HEVC for Safari); without it, a still pose is shown.
const POSE_FOR = { wave: "waving", idle: "standing", thinking: "thinking" };
function playMascots(root = document) {
  $$("[data-clip]:not([data-mounted])", root).forEach((el) => {
    el.dataset.mounted = "1";
    const n = el.dataset.clip;
    if (window.MaskoPlayer) {
      MaskoPlayer.mount(el, { clip: { webm: `img/mascot/${n}.webm`, hevc: `img/mascot/${n}.mov` },
        autoPlay: !matchMedia("(prefers-reduced-motion: reduce)").matches });
    } else {
      el.innerHTML = `<img src="img/mascot/${POSE_FOR[n]}.png" alt="" style="width:100%;height:100%;object-fit:contain">`;
    }
  });
}
const mascotEmpty = (pose, title, text) =>
  `<div class="mascot-empty"><img src="img/mascot/${pose}.png" alt=""><b>${title}</b><p>${text}</p></div>`;

// ---------- product cards ----------
function card(id, badge) {
  const p = PRODUCTS[id];
  const off = p.old ? Math.round((1 - p.price / p.old) * 100) : 0;
  const badges = [
    badge === "new" && '<span class="badge">Новинка</span>',
    badge === "sale" && '<span class="badge sale">Акція</span>',
    off && `<span class="badge off price-only">-${off}%</span>`,
    p.sku.startsWith("KB") && '<span class="badge kb">Kingberg</span>',
  ].filter(Boolean).join("");
  return `<article class="card">
    <div class="badges">${badges}</div>
    <button class="fav" data-id="${id}" aria-label="Додати в обране" title="В обране">${ICON.heart}</button>
    <button class="cmp" data-id="${id}" aria-label="Додати до порівняння" title="Порівняти">${ICON.compare}</button>
    <a class="pic" href="product.html" data-view="${id}"><img src="img/${id}.jpg" alt="" loading="lazy"></a>
    <div class="body">
      <span class="sku">${p.sku}</span>
      <a class="title" href="product.html" data-view="${id}"><h4>${p.name}</h4></a>
      <span class="stock ${p.out ? "out" : ""}">${p.out ? "○ Немає в наявності" : "● В наявності"}</span>
      <div class="row">
        <span class="ask">Ціна за запитом</span>
        <span class="price">${p.old ? `<s>${money(p.old)}</s> ` : "від "}<b>${money(p.price)}</b></span>
        <a class="btn" href="product.html" data-view="${id}">Детальніше</a>
      </div>
    </div>
  </article>`;
}
$$("[data-products]").forEach((el) => {
  const section = SECTIONS[el.dataset.products];
  el.innerHTML = section.ids.map((id) => card(id, section.badge)).join("");
});

// ---------- homepage: Kingberg showcase (1 featured + 4 compact) ----------
const favCmp = (id) => `<button class="fav" data-id="${id}" aria-label="Додати в обране">${ICON.heart}</button>
  <button class="cmp" data-id="${id}" aria-label="Додати до порівняння">${ICON.compare}</button>`;
const stock = (p) => `<span class="stock ${p.out ? "out" : ""}">${p.out ? "○ Немає в наявності" : "● В наявності"}</span>`;
$$("[data-showcase]").forEach((el) => {
  const [first, ...rest] = SECTIONS[el.dataset.showcase].ids;
  const f = PRODUCTS[first];
  $(".sc-body", el).innerHTML = `
    <article class="sc-feature">
      ${favCmp(first)}
      <span class="badge">Рекомендуємо</span>
      <a class="sc-pic" href="product.html" data-view="${first}"><img src="img/${first}.jpg" alt=""></a>
      <div class="sc-info">
        <span class="sku">${f.sku}</span>
        <a href="product.html" data-view="${first}"><h3>${f.name}</h3></a>
        <div class="sc-specs">${Object.entries(f.specs).slice(0, 3).map(([k, v]) => `<span><small>${k}</small>${v}</span>`).join("")}</div>
        <div class="sc-row"><span class="ask">Ціна за запитом</span><span class="price"><b>$${f.price.toFixed(2)}</b></span>
          <a class="btn" href="product.html" data-view="${first}">Детальніше</a></div>
      </div>
    </article>
    ${rest.slice(0, 4).map((id) => {
      const p = PRODUCTS[id];
      return `<article class="sc-mini">
        ${favCmp(id)}
        <a class="sc-mini-pic" href="product.html" data-view="${id}"><img src="img/${id}.jpg" alt="" loading="lazy"></a>
        <span class="sku">${p.sku}</span>
        <a href="product.html" data-view="${id}"><b>${p.name}</b></a>
        ${stock(p)}</article>`;
    }).join("")}`;
});

// ---------- homepage: deals with Посуд / Техніка tabs, horizontal cards ----------
$$("[data-deals]").forEach((el) => {
  const show = (key) => {
    $(".deals-grid", el).innerHTML = SECTIONS[key].ids.map((id) => {
      const p = PRODUCTS[id];
      const off = p.old ? Math.round((1 - p.price / p.old) * 100) : 0;
      return `<article class="deal">
        <a class="deal-pic" href="product.html" data-view="${id}"><img src="img/${id}.jpg" alt="" loading="lazy">
          <span class="deal-tag">Акція</span>${off ? `<span class="deal-off price-only">-${off}%</span>` : ""}</a>
        <div class="deal-info">
          <span class="sku">${p.sku}</span>
          <a href="product.html" data-view="${id}"><b>${p.name}</b></a>
          ${stock(p)}
          <div class="deal-row"><span class="ask">Ціна за запитом</span>
            <span class="price">${p.old ? `<s>$${p.old.toFixed(2)}</s> ` : ""}<b>$${p.price.toFixed(2)}</b></span>
            <span class="deal-actions">${favCmp(id)}</span></div>
        </div>
      </article>`;
    }).join("") + `<a class="deal deal-more" href="category.html?c=sale"><b>Усі акції</b><span>Більше вигідних пропозицій →</span></a>`;
    syncCounts();
  };
  $(".deals-tabs", el).addEventListener("click", (e) => {
    const b = e.target.closest("[data-tab]");
    if (!b) return;
    $$(".deals-tabs button", el).forEach((x) => { x.classList.toggle("on", x === b); x.setAttribute("aria-selected", x === b); });
    show(b.dataset.tab);
  });
  show("sale-cookware");
});

// ---------- catalog: top-menu mega panel, sidebar fly-out, category page ----------
// Hover (or keyboard focus) opens a grid of subcategories with pictures; a click opens the section's page.
const params = new URLSearchParams(location.search);
const curGroup = params.get("c"), curSub = params.get("s");
const catUrl = (g, s) => `category.html?c=${g}${s ? `&s=${s}` : ""}`;
const tiles = (g, cls = "tiles") => `<div class="${cls}">${g.subs.map(([s, name, n]) =>
  `<a class="tile" href="${catUrl(g.slug, s)}"><img src="img/cat/${s}.jpg" alt="" loading="lazy"><span>${name}</span><small>${n} товарів</small></a>`).join("")}</div>`;
const megaPanel = (g) => `<div class="mega-head"><b>${g.name}</b><a href="${catUrl(g.slug)}">Усі товари розділу (${g.count}) →</a></div>${tiles(g)}`;

const navEl = $("[data-catalog-nav]");
if (navEl) navEl.innerHTML = CATALOG.map((g) => `<div class="navitem${g.slug === curGroup ? " on" : ""}">
  <a href="${catUrl(g.slug)}">${g.name}</a>${g.subs ? `<div class="mega">${megaPanel(g)}</div>` : ""}</div>`).join("");

const sideEl = $("[data-catalog-sidebar]");
if (sideEl) sideEl.innerHTML = CATALOG.map((g) => {
  const active = g.slug === curGroup;
  const inner = active && g.subs
    ? `<div class="subs">${g.subs.map(([s, n, c]) => `<a class="${s === curSub ? "on" : ""}" href="${catUrl(g.slug, s)}">${n} <span>${c}</span></a>`).join("")}</div>`
    : g.subs ? `<div class="flyout"><div class="flyout-in">${megaPanel(g)}</div></div>` : "";
  const thumb = g.subs ? `img/cat/${g.subs[0][0]}.jpg` : { new: "img/p2.jpg", sale: "img/a2.jpg" }[g.slug];
  return `<div class="cat-item${active ? " on" : ""}"><a href="${catUrl(g.slug)}"><img src="${thumb}" alt=""><span class="nm">${g.name}</span><span class="ct">${g.count}</span></a>${inner}</div>`;
}).join("");

const catPage = $("[data-category-page]");
if (catPage) {
  const g = CATALOG.find((x) => x.slug === curGroup) || CATALOG[2];
  const sub = g.subs?.find((s) => s[0] === curSub);
  const title = sub ? sub[1] : g.name, total = sub ? sub[2] : g.count;
  const special = { new: ["new-cookware", "new-appliances"], sale: ["sale-cookware", "sale-appliances"] }[g.slug];
  const ids = special ? special.flatMap((k) => SECTIONS[k].ids) : GROUP_PRODUCTS[g.slug];
  const badge = special ? SECTIONS[special[0]].badge : null;
  document.title = `${title} — Benson`;
  catPage.innerHTML = `
    <div class="crumbs"><a href="index.html">Головна</a> / ${sub ? `<a href="${catUrl(g.slug)}">${g.name}</a> / ${sub[1]}` : g.name}</div>
    <div class="cat-head"><h1>${title}</h1><span>${total} товарів</span></div>
    ${g.subs && !sub ? tiles(g, "tiles big") : ""}
    ${sub ? `<div class="chips">${g.subs.map(([s, n]) => `<a class="${s === curSub ? "on" : ""}" href="${catUrl(g.slug, s)}">${n}</a>`).join("")}</div>` : ""}
    <div class="toolbar">
      <div class="seg" data-brand><button class="on" data-v="">Усі бренди</button><button data-v="BN">Benson</button><button data-v="KB">Kingberg</button></div>
      <label class="chk"><input type="checkbox" data-instock> Лише в наявності</label>
      <select data-sort aria-label="Сортування"><option value="">За замовчуванням</option><option value="name">Назва А–Я</option><option value="new">Спочатку нові</option></select>
      <span class="found" data-found></span>
    </div>
    <div class="grid" data-cat-grid></div>
    <p class="demo-note">Прототип: показано демо-товари розділу. На сайті тут будуть усі ${total} товарів, з фільтрами та сторінками.</p>`;
  const render = () => {
    const brand = $("[data-brand] .on").dataset.v, inStock = $("[data-instock]").checked, sort = $("[data-sort]").value;
    let list = ids.filter((id) => (!brand || PRODUCTS[id].sku.startsWith(brand)) && (!inStock || !PRODUCTS[id].out));
    if (sort === "name") list = [...list].sort((a, b) => PRODUCTS[a].name.localeCompare(PRODUCTS[b].name, "uk"));
    if (sort === "new") list = [...list].reverse();
    $("[data-cat-grid]").innerHTML = list.map((id) => card(id, badge)).join("")
      || `<div class="grid-empty">${mascotEmpty("confused", "Нічого не знайшли", "За цими фільтрами товарів немає. Спробуйте інший бренд або вимкніть «Лише в наявності».")}</div>`;
    $("[data-found]").textContent = `Показано: ${list.length}`;
    syncCounts();
  };
  catPage.addEventListener("click", (e) => {
    const b = e.target.closest("[data-brand] button");
    if (b) { $$("[data-brand] button").forEach((x) => x.classList.toggle("on", x === b)); render(); }
  });
  catPage.addEventListener("change", render);
  render();
}

// ---------- shared floating UI: bottom dock, call button, drawer, compare dialog ----------
document.body.insertAdjacentHTML("beforeend", `
<nav class="dock" aria-label="Швидкий доступ">
  <a class="dock-m" href="index.html">${ICON.grid}<span>Каталог</span></a>
  <button data-open="favs">${ICON.heart}<span>Обране</span><b data-count="favs"></b></button>
  <button data-open="compare">${ICON.compare}<span>Порівняти</span><b data-count="compare"></b></button>
  <button data-open="viewed">${ICON.eye}<span>Переглянуті</span><b data-count="viewed"></b></button>
  <a class="dock-viber" href="${VIBER}">${ICON.chat}<span>Viber</span></a>
</nav>
<div class="call">
  <div class="call-panel" hidden>
    <h4>Бенсі на зв'язку 👋</h4>
    <p class="call-sub">Зателефонуйте, напишіть у Viber або залиште номер — передзвонимо.</p>
    <a href="tel:+380983678436">${ICON.phone} +38 (098) 367-84-36</a>
    <a href="tel:+380660123551">${ICON.phone} +38 (066) 012-35-51</a>
    <a href="${VIBER}">${ICON.chat} Написати у Viber</a>
    <form class="callback form">
      <b>Замовити зворотний дзвінок</b>
      <input name="name" placeholder="Ваше ім'я" required>
      <input name="phone" type="tel" placeholder="+38 (0__) ___-__-__" required>
      <button class="btn">Передзвоніть мені</button>
      <small>На сайті форма буде захищена від ботів (Cloudflare Turnstile)</small>
    </form>
  </div>
  <button class="call-btn" aria-label="Зв'язатися з нами" aria-expanded="false">
    <span class="call-mascot" data-clip="idle"></span><span class="call-badge">${ICON.phone}</span>
  </button>
</div>
<dialog class="drawer" id="drawer">
  <div class="drawer-head"><h3></h3><button aria-label="Закрити" onclick="this.closest('dialog').close()">×</button></div>
  <div class="drawer-list"></div>
  <div class="drawer-actions"></div>
</dialog>
<dialog class="compare" id="compare">
  <div class="drawer-head"><h3>Порівняння товарів</h3><button aria-label="Закрити" onclick="this.closest('dialog').close()">×</button></div>
  <div class="compare-body"></div>
</dialog>`);

function syncCounts() {
  const favs = store.get("favs"), cmp = store.get("compare");
  $$(".fav").forEach((b) => b.classList.toggle("on", favs.includes(b.dataset.id)));
  $$(".cmp").forEach((b) => b.classList.toggle("on", cmp.includes(b.dataset.id)));
  const counts = { favs: favs.length, compare: cmp.length, viewed: store.get("viewed").length };
  $$("[data-count]").forEach((c) => {
    c.textContent = counts[c.dataset.count];
    c.hidden = !counts[c.dataset.count];
  });
}

function toast(text) {
  const t = Object.assign(document.createElement("div"), { className: "toast", textContent: text });
  document.body.append(t);
  setTimeout(() => t.remove(), 2200);
}

// ----- drawer: favourites / recently viewed -----
function openList(kind) {
  if (kind === "compare") return openCompare();
  const ids = store.get(kind);
  const drawer = $("#drawer");
  drawer.dataset.kind = kind;
  $("h3", drawer).textContent = kind === "favs" ? "Обране" : "Переглянуті товари";
  $(".drawer-list", drawer).innerHTML = ids.length
    ? ids.map((id) => {
        const p = PRODUCTS[id];
        const remove = kind === "favs" ? `<button class="fav on" data-id="${id}" aria-label="Прибрати з обраного">${ICON.heart}</button>` : "";
        return `<div class="li"><img src="img/${id}.jpg" alt=""><div><span class="sku">${p.sku}</span><a href="product.html" data-view="${id}">${p.name}</a></div>${remove}</div>`;
      }).join("")
    : mascotEmpty("standing", kind === "favs" ? "Тут поки порожньо" : "Ви ще не переглядали товари",
        kind === "favs" ? "Натисніть ♡ на товарі, щоб додати його сюди. Потім надішліть список нам у Viber." : "Відкрийте будь-який товар — він з'явиться тут.");
  const text = "Добрий день! Цікавлять товари:\n" + ids.map((id) => `${PRODUCTS[id].sku} — ${PRODUCTS[id].name}`).join("\n");
  drawer.dataset.text = text;
  $(".drawer-actions", drawer).innerHTML = kind === "favs" && ids.length
    ? `<a class="btn btn-viber" href="viber://forward?text=${encodeURIComponent(text)}">${ICON.chat} Надіслати список у Viber</a>
       <button class="btn btn-ghost" data-copy>Скопіювати список</button>`
    : "";
  if (!drawer.open) drawer.showModal();
}

// ----- compare dialog -----
function openCompare() {
  const ids = store.get("compare");
  const dialog = $("#compare");
  if (!ids.length) {
    $(".compare-body", dialog).innerHTML = mascotEmpty("thinking", "Немає товарів для порівняння", "Натисніть ⇄ на товарі, щоб додати його до порівняння (до 4 товарів).");
  } else {
    const items = ids.map((id) => PRODUCTS[id]);
    const keys = [...new Set(items.flatMap((p) => Object.keys(p.specs)))];
    const row = (label, cells, cls = "") => {
      const differs = new Set(cells).size > 1 ? " diff" : "";
      return `<tr class="${cls}${differs}"><th>${label}</th>${cells.map((c) => `<td>${c}</td>`).join("")}</tr>`;
    };
    $(".compare-body", dialog).innerHTML = `<table>
      <tr class="head"><th></th>${ids.map((id) => `<td>
        <button class="rm" data-uncompare="${id}" aria-label="Прибрати">×</button>
        <img src="img/${id}.jpg" alt=""><span class="sku">${PRODUCTS[id].sku}</span>
        <a href="product.html" data-view="${id}">${PRODUCTS[id].name}</a></td>`).join("")}</tr>
      ${row("Бренд", items.map((p) => (p.sku.startsWith("KB") ? "Kingberg" : "Benson")))}
      ${row("Наявність", items.map((p) => (p.out ? "Немає в наявності" : "В наявності")))}
      ${row("Ціна", items.map((p) => money(p.price)), "price-only")}
      ${keys.map((k) => row(k, items.map((p) => p.specs[k] || "—"))).join("")}
      <tr><th></th>${ids.map((id) => `<td><a class="btn" href="product.html" data-view="${id}">Детальніше</a></td>`).join("")}</tr>
    </table>`;
  }
  if (!dialog.open) dialog.showModal();
}

// ----- one click handler for everything -----
const toggleIn = (key, id) => {
  const list = store.get(key);
  const on = !list.includes(id);
  store.set(key, on ? [...list, id] : list.filter((x) => x !== id));
  return on;
};
const refreshOpen = () => {
  if ($("#drawer").open) openList($("#drawer").dataset.kind);
  if ($("#compare").open) openCompare();
};

document.addEventListener("click", (e) => {
  const t = e.target;
  // A click on a modal's backdrop lands on the <dialog> element itself -> close it.
  if (t.tagName === "DIALOG") { t.close(); return; }

  const fav = t.closest(".fav"), cmp = t.closest(".cmp");
  if (fav) {
    toast(toggleIn("favs", fav.dataset.id) ? "Додано в обране" : "Прибрано з обраного");
    syncCounts(); refreshOpen(); return;
  }
  if (cmp) {
    const list = store.get("compare");
    if (!list.includes(cmp.dataset.id) && list.length >= MAX_COMPARE) { toast(`Можна порівняти до ${MAX_COMPARE} товарів`); return; }
    toast(toggleIn("compare", cmp.dataset.id) ? "Додано до порівняння" : "Прибрано з порівняння");
    syncCounts(); refreshOpen(); return;
  }
  if (t.closest("[data-uncompare]")) {
    toggleIn("compare", t.closest("[data-uncompare]").dataset.uncompare);
    syncCounts(); openCompare(); return;
  }
  const view = t.closest("[data-view]");
  if (view) store.set("viewed", [view.dataset.view, ...store.get("viewed").filter((x) => x !== view.dataset.view)].slice(0, 12));
  if (t.closest("[data-open]")) openList(t.closest("[data-open]").dataset.open);
  if (t.closest("[data-copy]")) {
    navigator.clipboard.writeText($("#drawer").dataset.text);
    t.closest("[data-copy]").textContent = "Скопійовано ✓";
  }
  // call widget: toggle on its button, close on any click outside it
  const panel = $(".call-panel");
  if (t.closest("[data-open-call]")) panel.hidden = false; // "Запитати Бенсі" in the sidebar
  else if (t.closest(".call-btn")) panel.hidden = !panel.hidden;
  else if (!t.closest(".call")) panel.hidden = true;
  $(".call-btn").setAttribute("aria-expanded", String(!panel.hidden));
});

playMascots();

// Brand logo strip: duplicate the logos once so the -50% CSS animation loops without a gap.
$$(".logo-track").forEach((t) => t.insertAdjacentHTML("beforeend",
  t.innerHTML.replace(/<a /g, '<a aria-hidden="true" tabindex="-1" ')));
// Equal *visual* size: give every logo the same area (wide wordmarks get shorter, stacked logos narrower),
// capped by the slide box. Same width or same height alone makes some logos look much bigger.
function equalLogos(sel, area, maxW, maxH) {
  $$(sel).forEach((img) => {
    const fit = () => {
      const r = img.naturalWidth / img.naturalHeight;
      const h = Math.sqrt(area / r), w = h * r;
      const k = Math.min(1, maxW / w, maxH / h);
      img.style.width = `${w * k}px`; img.style.height = `${h * k}px`;
    };
    img.complete ? fit() : img.addEventListener("load", fit);
  });
}
equalLogos(".logo-slider:not(.side) .logo-slide img", 8200, 220, 72); // homepage strip
equalLogos(".logo-slider.side .logo-slide img", 3800, 126, 60);       // sidebar carousel

$(".callback").addEventListener("submit", (e) => {
  e.preventDefault();
  e.target.innerHTML = mascotEmpty("cheering", "Дякуємо!", "Ми передзвонимо вам найближчим часом.");
});
syncCounts();

// ---------- announcement popup: once per browser session (real site: once per text version) ----------
const ann = $("#announcement");
if (ann && !sessionStorage.getItem("ann-seen")) {
  ann.showModal();
  ann.addEventListener("close", () => sessionStorage.setItem("ann-seen", "1"));
}

// ---------- demo price toggle (real site: SiteSettings.show_prices) ----------
const toggle = $("#prices");
const applyPrices = (on) => document.body.classList.toggle("show-prices", on);
toggle.checked = localStorage.getItem("demo-prices") === "1";
applyPrices(toggle.checked);
toggle.addEventListener("change", () => {
  localStorage.setItem("demo-prices", toggle.checked ? "1" : "0");
  applyPrices(toggle.checked);
});

// ---------- carousels: endless loop (arrows + autoscroll) ----------
// Endless trick: after sliding one card left, the card that left the view is moved to the end
// and the scroll position is shifted back by one card in the same frame -> no visible jump, no rewind.
const cardStep = (track) => track.firstElementChild.offsetWidth + parseFloat(getComputedStyle(track).columnGap);
const overflowing = (track) => track.scrollWidth > track.clientWidth + 5;

function shiftInstantly(track, fn) {
  track.style.scrollSnapType = "none"; // so snapping doesn't fight the instant correction
  fn();
  track.style.scrollSnapType = "";
}
function whenScrollEnds(track, fn) {
  let done = false;
  const once = () => { if (!done) { done = true; fn(); } };
  track.addEventListener("scrollend", once, { once: true });
  setTimeout(once, 700); // fallback for browsers without "scrollend"
}
function slide(track, dir) {
  if (track.busy || !overflowing(track)) return;
  track.busy = true;
  const step = cardStep(track);
  if (dir > 0) {
    track.scrollBy({ left: step, behavior: "smooth" });
    whenScrollEnds(track, () => {
      shiftInstantly(track, () => { track.append(track.firstElementChild); track.scrollLeft -= step; });
      track.busy = false;
    });
  } else {
    shiftInstantly(track, () => { track.prepend(track.lastElementChild); track.scrollLeft += step; });
    track.scrollBy({ left: -step, behavior: "smooth" });
    whenScrollEnds(track, () => (track.busy = false));
  }
}

$$(".arrow").forEach((btn) =>
  btn.addEventListener("click", () => slide(btn.closest(".section-head").nextElementSibling, +btn.dataset.dir))
);
// Autoscroll one card every 4s; pauses while hovered/touched/focused; off for reduced-motion users.
if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
  $$(".carousel").forEach((track) => {
    let paused = false;
    ["mouseenter", "touchstart", "focusin"].forEach((ev) => track.addEventListener(ev, () => (paused = true), { passive: true }));
    ["mouseleave", "touchend", "focusout"].forEach((ev) => track.addEventListener(ev, () => (paused = false)));
    setInterval(() => { if (!paused && !document.hidden) slide(track, 1); }, 4000);
  });
}

// ---------- product gallery thumbnails ----------
$$(".thumbs button").forEach((btn) =>
  btn.addEventListener("click", () => {
    $("#main-img").src = $("img", btn).src;
    $$(".thumbs button").forEach((b) => b.classList.toggle("on", b === btn));
  })
);
