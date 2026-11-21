// Benson admin prototype: hash-routed pages (#products, #product/p1, ...).
// Real site: these are django-unfold admin pages backed by the database. Traffic numbers are DEMO data.
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const fmt = (n) => n.toLocaleString("uk-UA");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const sw = (on, attrs = "") => `<label class="switch"><input type="checkbox" ${on ? "checked" : ""} ${attrs}><span></span></label>`;
const brandOf = (p) => (p.sku.startsWith("KB") ? "Kingberg" : "Benson");
const catOf = (id) => (id[0] === "k" || ["a6", "a7", "a8"].includes(id) ? "Побутова техніка" : "Посуд");
const LANGS = [["uk", "Українська"], ["en", "English"], ["ru", "Русский"]];
function toast(text) {
  const t = Object.assign(document.createElement("div"), { className: "toast", textContent: text });
  document.body.append(t);
  setTimeout(() => t.remove(), 2200);
}
const langTabs = (done = { uk: true, en: false, ru: true }) =>
  `<div class="tabs">${LANGS.map(([l, name], i) => `<button class="${i ? "" : "on"}" data-lang="${l}"><i class="dot ${done[l] ? "ok" : ""}"></i>${name}</button>`).join("")}</div>`;
const toolbar = `<div class="toolbar">
  <button data-cmd="bold" title="Жирний">B</button><button data-cmd="italic" title="Курсив"><i>I</i></button>
  <button data-cmd="underline" title="Підкреслений"><u>U</u></button><button data-cmd="insertUnorderedList" title="Список">•</button>
  <button data-cmd="createLink" title="Посилання">🔗</button></div>`;
const savebar = (back) => `<div class="savebar"><span class="muted">Зміни ще не збережено</span><a class="btn ghost" href="${back}">Скасувати</a><button class="btn" data-save>Зберегти</button></div>`;

// ---------- demo records ----------
const CALLBACKS = [
  { name: "Олександр", phone: "+38 (067) 000-00-01", when: "сьогодні, 10:42", page: "BN-203 Набір посуду", done: false },
  { name: "Магазин «Господиня»", phone: "+38 (050) 000-00-02", when: "сьогодні, 09:15", page: "Головна", done: false },
  { name: "Ірина", phone: "+38 (093) 000-00-03", when: "вчора, 17:58", page: "Мультиварки Kingberg", done: false },
  { name: "Віктор", phone: "+38 (097) 000-00-04", when: "вчора, 12:03", page: "Сковороди", done: true },
  { name: "ТОВ «Кухня Плюс»", phone: "+38 (044) 000-00-05", when: "18 лист., 15:20", page: "Акції — Посуд", done: true },
  { name: "Наталія", phone: "+38 (066) 000-00-06", when: "17 лист., 11:47", page: "KB-2001 Мультиварка", done: true },
];
const CATEGORIES = [
  ["Посуд", 1099, [["Новинки", 81], ["Столовий інвентар", 94], ["Сковороди", 91], ["Термоси й термокухлі", 75], ["Кухонні аксесуари", 65],
    ["Каструлі з нержавіючої сталі", 56], ["Каструлі з антипригарним покриттям", 47], ["Форми для випікання", 47], ["Миски", 41],
    ["Набори ножів", 39], ["Посуд для ресторанів і кафе", 38]]],
  ["Побутова техніка", 47, [["Мультиварки", 6], ["М'ясорубки", 9], ["Електрочайники", 12], ["Блендери", 8]]],
];
const PAGES = [
  { title: "Про нас", slug: "/about/", order: 1, body: "<p><b>Benson</b> — оптовий постачальник посуду, кухонних аксесуарів і побутової техніки Kingberg.</p><p>Працюємо з магазинами, ресторанами та бізнесом по всій Україні.</p>" },
  { title: "Умови співпраці", slug: "/terms/", order: 2, body: "<p>Працюємо тільки з оптовими покупцями.</p><ul><li>Мінімальне замовлення — уточнюйте у менеджера</li><li>Оплата: безготівковий розрахунок</li></ul>" },
  { title: "Доставка", slug: "/delivery/", order: 3, body: "<p>Відправляємо по всій Україні перевізниками на вибір клієнта.</p>" },
  { title: "Контакти", slug: "/contacts/", order: 4, body: "<p>+38 (098) 367-84-36<br>+38 (066) 012-35-51<br>bensonukraine@gmail.com</p>" },
];
const pendingCalls = () => CALLBACKS.filter((c) => !c.done).length;

// ---------- views ----------
const VIEWS = {};

VIEWS.dashboard = {
  title: "Дашборд",
  html: () => `
    <div class="head">
      <div><h1>Дашборд</h1><p>Що відбувається на сайті <span class="demo">демо-дані: трафіку ще немає</span></p></div>
      <div class="seg" id="range"><button data-range="7">7 днів</button><button class="on" data-range="30">30 днів</button><button data-range="90">90 днів</button></div>
    </div>
    <div class="kpis">
      <div class="panel kpi"><div class="label">Відвідувачі</div><div class="value" id="k-visitors"></div><div class="delta" id="k-visitors-d"></div></div>
      <div class="panel kpi"><div class="label">Перегляди сторінок</div><div class="value" id="k-views"></div><div class="delta" id="k-views-d"></div></div>
      <div class="panel kpi"><div class="label">Заявки на дзвінок</div><div class="value" id="k-calls"></div><div class="delta" id="k-calls-d"></div></div>
      <div class="panel kpi"><div class="label">Товарів у каталозі</div><div class="value">1 146</div><div class="delta muted">905 в наявності · 2 бренди</div></div>
    </div>
    <div class="grid2">
      <div class="panel">
        <div class="panel-head"><div><h2>Відвідувачі по днях</h2><p class="sub" id="chart-sub"></p></div><a href="#stats">Повна статистика →</a></div>
        <div class="chart"><svg id="chart-svg" role="img" aria-label="Відвідувачі по днях"></svg><div class="tip" id="tip"></div></div>
      </div>
      <div class="panel">
        <h2>Звідки приходять</h2><p class="sub">Відвідувачі за джерелом</p><div class="bars" id="sources"></div>
        <h2 style="margin-top:22px">Пристрої</h2><p class="sub">Частка відвідувачів</p><div class="bars" id="devices"></div>
      </div>
    </div>
    <div class="panel">
      <div class="panel-head"><div><h2>Нові заявки на зворотний дзвінок</h2><p class="sub">З кнопки дзвінка на сайті. Кожна нова заявка також приходить на email / Telegram.</p></div><a href="#callbacks">Усі заявки →</a></div>
      ${callbackTable(CALLBACKS.slice(0, 4))}
    </div>
    <div class="grid2b">
      <div class="panel">
        <div class="panel-head"><div><h2>Популярні товари</h2><p class="sub">Що найбільше цікавить покупців</p></div><a href="#products">Усі →</a></div>
        <table><thead><tr><th>Товар</th><th class="num">Перегляди</th><th class="num">♡ Обране</th><th class="num">⇄ Порівн.</th></tr></thead><tbody>
        ${[["g0", 412, 38, 21], ["k1", 356, 29, 33], ["p1", 298, 24, 17], ["p2", 241, 19, 8], ["k2", 203, 15, 14]].map(([id, v, f, c]) =>
          `<tr class="click" data-href="#product/${id}"><td><div class="prod"><img src="img/${id}.jpg" alt=""><div>${PRODUCTS[id].name}<small>${PRODUCTS[id].sku}</small></div></div></td><td class="num">${v}</td><td class="num">${f}</td><td class="num">${c}</td></tr>`).join("")}
        </tbody></table>
      </div>
      <div class="panel">
        <h2>Стан каталогу</h2><p class="sub">Реальні цифри з вашого CSV. Натисніть, щоб відкрити список.</p>
        <div class="health">
          <a href="#products"><span class="n bad">1 146</span>Без українського перекладу<span>→ автопереклад</span></a>
          <a href="#products"><span class="n warn">657</span>Фото меншого розміру за 600 px<span>→</span></a>
          <a href="#products"><span class="n warn">273</span>Без опису<span>→ AI-опис</span></a>
          <a href="#products"><span class="n warn">241</span>Немає в наявності<span>→</span></a>
          <a href="#products"><span class="n warn">160</span>Без артикулу<span>→</span></a>
          <a href="#brands"><span class="n warn">138</span>Без бренду<span>→</span></a>
          <a href="#products"><span class="n ok">0</span>Без фото<span>✓</span></a>
        </div>
      </div>
    </div>
    <div class="grid2b">
      <div class="panel">
        <h2>Шукали, але не знайшли</h2><p class="sub">Пошукові запити без результатів — підказка, які товари додати або як перейменувати</p>
        <div class="chips"><span>сотейник<b>14</b></span><span>казан 12 л<b>9</b></span><span>сковорода гриль<b>7</b></span><span>термос 0,5<b>6</b></span><span>кавоварка рожкова<b>5</b></span><span>KB-2100<b>4</b></span><span>набір ножів 6 пр<b>3</b></span><span>пароварка<b>3</b></span></div>
      </div>
      <div class="panel">
        <div class="panel-head"><div><h2>Налаштування сайту</h2><p class="sub">Головні перемикачі</p></div><a href="#settings">Змінити →</a></div>
        <div class="status">
          <div>Показувати ціни<span class="pill grey">Вимкнено</span></div>
          <div>Оголошення (попап)<span class="pill done">Увімкнено</span></div>
          <div>Мови сайту<span>UA (основна) · EN · RU</span></div>
        </div>
      </div>
    </div>`,
  init() {
    $$("#range button").forEach((b) => b.addEventListener("click", () => {
      $$("#range button").forEach((x) => x.classList.toggle("on", x === b));
      drawDashboard(+b.dataset.range);
    }));
    drawDashboard(30);
  },
};

function callbackTable(list) {
  return `<table><thead><tr><th>Ім'я</th><th>Телефон</th><th>Коли</th><th>Звідки</th><th>Статус</th><th></th></tr></thead><tbody>
    ${list.map((c) => {
      const i = CALLBACKS.indexOf(c);
      return `<tr><td>${c.name}</td><td><a class="phone" href="tel:${c.phone.replace(/[^+\d]/g, "")}">${c.phone}</a></td><td>${c.when}</td><td>${c.page}</td>
        <td>${c.done ? '<span class="pill done">✓ Оброблено</span>' : '<span class="pill new">● Нова</span>'}</td>
        <td>${c.done ? "" : `<button class="act" data-done="${i}">Оброблено</button>`}</td></tr>`;
    }).join("") || '<tr><td colspan="6" class="muted">Немає заявок</td></tr>'}
  </tbody></table>`;
}

VIEWS.products = {
  title: "Товари",
  html: () => `
    <div class="head">
      <div><h1>Товари</h1><p>1 146 товарів у каталозі · у прототипі показано ${Object.keys(PRODUCTS).length}</p></div>
      <div class="actions"><button class="btn ghost" data-toast="Імпорт: оберіть CSV-файл (наприклад, новий експорт)">⇪ Імпорт CSV</button><a class="btn" href="#product/new">+ Додати товар</a></div>
    </div>
    <div class="panel">
      <div class="filters">
        <input class="input" type="search" id="f-q" placeholder="Пошук за назвою або артикулом">
        <select class="input" id="f-brand"><option value="">Усі бренди</option><option>Benson</option><option>Kingberg</option></select>
        <select class="input" id="f-cat"><option value="">Усі категорії</option><option>Посуд</option><option>Побутова техніка</option></select>
        <select class="input" id="f-stock"><option value="">Будь-яка наявність</option><option value="in">В наявності</option><option value="out">Немає в наявності</option></select>
      </div>
      <div class="bulk" id="bulk" hidden><b id="bulk-n"></b>
        <button class="btn sm ai" data-bulk="Переклад на UA та EN запущено">✨ Перекласти UA / EN</button>
        <button class="btn sm ai" data-bulk="AI-описи генеруються — перевірте їх перед публікацією">✨ Згенерувати AI-опис</button>
        <button class="btn sm ghost" data-bulk="Позначено: немає в наявності">Немає в наявності</button>
        <button class="btn sm ghost" data-bulk="Приховано з сайту">Сховати з сайту</button>
      </div>
      <table><thead><tr><th><input type="checkbox" id="pick-all" aria-label="Вибрати всі"></th><th>Товар</th><th>Бренд</th><th>Категорія</th><th>Наявність</th><th>Переклад</th><th>На сайті</th></tr></thead>
      <tbody id="rows"></tbody></table>
      <div class="pager"><span id="shown"></span><div><span>‹</span><span class="on">1</span><span>2</span><span>3</span><span>…</span><span>48</span><span>›</span></div></div>
    </div>`,
  init() {
    const ids = Object.keys(PRODUCTS);
    const render = () => {
      const q = $("#f-q").value.toLowerCase(), brand = $("#f-brand").value, cat = $("#f-cat").value, stock = $("#f-stock").value;
      const list = ids.filter((id) => {
        const p = PRODUCTS[id];
        return (!q || (p.name + " " + p.sku).toLowerCase().includes(q)) && (!brand || brandOf(p) === brand)
          && (!cat || catOf(id) === cat) && (!stock || (stock === "out") === !!p.out);
      });
      $("#rows").innerHTML = list.map((id, i) => {
        const p = PRODUCTS[id];
        const tr = i % 3 === 0 ? '<span class="pill good">UA · EN · RU</span>' : '<span class="pill warn">немає EN</span>';
        return `<tr class="click" data-href="#product/${id}">
          <td><input type="checkbox" class="pick" aria-label="Вибрати"></td>
          <td><div class="prod"><img src="img/${id}.jpg" alt=""><div>${p.name}<small>${p.sku}</small></div></div></td>
          <td>${brandOf(p)}</td><td>${catOf(id)}</td>
          <td>${p.out ? '<span class="pill bad">Немає</span>' : '<span class="pill good">В наявності</span>'}</td>
          <td>${tr}</td><td>${sw(true, 'aria-label="Показувати на сайті"')}</td></tr>`;
      }).join("") || '<tr><td colspan="7" class="muted">Нічого не знайдено</td></tr>';
      $("#shown").textContent = `Показано ${list.length} із 1 146`;
      updateBulk();
    };
    const updateBulk = () => {
      const n = $$(".pick:checked").length;
      $("#bulk").hidden = !n;
      $("#bulk-n").textContent = `Вибрано: ${n}`;
    };
    ["#f-q", "#f-brand", "#f-cat", "#f-stock"].forEach((s) => $(s).addEventListener("input", render));
    $("#pick-all").addEventListener("change", (e) => { $$(".pick").forEach((c) => (c.checked = e.target.checked)); updateBulk(); });
    $("#rows").addEventListener("change", (e) => e.target.matches(".pick") && updateBulk());
    const q = sessionStorage.getItem("q");
    if (q) { $("#f-q").value = q; sessionStorage.removeItem("q"); }
    render();
  },
};

VIEWS.product = {
  title: "Товар",
  html: (id) => {
    const isNew = !PRODUCTS[id];
    const p = PRODUCTS[id] || { sku: "", name: "", specs: {}, price: null };
    const photos = isNew ? [] : id === "g0" ? [0, 1, 2, 3, 4, 5, 6].map((n) => `img/g${n}.jpg`) : [`img/${id}.jpg`];
    const pane = (l) => `<div class="tab-pane" data-lang="${l}" ${l === "uk" ? "" : "hidden"}>
        <div class="field"><label>Назва</label><input class="name" value="${l === "uk" ? esc(p.name) : ""}" placeholder="${l === "uk" ? "Назва товару" : "Ще не перекладено"}"></div>
        <div class="field"><label>Короткий опис</label><textarea rows="2"></textarea></div>
        <div class="field"><label>Опис</label><textarea rows="7" class="desc" placeholder="Напишіть опис або натисніть «Згенерувати AI-опис»"></textarea></div>
        ${l === "uk" ? "" : `<button class="btn sm ghost" data-translate="${l}">↻ Перекласти автоматично з української</button>`}
      </div>`;
    return `
    <div class="crumbs"><a href="#products">Товари</a> / ${isNew ? "Новий товар" : p.sku}</div>
    <div class="head">
      <div><h1>${isNew ? "Новий товар" : p.name}</h1>${isNew ? "" : `<p>Артикул ${p.sku} · ${brandOf(p)}</p>`}</div>
      <div class="actions">${isNew ? "" : '<a class="btn ghost" href="product.html" target="_blank">Переглянути на сайті ↗</a>'}</div>
    </div>
    <div class="grid-form">
      <div>
        <div class="panel">
          <div class="panel-head"><h2>Назва та опис</h2><button class="btn sm ai" data-ai>✨ Згенерувати AI-опис</button></div>
          <p class="sub">Точка біля мови: зелена — заповнено, червона — немає перекладу</p>
          ${langTabs({ uk: !isNew, en: false, ru: !isNew })}
          ${LANGS.map(([l]) => pane(l)).join("")}
        </div>
        <div class="panel">
          <h2>Фото</h2><p class="sub">Перетягніть, щоб змінити порядок. Перше фото — головне. Водяний знак BENSON.COM.UA додається автоматично.</p>
          <div class="photos">
            ${photos.map((src, i) => `<div class="ph ${i ? "" : "main"}"><img src="${src}" alt=""></div>`).join("")}
            <label class="upload"><input type="file" accept="image/*" multiple hidden data-upload>＋<br>Додати фото<br><small>або перетягніть сюди</small></label>
          </div>
        </div>
        <div class="panel">
          <h2>Характеристики</h2><p class="sub">Показуються на сторінці товару та в порівнянні товарів</p>
          <div id="specs">${Object.entries(p.specs).map(([k, v]) => specRow(k, v)).join("") || specRow("", "")}</div>
          <button class="btn sm ghost" data-add-spec>+ Додати характеристику</button>
        </div>
      </div>
      <div>
        <div class="panel">
          <h2>Публікація</h2>
          <div class="switch-row"><div><b>Показувати на сайті</b><small>Вимкніть, щоб сховати товар</small></div>${sw(true)}</div>
          <div class="switch-row"><div><b>В наявності</b></div>${sw(!p.out)}</div>
          <div class="switch-row"><div><b>Новинка</b><small>Бейдж і блок «Новинки»</small></div>${sw(!isNew && id[0] !== "a")}</div>
          <div class="switch-row"><div><b>Акція</b><small>Блок «Акції» на головній</small></div>${sw(!isNew && id[0] === "a")}</div>
        </div>
        <div class="panel">
          <h2>Основне</h2>
          <div class="field"><label>Артикул</label><input value="${esc(p.sku)}" placeholder="BN-000"></div>
          <div class="field"><label>Бренд</label><select>${["Benson", "Kingberg", "— без бренду —"].map((b) => `<option ${!isNew && brandOf(p) === b ? "selected" : ""}>${b}</option>`).join("")}</select></div>
          <div class="field"><label>Категорії</label><div class="chips">${isNew ? "" : `<span>${catOf(id)} ✕</span>`}<span>+ додати</span></div></div>
        </div>
        <div class="panel">
          <h2>Ціни</h2><p class="sub">Зараз ціни <b>приховані</b> на сайті. Увімкнути: Налаштування сайту → Показувати ціни.</p>
          <div class="row2">
            <div class="field"><label>Оптова, $</label><input type="number" step="0.01" value="${p.price ?? ""}"></div>
            <div class="field"><label>Дрібний опт, $</label><input type="number" step="0.01" value="${p.price ? (p.price * 1.08).toFixed(2) : ""}"></div>
          </div>
          ${p.old ? `<div class="field"><label>Стара ціна (для акції), $</label><input type="number" step="0.01" value="${p.old}"></div>` : ""}
        </div>
      </div>
    </div>
    ${savebar("#products")}`;
  },
};
const specRow = (k, v) => `<div class="spec-row"><input class="input" value="${esc(k)}" placeholder="Назва, напр. Матеріал"><input class="input" value="${esc(v)}" placeholder="Значення"><button class="x" data-del-spec aria-label="Видалити">×</button></div>`;

VIEWS.categories = {
  title: "Категорії",
  html: () => `
    <div class="head"><div><h1>Категорії</h1><p>Перетягніть ⋮⋮, щоб змінити порядок у меню сайту</p></div>
      <div class="actions"><button class="btn" data-toast="Нова категорія створена">+ Додати категорію</button></div></div>
    <div class="panel tree" style="padding:6px 8px">
      ${CATEGORIES.map(([name, n, kids]) => `
        <div class="cat"><span class="handle">⋮⋮</span><span class="name">${name}</span><span class="pill grey">${fmt(n)} товарів</span>${sw(true, 'aria-label="Показувати"')}<button class="act" data-toast="Відкрито редагування «${name}»">Змінити</button></div>
        ${kids.map(([k, c]) => `<div class="cat child"><span class="handle">⋮⋮</span><span class="name">${k}</span><span class="pill grey">${c} товарів</span>${sw(true, 'aria-label="Показувати"')}<button class="act" data-toast="Відкрито редагування «${k}»">Змінити</button></div>`).join("")}`).join("")}
    </div>`,
};

VIEWS.brands = {
  title: "Бренди",
  html: () => `
    <div class="head"><div><h1>Бренди</h1><p>Логотипи показуються в шапці, на банерах і на картках товарів</p></div></div>
    <div class="brand-cards">
      ${[["Benson", "img/benson-logo.png", "", 968, "Посуд і кухонні аксесуари"], ["Kingberg", "img/kingberg-logo.jpg", "dark", 40, "Побутова техніка"]].map(([name, logo, cls, n, desc]) => `
      <div class="panel brand-card">
        <div class="logo-box ${cls}"><img src="${logo}" alt="${name}"></div>
        <div class="row2"><div class="field"><label>Назва</label><input value="${name}"></div><div class="field"><label>Адреса (slug)</label><input value="${name.toLowerCase()}"></div></div>
        <div class="field"><label>Короткий опис</label><input value="${desc}"></div>
        <div style="display:flex;gap:8px;align-items:center"><button class="btn sm ghost" data-toast="Оберіть файл логотипу (SVG або PNG)">Замінити логотип</button><a class="btn sm ghost" href="#products">${n} товарів →</a></div>
      </div>`).join("")}
    </div>
    <div class="panel" style="display:flex;justify-content:space-between;align-items:center;gap:12px">
      <div><h2>138 товарів без бренду</h2><p class="sub" style="margin:0">Бренд не вдалося визначити автоматично (немає артикулу BN- / KB-)</p></div>
      <a class="btn" href="#products">Призначити бренд →</a>
    </div>
    ${savebar("#dashboard")}`,
};

VIEWS.callbacks = {
  title: "Заявки на дзвінок",
  html: () => `
    <div class="head"><div><h1>Заявки на зворотний дзвінок</h1><p>Нова заявка також одразу приходить на email / Telegram <span class="demo">демо-заявки</span></p></div>
      <div class="seg" id="cb-filter"><button class="on" data-f="new">Нові</button><button data-f="done">Оброблені</button><button data-f="all">Усі</button></div></div>
    <div class="panel" id="cb-table"></div>`,
  init() {
    const show = (f) => ($("#cb-table").innerHTML = callbackTable(CALLBACKS.filter((c) => f === "all" || (f === "done") === c.done)));
    $$("#cb-filter button").forEach((b) => b.addEventListener("click", () => {
      $$("#cb-filter button").forEach((x) => x.classList.toggle("on", x === b));
      show(b.dataset.f);
    }));
    show("new");
  },
};

// Homepage builder: drag to reorder, switch on/off, rename, choose layout + products.
// Real site: a HomeSection model (order, enabled, title per language, layout, source) shown in the admin
// with drag-and-drop ordering; the homepage template loops over enabled sections in order.
const HOME_SECTIONS = [
  { title: "Банери брендів", layout: "Банери", source: "Benson + Kingberg", on: true },
  { title: "Новинки посуду", layout: "Карусель", source: "Новинки · Посуд", on: true },
  { title: "Підбірка цікавих товарів", layout: "Плитка (1 велика + 4)", source: "Вибрані вручну (будь-які бренди)", on: true },
  { title: "Акції", layout: "Акції з вкладками", source: "Акції · Посуд / Техніка", on: true },
  { title: "Наші бренди", layout: "Стрічка логотипів", source: "Усі бренди", on: true },
  { title: "Хіти продажів", layout: "Сітка", source: "Вибрані вручну", on: false },
];
const LAYOUTS = ["Карусель", "Сітка", "Плитка (1 велика + 4)", "Акції з вкладками", "Банери", "Стрічка логотипів"];
VIEWS.homepage = {
  title: "Головна сторінка",
  html: () => `
    <div class="head"><div><h1>Головна сторінка</h1><p>Порядок і вигляд блоків на головній. Перетягніть ⋮⋮, щоб змінити порядок.</p></div>
      <div class="actions"><button class="btn ghost" data-toast="Новий блок додано в кінець списку">+ Додати блок</button><a class="btn ghost" href="index.html" target="_blank">Переглянути головну ↗</a></div></div>
    <div class="panel tree" id="home-list" style="padding:6px 8px">
      ${HOME_SECTIONS.map((s, i) => `
        <div class="cat home-sec" draggable="true" data-i="${i}">
          <span class="handle" title="Перетягніть">⋮⋮</span>
          <span class="pos">${i + 1}</span>
          <input class="input name" value="${esc(s.title)}" aria-label="Назва блоку" style="max-width:240px">
          <select class="input" aria-label="Вигляд">${LAYOUTS.map((l) => `<option ${l === s.layout ? "selected" : ""}>${l}</option>`).join("")}</select>
          <span class="muted" style="flex:1">${s.source}</span>
          ${sw(s.on, 'aria-label="Показувати"')}
        </div>`).join("")}
    </div>
    <p class="hint">Назви блоків перекладаються як і решта сайту (UA / EN / RU). Вимкнений блок зберігається, але не показується.</p>
    ${savebar("#dashboard")}`,
  init() {
    const list = $("#home-list");
    let dragged = null;
    const renumber = () => $$(".home-sec .pos", list).forEach((el, i) => (el.textContent = i + 1));
    list.addEventListener("dragstart", (e) => { dragged = e.target.closest(".home-sec"); dragged.classList.add("dragging"); });
    list.addEventListener("dragend", () => { dragged?.classList.remove("dragging"); dragged = null; renumber(); });
    list.addEventListener("dragover", (e) => {
      e.preventDefault();
      const over = e.target.closest(".home-sec");
      if (!over || over === dragged) return;
      const after = e.clientY > over.getBoundingClientRect().top + over.offsetHeight / 2;
      over[after ? "after" : "before"](dragged);
    });
  },
};

VIEWS.pages = {
  title: "Сторінки",
  html: () => `
    <div class="head"><div><h1>Сторінки</h1><p>Інформаційні сторінки у верхньому меню та футері</p></div>
      <div class="actions"><button class="btn" data-toast="Нова сторінка створена">+ Додати сторінку</button></div></div>
    <div class="panel"><table><thead><tr><th>Назва</th><th>Адреса</th><th class="num">Порядок у меню</th><th>Переклад</th><th>Опубліковано</th></tr></thead><tbody>
      ${PAGES.map((p, i) => `<tr class="click" data-href="#page/${i}"><td><b>${p.title}</b></td><td class="muted">${p.slug}</td><td class="num">${p.order}</td><td><span class="pill warn">немає EN</span></td><td>${sw(true, 'aria-label="Опубліковано"')}</td></tr>`).join("")}
    </tbody></table></div>`,
};

VIEWS.page = {
  title: "Сторінка",
  html: (i) => {
    const p = PAGES[i] || PAGES[0];
    return `
    <div class="crumbs"><a href="#pages">Сторінки</a> / ${p.title}</div>
    <div class="head"><div><h1>${p.title}</h1><p>${p.slug}</p></div></div>
    <div class="grid-form">
      <div class="panel">
        ${langTabs({ uk: true, en: false, ru: false })}
        ${LANGS.map(([l]) => `<div class="tab-pane" data-lang="${l}" ${l === "uk" ? "" : "hidden"}>
          <div class="field"><label>Заголовок</label><input value="${l === "uk" ? p.title : ""}" placeholder="Ще не перекладено"></div>
          <div class="field"><label>Текст сторінки</label>${toolbar}<div class="editor" contenteditable="true">${l === "uk" ? p.body : ""}</div></div>
          ${l === "uk" ? "" : `<button class="btn sm ghost" data-translate="${l}">↻ Перекласти автоматично з української</button>`}
        </div>`).join("")}
      </div>
      <div class="panel">
        <h2>Публікація</h2>
        <div class="switch-row"><div><b>Опубліковано</b></div>${sw(true)}</div>
        <div class="switch-row"><div><b>Показувати в меню</b></div>${sw(true)}</div>
        <div class="field" style="margin-top:12px"><label>Адреса (slug)</label><input value="${p.slug}"></div>
        <div class="field"><label>Порядок у меню</label><input type="number" value="${p.order}"></div>
      </div>
    </div>
    ${savebar("#pages")}`;
  },
};

VIEWS.announcement = {
  title: "Оголошення",
  html: () => `
    <div class="head"><div><h1>Оголошення (попап)</h1><p>Вікно, яке відвідувач бачить при вході на сайт</p></div></div>
    <div class="grid-form" style="grid-template-columns:1fr 1fr">
      <div class="panel">
        <div class="switch-row"><div><b>Показувати оголошення</b><small>Вимкніть, щоб прибрати попап з сайту</small></div>${sw(true, 'id="ann-on"')}</div>
        <div class="switch-row"><div><b>Колір шапки</b></div><div class="seg" id="ann-color"><button class="on" data-c="brand">Фірмовий</button><button data-c="yellow">Жовтий</button></div></div>
        <div class="field" style="margin-top:12px"><label>Як часто показувати</label>
          <select><option>Один раз — і знову, коли текст зміниться</option><option>Щоразу при вході на сайт</option><option>Один раз на день</option></select></div>
        ${langTabs({ uk: true, en: false, ru: false })}
        ${LANGS.map(([l]) => `<div class="tab-pane" data-lang="${l}" ${l === "uk" ? "" : "hidden"}>
          <div class="field"><label>Заголовок</label><input ${l === "uk" ? 'id="ann-title"' : ""} value="${l === "uk" ? "Привіт! Я Бенсі 👋" : ""}" placeholder="Ще не перекладено"></div>
          <div class="field"><label>Текст</label>${toolbar}<div class="editor" contenteditable="true" ${l === "uk" ? 'id="ann-text"' : ""}>${l === "uk" ? "<p><b>Працюємо тільки з оптовими покупцями.</b> Мінімальне замовлення — уточнюйте у менеджера.</p><p>Робочі години: Пн–Сб 08:00–17:00. Замовлення до 14:00 відправляємо наступного дня.</p>" : ""}</div></div>
        </div>`).join("")}
      </div>
      <div class="panel">
        <h2>Попередній перегляд</h2><p class="sub">Так оголошення виглядатиме на сайті — оновлюється, поки ви пишете</p>
        <div class="preview-wrap"><div class="ann" id="ann-preview">
          <div class="ann-head"><h3 id="pv-title"></h3></div>
          <div class="ann-body"><div id="pv-text"></div><button class="btn">Зрозуміло</button></div>
        </div></div>
        <p class="hint" id="ann-off" hidden>Оголошення вимкнено — відвідувачі його не побачать.</p>
      </div>
    </div>
    ${savebar("#dashboard")}`,
  init() {
    const sync = () => {
      $("#pv-title").textContent = $("#ann-title").value;
      $("#pv-text").innerHTML = $("#ann-text").innerHTML;
      const on = $("#ann-on").checked;
      $("#ann-preview").style.opacity = on ? 1 : 0.35;
      $("#ann-off").hidden = on;
    };
    ["#ann-title", "#ann-text", "#ann-on"].forEach((s) => $(s).addEventListener("input", sync));
    $("#ann-on").addEventListener("change", sync);
    $$("#ann-color button").forEach((b) => b.addEventListener("click", () => {
      $$("#ann-color button").forEach((x) => x.classList.toggle("on", x === b));
      $("#ann-preview .ann-head").classList.toggle("yellow", b.dataset.c === "yellow");
    }));
    sync();
  },
};

VIEWS.settings = {
  title: "Налаштування сайту",
  html: () => `
    <div class="head"><div><h1>Налаштування сайту</h1><p>Загальні параметри, які діють на всьому сайті</p></div></div>
    <div class="grid2b">
      <div>
        <div class="panel">
          <h2>Ціни</h2>
          <div class="switch-row"><div><b>Показувати ціни на сайті</b><small>Поки вимкнено — сайт працює як каталог: «Ціна за запитом»</small></div>${sw(false)}</div>
          <div class="row2" style="margin-top:12px">
            <div class="field"><label>Валюта</label><select><option>USD ($)</option><option>UAH (₴)</option><option>EUR (€)</option></select></div>
            <div class="field"><label>Хто бачить ціни</label><select><option>Усі відвідувачі</option><option disabled>Лише оптові клієнти (пізніше)</option></select></div>
          </div>
        </div>
        <div class="panel">
          <h2>Контакти</h2><p class="sub">Показуються в шапці, футері та в кнопці дзвінка</p>
          <div class="field"><label>Телефони</label><textarea rows="2">+38 (098) 367-84-36
+38 (066) 012-35-51</textarea><small>Кожен номер з нового рядка</small></div>
          <div class="row2"><div class="field"><label>Номер Viber</label><input value="+38 (098) 367-84-36"></div><div class="field"><label>Email</label><input value="bensonukraine@gmail.com"></div></div>
          <div class="field"><label>Робочі години</label><input value="Пн–Сб 08:00–17:00"></div>
          <div class="field"><label>Адреса</label><input placeholder="Місто, вулиця, склад…"></div>
        </div>
      </div>
      <div>
        <div class="panel">
          <h2>Сповіщення про нові заявки</h2>
          <div class="field"><label>Email для заявок</label><input value="bensonukraine@gmail.com"></div>
          <div class="switch-row"><div><b>Дублювати в Telegram</b><small>Миттєве повідомлення в чат менеджера</small></div>${sw(true)}</div>
          <div class="field" style="margin-top:12px"><label>Telegram чат</label><input placeholder="@benson_manager або ID чату"></div>
        </div>
        <div class="panel">
          <h2>Фото товарів</h2>
          <div class="field"><label>Текст водяного знака</label><input value="BENSON.COM.UA"></div>
          <div class="field"><label>Прозорість водяного знака: <span id="wm-v">43</span>%</label><input type="range" min="10" max="80" value="43" id="wm" style="padding:0"></div>
          <button class="btn sm ghost" data-toast="Фото перегенеровуються з оригіналів (~2 хв)">↻ Застосувати до всіх фото</button>
        </div>
        <div class="panel">
          <h2>Мови</h2>
          <div class="switch-row"><div><b>Українська</b><small>Основна мова сайту</small></div>${sw(true, "disabled")}</div>
          <div class="switch-row"><div><b>English</b></div>${sw(true)}</div>
          <div class="switch-row"><div><b>Русский</b></div>${sw(true)}</div>
        </div>
      </div>
    </div>
    ${savebar("#dashboard")}`,
  init() { $("#wm").addEventListener("input", (e) => ($("#wm-v").textContent = e.target.value)); },
};

VIEWS.stats = {
  title: "Повна статистика",
  html: () => `
    <div class="head"><div><h1>Повна статистика</h1><p>На реальному сайті — Umami (без cookies) <span class="demo">демо-дані</span></p></div>
      <div class="actions"><button class="btn ghost" data-toast="На сайті відкриється Umami у новій вкладці">Відкрити Umami ↗</button></div></div>
    <div class="kpis">
      <div class="panel kpi"><div class="label">Зараз на сайті</div><div class="value"><span style="color:var(--good)">●</span> 7</div><div class="delta muted">оновлюється в реальному часі</div></div>
      <div class="panel kpi"><div class="label">Відвідувачі сьогодні</div><div class="value">128</div><div class="delta up">▲ 12% до вчора</div></div>
      <div class="panel kpi"><div class="label">Середній час на сайті</div><div class="value">2:41</div><div class="delta up">▲ 0:18</div></div>
      <div class="panel kpi"><div class="label">Відмови</div><div class="value">38%</div><div class="delta up">▼ 3% (краще)</div></div>
    </div>
    <div class="grid2b">
      <div class="panel"><h2>Популярні сторінки</h2><p class="sub">За останні 30 днів</p>
        <table><thead><tr><th>Сторінка</th><th class="num">Перегляди</th></tr></thead><tbody>
          ${[["/", 3120], ["/catalog/kastruli/", 1406], ["/product/bn-203/", 412], ["/catalog/skovorody/", 398], ["/product/kb-2001/", 356], ["/delivery/", 211], ["/contacts/", 187]].map(([u, v]) => `<tr><td>${u}</td><td class="num">${fmt(v)}</td></tr>`).join("")}
        </tbody></table></div>
      <div class="panel"><h2>Країни</h2><p class="sub">Частка відвідувачів</p><div class="bars">
          ${[["Україна", 91], ["Польща", 3], ["Молдова", 2], ["Німеччина", 2], ["Інші", 2]].map(([c, v]) => `<div class="bar-row"><span>${c}</span><div class="track"><div class="fill" style="width:${v / 0.91}%"></div></div><span class="v">${v}%</span></div>`).join("")}
        </div>
        <h2 style="margin-top:22px">Мова сайту</h2><p class="sub">Яку версію відкривають</p><div class="bars">
          ${[["Українська", 72], ["Русский", 24], ["English", 4]].map(([c, v]) => `<div class="bar-row"><span>${c}</span><div class="track"><div class="fill" style="width:${v / 0.72}%"></div></div><span class="v">${v}%</span></div>`).join("")}
        </div></div>
    </div>`,
};

VIEWS.users = {
  title: "Користувачі",
  html: () => `
    <div class="head"><div><h1>Користувачі</h1><p>Хто має доступ до панелі керування</p></div>
      <div class="actions"><button class="btn" data-toast="Запрошення надіслано на email">+ Запросити користувача</button></div></div>
    <div class="panel"><table><thead><tr><th>Користувач</th><th>Роль</th><th>Двофакторний вхід</th><th>Останній вхід</th><th></th></tr></thead><tbody>
      ${[["А", "Адміністратор", "admin@benson.com.ua", "Адміністратор", true, "щойно"], ["М", "Менеджер", "manager@benson.com.ua", "Менеджер", true, "сьогодні, 09:02"], ["К", "Контент-менеджер", "content@benson.com.ua", "Контент", false, "3 дні тому"]].map(([a, n, e, r, tfa, last]) =>
        `<tr><td><div class="prod"><div class="avatar">${a}</div><div>${n}<small>${e}</small></div></div></td><td><span class="pill grey">${r}</span></td>
         <td>${tfa ? '<span class="pill good">✓ Увімкнено</span>' : '<span class="pill warn">Не налаштовано</span>'}</td><td>${last}</td><td><button class="act" data-toast="Відкрито редагування користувача">Змінити</button></td></tr>`).join("")}
    </tbody></table></div>
    <div class="panel"><h2>Ролі</h2><p class="sub">Що може кожна роль</p>
      <div class="status">
        <div><b>Адміністратор</b><span>Усе, включно з налаштуваннями сайту та користувачами</span></div>
        <div><b>Менеджер</b><span>Товари, категорії, заявки, сторінки, оголошення</span></div>
        <div><b>Контент</b><span>Лише товари та сторінки (без цін і налаштувань)</span></div>
      </div></div>`,
};

// ---------- dashboard chart (DEMO data, deterministic) ----------
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const SERIES = Array.from({ length: 90 }, (_, i) => {
  const d = new Date(2026, 10, 21); d.setDate(d.getDate() - (89 - i));
  const week = d.getDay() === 0 ? 0.55 : d.getDay() === 6 ? 0.8 : 1;
  return { date: d, v: Math.round((60 + i * 0.9) * week * (0.85 + rand() * 0.3)) };
});
function drawDashboard(n) {
  const data = SERIES.slice(-n);
  const W = 760, H = 340, L = 40, R = 12, T = 12, B = 28;
  const max = Math.ceil(Math.max(...data.map((d) => d.v)) / 50) * 50;
  const x = (i) => L + (i * (W - L - R)) / (data.length - 1);
  const y = (v) => T + (H - T - B) * (1 - v / max);
  const pts = data.map((d, i) => `${x(i).toFixed(1)},${y(d.v).toFixed(1)}`);
  const ticks = [0, max / 2, max], every = Math.ceil(data.length / 6);
  const label = (d) => d.toLocaleDateString("uk-UA", { day: "numeric", month: "short" });
  const svg = $("#chart-svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.innerHTML = `<defs><linearGradient id="fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#aa1f7a" stop-opacity=".18"/><stop offset="1" stop-color="#aa1f7a" stop-opacity="0"/></linearGradient></defs>
    <g class="grid">${ticks.map((t) => `<line x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}"/>`).join("")}</g>
    <g class="axis">${ticks.map((t) => `<text x="${L - 8}" y="${y(t) + 4}" text-anchor="end">${t}</text>`).join("")}
      ${data.map((d, i) => (i % every === 0 || i === data.length - 1) ? `<text x="${x(i)}" y="${H - 6}" text-anchor="middle">${label(d.date)}</text>` : "").join("")}</g>
    <path d="M${pts[0]} L${pts.join(" L")} L${x(data.length - 1)},${y(0)} L${x(0)},${y(0)}Z" fill="url(#fill)"/>
    <polyline points="${pts.join(" ")}" fill="none" stroke="#aa1f7a" stroke-width="2" stroke-linejoin="round"/>
    <line id="cross" y1="${T}" y2="${H - B}" stroke="#1f1f24" stroke-opacity=".25" visibility="hidden"/>
    <circle id="dot" r="5" fill="#aa1f7a" stroke="#fff" stroke-width="2" visibility="hidden"/>
    <rect id="hit" x="${L}" y="${T}" width="${W - L - R}" height="${H - T - B}" fill="transparent"/>`;
  const tip = $("#tip"), cross = $("#cross"), dot = $("#dot");
  $("#hit").onmousemove = (e) => {
    const box = svg.getBoundingClientRect();
    const sx = ((e.clientX - box.left) / box.width) * W;
    const i = Math.max(0, Math.min(data.length - 1, Math.round(((sx - L) / (W - L - R)) * (data.length - 1))));
    const px = x(i), py = y(data[i].v);
    cross.setAttribute("x1", px); cross.setAttribute("x2", px); cross.setAttribute("visibility", "visible");
    dot.setAttribute("cx", px); dot.setAttribute("cy", py); dot.setAttribute("visibility", "visible");
    tip.innerHTML = `${data[i].date.toLocaleDateString("uk-UA", { weekday: "short", day: "numeric", month: "long" })}<b>${fmt(data[i].v)} відвідувачів</b>`;
    tip.style.left = (px / W) * box.width + "px"; tip.style.top = (py / H) * box.height + "px"; tip.style.opacity = 1;
  };
  $("#hit").onmouseleave = () => { tip.style.opacity = 0; cross.setAttribute("visibility", "hidden"); dot.setAttribute("visibility", "hidden"); };

  const sum = (a) => a.reduce((s, d) => s + d.v, 0);
  const cur = sum(data), prev = sum(SERIES.slice(-2 * n, -n)) || cur;
  const pct = Math.round(((cur - prev) / prev) * 100);
  const delta = (id, p) => { $(id).textContent = `${p >= 0 ? "▲" : "▼"} ${Math.abs(p)}% до попереднього періоду`; $(id).className = "delta " + (p >= 0 ? "up" : "down"); };
  $("#k-visitors").textContent = fmt(cur); delta("#k-visitors-d", pct);
  $("#k-views").textContent = fmt(Math.round(cur * 3.4)); delta("#k-views-d", pct + 4);
  $("#k-calls").textContent = fmt(Math.round(cur / 95)); delta("#k-calls-d", pct - 6);
  $("#chart-sub").textContent = `Останні ${n} днів · у середньому ${fmt(Math.round(cur / n))} на день`;
  const bars = (id, rows, suffix = "") => {
    const top = Math.max(...rows.map((r) => r[1]));
    $(id).innerHTML = rows.map(([name, v]) => `<div class="bar-row" title="${name}: ${fmt(v)}${suffix}"><span>${name}</span><div class="track"><div class="fill" style="width:${(v / top) * 100}%"></div></div><span class="v">${fmt(v)}${suffix}</span></div>`).join("");
  };
  bars("#sources", [["Google", .46], ["Прямі заходи", .24], ["Viber", .14], ["Facebook", .09], ["Instagram", .05], ["Інші", .02]].map(([s, f]) => [s, Math.round(cur * f)]));
  bars("#devices", [["Телефон", 68], ["Комп'ютер", 29], ["Планшет", 3]], "%");
}

// ---------- router ----------
function route() {
  const [name, arg] = (location.hash.slice(1) || "dashboard").split("/");
  const view = VIEWS[name] || VIEWS.dashboard;
  $("#view").innerHTML = view.html(arg);
  view.init?.(arg);
  const section = { product: "products", page: "pages" }[name] || (VIEWS[name] ? name : "dashboard");
  $$("aside nav a").forEach((a) => a.classList.toggle("on", a.getAttribute("href") === "#" + section));
  document.title = `${view.title} — Benson admin`;
  const n = pendingCalls();
  $("#nav-count").textContent = n;
  $("#nav-count").hidden = !n;
  window.scrollTo(0, 0);
}
addEventListener("hashchange", route);
route();

// ---------- shared interactions (event delegation) ----------
document.addEventListener("click", (e) => {
  const t = e.target;
  const row = t.closest("tr[data-href]");
  if (row && !t.closest("input, label, button, a")) { location.hash = row.dataset.href; return; }

  const tab = t.closest(".tabs button[data-lang]");
  if (tab) {
    const box = tab.closest(".panel");
    $$(".tabs button", box).forEach((b) => b.classList.toggle("on", b === tab));
    $$(".tab-pane", box).forEach((p) => (p.hidden = p.dataset.lang !== tab.dataset.lang));
    return;
  }
  const cmd = t.closest("[data-cmd]");
  if (cmd) {
    e.preventDefault();
    const arg = cmd.dataset.cmd === "createLink" ? prompt("Адреса посилання:", "https://") : null;
    document.execCommand(cmd.dataset.cmd, false, arg);
    return;
  }
  if (t.closest("[data-done]")) {
    CALLBACKS[t.closest("[data-done]").dataset.done].done = true;
    toast("Заявку позначено як оброблену");
    route(); return;
  }
  if (t.closest("[data-save]")) { toast("Збережено ✓"); $(".savebar .muted").textContent = "Усі зміни збережено"; return; }
  if (t.closest("[data-toast]")) { toast(t.closest("[data-toast]").dataset.toast); return; }
  if (t.closest("[data-bulk]")) { toast(`${t.closest("[data-bulk]").dataset.bulk} (${$$(".pick:checked").length} товарів)`); return; }
  if (t.closest("[data-add-spec]")) { $("#specs").insertAdjacentHTML("beforeend", specRow("", "")); $("#specs .spec-row:last-child input").focus(); return; }
  if (t.closest("[data-del-spec]")) { t.closest(".spec-row").remove(); return; }

  const ai = t.closest("[data-ai]");
  if (ai) {
    const pane = $(".tab-pane:not([hidden])");
    const name = $(".name", pane).value || $(".tab-pane[data-lang=uk] .name").value || "Товар";
    ai.disabled = true; ai.textContent = "✨ Генерую…";
    setTimeout(() => {
      $(".desc", pane).value = `${name} — надійний вибір для щоденного використання на кухні.\n\n` +
        "• Якісні матеріали, які довго служать\n• Зручний у користуванні та догляді\n• Підходить для дому, кафе та ресторанів\n\n" +
        "Оптові поставки по всій Україні. Ціни та наявність уточнюйте у менеджера.";
      ai.disabled = false; ai.textContent = "✨ Згенерувати AI-опис";
      toast("AI-опис згенеровано — перевірте його перед збереженням");
    }, 1200);
    return;
  }
  const tr = t.closest("[data-translate]");
  if (tr) {
    const box = tr.closest(".panel");
    tr.disabled = true; tr.textContent = "↻ Перекладаю…";
    setTimeout(() => {
      const src = $(".tab-pane[data-lang=uk] input", box).value;
      $(`.tab-pane[data-lang=${tr.dataset.translate}] input`, box).value = `[${tr.dataset.translate.toUpperCase()}] ${src}`;
      $(`.tabs button[data-lang=${tr.dataset.translate}] .dot`, box).classList.add("ok");
      tr.disabled = false; tr.textContent = "↻ Перекласти автоматично з української";
      toast("Перекладено автоматично — на реальному сайті тут буде повний переклад");
    }, 900);
  }
});

document.addEventListener("change", (e) => {
  if (e.target.matches("[data-upload]") && e.target.files.length) {
    const grid = e.target.closest(".photos");
    [...e.target.files].forEach((f) => {
      const ph = Object.assign(document.createElement("div"), { className: "ph" });
      ph.innerHTML = `<img src="${URL.createObjectURL(f)}" alt="">`;
      grid.insertBefore(ph, e.target.closest(".upload"));
    });
    toast(`Додано фото: ${e.target.files.length} — водяний знак буде додано автоматично`);
  }
});

// top search jumps to the product list, pre-filtered
$("#top-search").addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  sessionStorage.setItem("q", e.target.value);
  e.target.value = "";
  location.hash === "#products" ? route() : (location.hash = "#products");
});
