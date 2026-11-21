// Prototype product data. Real site: comes from the database via Django templates.
// price/old are DEMO values (only visible with the demo price toggle).
// specs are taken from the product names, so the comparison table has something real to show.
const PRODUCTS = {
  p1: { sku: "BN-832", name: "Сковорода з кришкою 28 см, антипригарне термоіндикаторне покриття", price: 9.8,
        specs: { "Матеріал": "Алюміній", "Покриття": "Антипригарне, термоіндикатор", "Діаметр": "28 см", "Кришка": "Так" } },
  p2: { sku: "BN-733", name: "Чайник зі свистком, нержавіюча сталь, 3 л", price: 6.4,
        specs: { "Матеріал": "Нержавіюча сталь", "Об'єм": "3 л", "Свисток": "Так" } },
  p3: { sku: "BN-213", name: "Набір каструль 6 предметів, нержавіюча сталь, 8,5 / 10 / 14 л", price: 42,
        specs: { "Матеріал": "Нержавіюча сталь", "Предметів": "6", "Об'єм": "8,5 / 10 / 14 л", "Кришка": "Так" } },
  p4: { sku: "BN-742", name: "Набір для спецій 17 в 1, круглий, під дерево", price: 11.5,
        specs: { "Предметів": "17", "Колір": "Під дерево" } },
  p5: { sku: "BN-650", name: "Термос-ланчбокс 2 л, нержавіюча сталь", price: 7.2,
        specs: { "Матеріал": "Нержавіюча сталь", "Об'єм": "2 л" } },
  p6: { sku: "BN-787", name: "Млинок для солі та перцю 12,5 см", price: 2.1,
        specs: { "Висота": "12,5 см" } },
  p7: { sku: "BN-3012", name: "Обробна дошка кругла, бамбук, Ø 30 см", price: 3.3,
        specs: { "Матеріал": "Бамбук", "Діаметр": "30 см" } },
  p8: { sku: "BN-392", name: "Каструля з мармуровим покриттям і кришкою, 4,2 л", price: 8.9, out: true,
        specs: { "Покриття": "Мармурове", "Об'єм": "4,2 л", "Кришка": "Так" } },
  k1: { sku: "KB-2001", name: "Мультиварка 43 програми, 5 л, 900 Вт", price: 28,
        specs: { "Потужність": "900 Вт", "Об'єм": "5 л", "Програм": "43" } },
  k2: { sku: "KB-2019", name: "Електром'ясорубка з насадкою для томатного соку, 2500 Вт", price: 34.5,
        specs: { "Потужність": "2500 Вт", "Насадка для соку": "Так" } },
  k3: { sku: "KB-2028", name: "Електричний чайник 1,7 л, два кольори", price: 8.2,
        specs: { "Об'єм": "1,7 л", "Кольори": "2" } },
  k4: { sku: "KB-1997", name: "Кухонні електронні ваги", price: 4.6, specs: { "Тип": "Електронні" } },
  k5: { sku: "KB-2030", name: "Електричний чайник", price: 7.9, specs: {} },
  k6: { sku: "KB-2050", name: "Ручний блендер, 2 швидкості", price: 9.4, specs: { "Швидкостей": "2" } },
  k7: { sku: "KB-2051", name: "Блендер 4 в 1, 2 швидкості, 600 Вт", price: 14.2,
        specs: { "Потужність": "600 Вт", "Швидкостей": "2" } },
  k8: { sku: "KB-1995", name: "Електрична кавоварка, 4 кольори", price: 12.6, specs: { "Кольори": "4" } },
  a1: { sku: "BN-919", name: "Ножиці кухонні", price: 1.0, old: 1.2, specs: {} },
  a2: { sku: "BN-740", name: "Шприц кондитерський, 20 насадок", price: 2.5, old: 3.75, specs: { "Насадок": "20" } },
  a3: { sku: "BN-3076", name: "Слайсер для нарізки продуктів", price: 4.4, old: 5.3, specs: {} },
  a4: { sku: "BN-3071", name: "Тертка з нержавіючої сталі", price: 0.5, old: 0.75, specs: { "Матеріал": "Нержавіюча сталь" } },
  a5: { sku: "BN-3009", name: "Набір кухонного приладдя з бамбуку, 5 предметів", price: 3.6, old: 4.5,
        specs: { "Матеріал": "Бамбук", "Предметів": "5" } },
  a6: { sku: "KB-2020", name: "Електром'ясорубка, 2500 Вт", price: 29.5, old: 36, specs: { "Потужність": "2500 Вт" } },
  a7: { sku: "KB-2031", name: "Електричний чайник 1,7 л", price: 6.9, old: 8.5, specs: { "Об'єм": "1,7 л" } },
  a8: { sku: "KB-2032", name: "Електричний чайник зі скляною колбою", price: 7.4, old: 9.2, specs: { "Матеріал колби": "Скло" } },
  // the example product page (product.html); image g0.jpg is its first gallery photo
  g0: { sku: "BN-203", name: "Набір посуду з нержавіючої сталі, 10 предметів", price: 38.5,
        specs: { "Матеріал": "Важка нержавіюча сталь", "Предметів": "10", "Об'єм": "2,1 / 2,9 / 3,9 / 6,5 л", "Дно": "5 шарів", "Кришка": "Так" } },
};

// Which products each section shows, and the badge it puts on them.
const SECTIONS = {
  "new-cookware": { badge: "new", ids: ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8"] },
  "new-appliances": { badge: "new", ids: ["k1", "k2", "k3", "k4", "k5", "k6", "k7", "k8"] },
  "sale-cookware": { badge: "sale", ids: ["a1", "a2", "a3", "a4", "a5"] },
  "sale-appliances": { badge: "sale", ids: ["a6", "a7", "a8"] },
  related: { badge: null, ids: ["p3", "p8", "p2", "p1"] },
  picks: { badge: null, ids: ["k1", "g0", "k3", "p4", "a3"] }, // hand-picked mix of brands (first = big card)
};

// Catalog tree: the real categories from the CSV, grouped into 5 sections (+ Новинки / Акції).
// [slug, name, product count]; tile image = img/cat/<slug>.jpg
const CATALOG = [
  { slug: "new", name: "Новинки", count: 211, section: "new-cookware" },
  { slug: "sale", name: "Акції", count: 8, section: "sale-cookware" },
  { slug: "posud", name: "Посуд", subs: [
    ["skovorody", "Сковороди та WOK", 100], ["mlyntsevi", "Млинцеві сковороди", 21], ["skovorody-nerzh", "Сковороди з нержавіючої сталі", 20],
    ["nabory-nerzh", "Набори каструль з нержавіючої сталі", 57], ["nabory-antyprygar", "Набори каструль з антипригарним покриттям", 48],
    ["kazany", "Казани та сотейники", 33], ["kastruli-nerzh", "Каструлі з нержавіючої сталі", 19], ["kastruli-emal", "Емальовані каструлі", 11],
    ["kovshyky", "Ковшики", 20], ["kryshky", "Кришки", 18], ["gril", "Гриль і мангал", 16]] },
  { slug: "chai", name: "Чайники, термоси, кава", subs: [
    ["chainyky-nerzh", "Чайники з нержавіючої сталі", 46], ["chainyky-emal", "Емальовані чайники", 12], ["termosy", "Термоси й термокухлі", 78],
    ["lanch-boksy", "Ланч-бокси", 24], ["kava", "Гейзерні кавоварки та турки", 24], ["french-press", "Френч-преси", 7]] },
  { slug: "aksesuary", name: "Кухонні аксесуари", subs: [
    ["stolovyi-inventar", "Столовий інвентар", 116], ["aksesuary", "Кухонні аксесуари", 66], ["vypichka", "Форми для випікання", 53],
    ["stolovi-nabory", "Столові набори та прибори", 45], ["nozhi", "Ножі та підставки", 42], ["mysky", "Миски та друшляки", 42],
    ["lopatky", "Силіконові лопатки", 28], ["doshky", "Обробні дошки", 24], ["spetsii", "Набори для спецій", 20],
    ["sudochky", "Судочки та ємності", 20], ["tertky", "Тертки", 17], ["plyashky", "Пляшки для олії", 16],
    ["mlynky", "Млинки для спецій", 15], ["susharky", "Сушарки для посуду", 8], ["podribnyuvachi", "Подрібнювачі", 8], ["stupky", "Ступки", 7]] },
  { slug: "tekhnika", name: "Побутова техніка", subs: [["tekhnika", "Кухонна техніка", 47], ["elektrochainyky", "Електрочайники", 9]] },
  { slug: "horeca", name: "Для HoReCa", subs: [["horeca", "Посуд для ресторанів і кафе", 52], ["gastroyemnosti", "Гастроємності", 9]] },
];
CATALOG.forEach((g) => (g.count ??= g.subs.reduce((n, s) => n + s[2], 0)));

// Which demo products show on each section's page (the real site filters by category in the database).
const GROUP_PRODUCTS = {
  posud: ["g0", "p1", "p3", "p8"], chai: ["p2", "p5"], aksesuary: ["p4", "p6", "p7", "a1", "a2", "a3", "a4", "a5"],
  tekhnika: ["k1", "k2", "k3", "k4", "k5", "k6", "k7", "k8", "a6", "a7", "a8"], horeca: ["p3", "g0", "p8"],
};
