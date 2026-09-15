/* =========================================================================
   KONCENTRACIJA – app.js
   -------------------------------------------------------------------------
   ARHITEKTURA (za buduće dodavanje zadataka):
   Svaka stranica (broj = naziv slike u /images) može imati zapis u
   `pagesConfig`. Ako ga nema, stranica se prikazuje bez interaktivnog
   panela (kao obična slika – naslovnice, upute, tekst).

   Svaki zapis ima "type" koji govori KOJI generički prikazivač (renderer)
   da nacrta zadatak. Dostupni tipovi:

     drag-rings     – vuci krug na točno mjesto na slici (treba "targets")
     tally-mark     – digitalna "olovka": dodirni sliku da označiš/prebrojiš
     draw-canvas    – crtanje prstom preko slike
     text-panel     – pitanja s poljima za upis (+ opcionalna provjera)
     choice-fill    – više mini-pitanja s ponuđenim odgovorima (čipovi)
     matching       – spajanje pojmova u parove
     choice-panel   – višestruki izbor (a/b/c/d) s jednim odgovorom
     truefalse      – lista tvrdnji, označi točno/netočno
     choice-groups  – u svakom retku odaberi jedan (npr. "što ne pripada")
     memory         – pokaži pa sakrij popis/sliku, upiši iz sjećanja
     table-fill     – popuni tablicu
     assign         – rasporedi imena u mjesta (bez provjere - nejednoznačno)
     order-panel    – posloži rečenice pravim redoslijedom
     self-assessment– standardna "samoprocjena" (emoji + skale + tekst)
     diploma        – upiši ime za diplomu

   Svi odgovori se spremaju u localStorage (po stranici), pa dijete ne
   gubi rad kad ode na drugu stranicu.
   ========================================================================= */

/* ---------------------------------------------------------------------
   1) POMOĆNE FUNKCIJE
   --------------------------------------------------------------------- */

function ce(tag, cls, html) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (html !== undefined) el.innerHTML = html;
  return el;
}

const Store = {
  key(p) { return 'konc_v1_page_' + p; },
  get(p) {
    try { return JSON.parse(localStorage.getItem(this.key(p))) || {}; }
    catch (e) { return {}; }
  },
  set(p, obj) {
    try { localStorage.setItem(this.key(p), JSON.stringify(obj)); }
    catch (e) { /* localStorage nedostupan - tiho ignoriraj */ }
  },
  patch(p, partial) {
    const cur = this.get(p);
    Object.assign(cur, partial);
    this.set(p, cur);
    return cur;
  },
  clear(p) {
    try { localStorage.removeItem(this.key(p)); } catch (e) {}
  }
};

function normalize(str) {
  return (str || '').toString().trim().toLowerCase()
    .replace(/č/g, 'c').replace(/ć/g, 'c').replace(/š/g, 's')
    .replace(/đ/g, 'd').replace(/ž/g, 'z')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim().replace(/\s+/g, ' ');
}

function isCorrect(input, answer) {
  const a = normalize(input), b = normalize(answer);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Cleanup fn-ovi za listenere zakačene na window/document, da se ne gomilaju
// kad dijete više puta posjeti istu stranicu.
let pageCleanup = [];
function onPageCleanup(fn) { pageCleanup.push(fn); }
function runPageCleanup() { pageCleanup.forEach(fn => { try { fn(); } catch (e) {} }); pageCleanup = []; }

/* ---------------------------------------------------------------------
   2) POPIS STRANICA I NASLOVA CJELINA
   --------------------------------------------------------------------- */

const validPages = [];
for (let i = 1; i <= 50; i++) {
  if (i !== 2 && i !== 49) validPages.push(i);
}

const CJELINE = [
  { from: 1, to: 7, name: 'Uvod' },
  { from: 8, to: 15, name: 'Cjelina 1 · Fokus i pažnja' },
  { from: 16, to: 22, name: 'Cjelina 2 · Logičko razmišljanje' },
  { from: 23, to: 29, name: 'Cjelina 3 · Čitanje s razumijevanjem' },
  { from: 30, to: 36, name: 'Cjelina 4 · Pamćenje i prisjećanje' },
  { from: 37, to: 44, name: 'Cjelina 5 · Super izazovi' },
  { from: 45, to: 50, name: 'Kraj' },
];
function cjelinaFor(p) {
  const c = CJELINE.find(c => p >= c.from && p <= c.to);
  return c ? c.name : '';
}

/* ---------------------------------------------------------------------
   3) KONFIGURACIJA ZADATAKA PO STRANICAMA
   --------------------------------------------------------------------- */

const pagesConfig = {

  // ---------------- CJELINA 1 ----------------

9: {
  hint: '👉 Dovuci krugove na mjesta gdje se slike razlikuju.',
  tip: 'Ovaj izazov trenira tvoje oči da uoče i najmanje razlike!',
  type: 'drag-rings',
  targets: [
    { id: 1, top: '53%', left: '64%', width: '11%', height: '7%' },
    { id: 2, top: '63%', left: '70%', width: '12%', height: '8%' },
    { id: 3, top: '68%', left: '30%', width: '12%', height: '8%' },
  ]
},

10: {
  hint: '👉 Dodirni sliku svaki put kad uočiš razliku između gornje i donje slike – probaj pronaći svih 7!',
  type: 'tally-mark',
  pens: [{ key: 'diff', label: 'Razlika', color: '#10b981' }], // Promijenjeno iz #ef4444 u #10b981
  targetTotal: 7
},

  11: {
    hint: '👉 Odaberi olovku (A ili E), pa dodirni svako slovo A ili E u mreži da ga "zaokružiš".',
    tip: 'Gledaj red po red – tako nećeš preskočiti nijedno slovo.',
    type: 'tally-mark',
    pens: [
      { key: 'A', label: 'Slovo A', color: '#0891b2' },
      { key: 'E', label: 'Slovo E', color: '#db2777' },
    ],
    targets: { A: 5, E: 6 }
  },

  12: {
    hint: '👉 Prstom polako precrtaj uzorak prateći točkice, isto kao na lijevoj strani.',
    tip: 'Diši polako. Opusti ruku i mirno prati linije.',
    type: 'draw-canvas'
  },

  13: {
    hint: '👉 Odaberi boju i dodirni svakog tukana: ZELENA za "gleda desno", PLAVA za "gleda lijevo". Brojevi se sami zbrajaju!',
    tip: 'Gledaj prema kojem smjeru ide njihov kljun – to će ti pomoći!',
    type: 'tally-mark',
    pens: [
      { key: 'right', label: 'Gleda desno', color: '#16a34a' },
      { key: 'left', label: 'Gleda lijevo', color: '#2563eb' },
    ]
  },

14: {
  hint: '👉 Dodirni riječ na popisu kad je pronađeš na slici.',
  tip: 'Traži prvo rijetka slova poput Z, Š, Ž, LJ – lakše upadnu u oko nego A ili E.',
  type: 'checklist',
  checklist: ['PAŽNJA', 'FOKUS', 'MISAO', 'MOZAK', 'UČENJE', 'ČITANJE',
    'PAMĆENJE', 'STRPLJENJE', 'VJEŽBA', 'CILJ', 'TRUD', 'ZNANJE',
    'ŠKOLA', 'RAZUM', 'OPREZ']
},

  15: { type: 'self-assessment' },

  // ---------------- CJELINA 2 ----------------

  17: {
    hint: '👉 Otkrij pravilo u svakom nizu i upiši što dolazi sljedeće.',
    type: 'text-panel',
    questions: [
      { q: '2, 4, 6, 8  →  ?', answer: '10' },
      { q: 'A, B, C, D  →  ?', answer: 'E' },
      { q: '1, 3, 6, 10  →  ?', answer: '15' },
      { q: 'A, D, G, L  →  ?' , answer: 'O' },
      { q: '5, 10, 20, 40  →  ?', answer: '80' },
      { q: 'B, D, G, K  →  ?', answer: 'P' },
    ]
  },

  18: {
    hint: '👉 Pročitaj tragove i odaberi kojeg ljubimca ima svaka osoba.',
    type: 'choice-fill',
    items: [
      { label: 'Petar', options: ['Pas', 'Mačka', 'Papiga'], answer: 'Mačka' },
      { label: 'Luka', options: ['Pas', 'Mačka', 'Papiga'], answer: 'Pas' },
      { label: 'Ivana', options: ['Pas', 'Mačka', 'Papiga'], answer: 'Papiga' },
    ]
  },

  19: {
    hint: '👉 Dodirni pojam lijevo, pa njegov par desno – spoji ih!',
    type: 'matching',
    pairs: [
      { left: '🔑 Ključ', right: 'BRAVA' },
      { left: '🦋 Leptir', right: 'GUSJENICA' },
      { left: '🔋 Baterija', right: 'ENERGIJA' },
      { left: '⏰ Sat', right: 'TOČNOST' },
      { left: '🖌️ Kist', right: 'UMJETNIK' },
      { left: '☀️ Sunce', right: 'TOPLINA' },
      { left: '👓 Naočale', right: 'VID' },
      { left: '💡 Žarulja', right: 'SVJETLOST' },
      { left: '💿 Ploča', right: 'PJESMA' },
      { left: '🎵 Nota', right: 'ZVUK' },
      { left: '🚗 Volan', right: 'UPRAVLJANJE' },
    ]
  },

  20: {
    hint: '👉 Pročitaj izjave i napiši tko je po tebi kriv u svakoj situaciji.',
    tip: 'Isti ili slični odgovori nisu uvijek dokaz istine – uvijek provjeri informacije!',
    type: 'text-panel',
    questions: [
      { q: 'Tko je razbio vazu?' },
      { q: 'Tko je pojeo čokoladu?' },
      { q: 'Tko je zalio bilježnicu vodom?' },
    ]
  },

21: {
  hint: '👉 U svakom redu dodirni onaj koji ne pripada skupini.',
  type: 'choice-groups',
  groups: [
    { title: '1.', options: ['⬜ Kvadrat', '🔺 Trokut', '⚪ Krug', '🔮 Kugla (3D)'], answer: '🔮 Kugla (3D)' },
    { title: '2.', options: ['🦊 Lisica', '🐺 Vuk', '🐕 Pas', '🐈 Mačka'], answer: '🐈 Mačka' },
    { title: '3.', options: ['📱 Mobitel', '📱 Tablet', '🖥️ Monitor', '📺 Televizor'], answer: '📺 Televizor' },
  ]
},

  22: { type: 'self-assessment' },

  // ---------------- CJELINA 3 ----------------

  24: {
    hint: '👉 Pročitaj priču o Karlu i odgovori punim rečenicama.',
    type: 'text-panel',
    questions: [
      { q: 'Što je Karlo trebao kupiti?', answer: 'boje' },
      { q: 'Za koji je školski predmet trebao boje?' },
      { q: 'Što nam ovaj događaj govori o Karlu?' },
      { q: 'Zašto mu je prodavačica dala boje bez naplate?' },
    ]
  },

  25: {
    hint: '👉 Pročitaj tekst pa označi je li svaka tvrdnja točna ✅ ili netočna ❌.',
    type: 'truefalse',
    statements: [
      { text: 'Natjecanje se održalo u školi.', answer: false },
      { text: 'Mateo je pokazao izvrsno znanje o Zemlji.', answer: true },
      { text: 'Dora nije točno odgovorila na sva pitanja iz povijesti.', answer: false },
      { text: 'Mateo je postigao bolje rezultate u matematici od Dore.', answer: false },
      { text: 'Nakon natjecanja Mateo i Dora zajedno su proslavili uspjeh.', answer: true },
    ]
  },

  26: {
    hint: '👉 Odaberi naslov koji najbolje opisuje cijelu priču.',
    type: 'choice-panel',
    options: [
      { key: 'a', text: 'Školska dramska skupina' },
      { key: 'b', text: 'Predstava u parku' },
      { key: 'c', text: 'Veliki pljesak za male glumce' },
      { key: 'd', text: 'Roditeljska pomoć u školi' },
    ],
    answer: 'b',
    note: 'Naslov "Predstava u parku" najbolje obuhvaća cijelu priču, ne samo jedan detalj.'
  },

  27: {
    hint: '👉 Pronađi odgovore u tekstu o učionici broj 4.',
    type: 'text-panel',
    questions: [
      { q: 'Tko je drugi ušao u učionicu?', answer: 'Nika' },
      { q: 'Zašto se Luka zadržao u učionici?', answer: 'flomaster' },
      { q: 'Koga je Luka sreo na izlasku iz učionice?', answer: 'Ivana' },
      { q: 'Tko je najvjerojatnije obrisao dio crteža – i zašto to misliš?' },
    ]
  },

  28: {
    hint: '👉 Odaberi završetak koji se najbolje nadovezuje na priču.',
    type: 'choice-panel',
    options: [
      { key: 'a', text: 'Jana se okrenula, nasmijala i pružila mu kutijicu: "Ovo je za tebe..."' },
      { key: 'b', text: 'Jana je brzo spremila kutijicu u torbu: "Ma ništa posebno..."' },
      { key: 'c', text: 'Jana je otvorila kutijicu i rekla: "Zapravo, ovo sam htjela kupiti za sebe."' },
    ],
    answer: 'a',
    note: 'Jana cijelo vrijeme djeluje uzbuđeno i nada se da poklon neće razočarati – to se najbolje slaže s ovim završetkom.'
  },

  29: { type: 'self-assessment' },

  // ---------------- CJELINA 4 ----------------

  31: {
    hint: '👉 Gledaj popis riječi 1 minutu, zatim ga sakrij i pokušaj se prisjetiti svih riječi.',
    type: 'memory',
    lists: [
      { title: 'Popis 1', seconds: 60, words: ['jabuka', 'banana', 'kruška', 'šljiva', 'marelica', 'naranča', 'limun', 'grožđe'], recall: 'textarea' },
      { title: 'Popis 2', seconds: 60, words: ['jagoda', 'breskva', 'lubenica', 'auto', 'kamion', 'bicikl', 'trešnja', 'vlak', 'skuter', 'kivi'], recall: 'textarea' },
    ]
  },

  32: {
    hint: '👉 Gledaj sliku s predmetima 30 sekundi, zatim je sakrij i napiši što više predmeta kojih se sjećaš.',
    type: 'memory',
    lists: [
      { title: 'Predmeti sa slike', seconds: 30, words: ['balon', 'košarkaška lopta', 'glačalo', 'sir', 'cvijet', 'sladoled', 'bundeva', 'češalj', 'škare', 'spužva', 'lubenica', 'list'], recall: 'grid' }
    ]
  },

  33: {
    hint: '👉 Gledaj brojeve 20 sekundi, zatim ih sakrij i upiši po redu.',
    type: 'memory',
    lists: [
      { title: 'EASY', seconds: 20, value: '264 – 519 – 832', recall: 'single' },
      { title: 'HARD', seconds: 20, value: '1425 – 3906 – 2992 – 1002 – 5241', recall: 'single' },
    ]
  },

  34: {
    hint: '👉 Pažljivo pročitaj tekst o kvizu znanja i popuni tablicu.',
    type: 'table-fill',
    cols: ['Broj natjecatelja', 'Najbolji u kojoj kategoriji?', 'Konačan poredak'],
    rows: [
      { label: '5.A', answers: ['2', 'sport', '4'] },
      { label: '5.B', answers: ['4', 'priroda', '2'] },
      { label: '6.A', answers: ['4', 'matematika', '3'] },
      { label: '6.B', answers: ['4', 'povijest', '1'] },
    ]
  },

  35: {
    hint: '👉 Pomoću tragova pokušaj posložiti raspored sjedenja. (Ovaj zadatak ima više mogućih rješenja – nema automatske provjere, razmisli i objasni svoju logiku nekome!)',
    type: 'assign',
    names: ['Karlo', 'Mia', 'Marko', 'Ana'],
    slots: 4
  },

  36: { type: 'self-assessment' },

  // ---------------- CJELINA 5 ----------------

  38: {
    hint: '👉 Odaberi simbol, pa dodirni svako mjesto na slici gdje ga vidiš. Broj se sam ažurira!',
    type: 'tally-mark',
    pens: [
      { key: 'S', label: 'S (veliko)', color: '#dc2626' },
      { key: 's', label: 's (malo)', color: '#f97316' },
      { key: 'd', label: 'd (malo)', color: '#eab308' },
      { key: 'D', label: 'D (veliko)', color: '#65a30d' },
      { key: 'a', label: 'a (malo)', color: '#0d9488' },
      { key: 'A', label: 'A (veliko)', color: '#0284c7' },
      { key: 'star', label: '★', color: '#7c3aed' },
      { key: 'triF', label: '▲', color: '#c026d3' },
      { key: 'triO', label: '△', color: '#db2777' },
      { key: 'circ', label: '●', color: '#4b5563' },
    ],
    targets: { S: 3, s: 3, d: 1, D: 2, a: 3, A: 4, star: 8, triF: 3, triO: 3, circ: 6 }
  },

  39: {
    hint: '👉 Otkrij pravilo u svakom nizu.',
    type: 'text-panel',
    questions: [
      { q: '2, 4, 6, 8  →  ?', answer: '10' },
      { q: 'zima, minus  →  ?, ?' },
      { q: 'utorak, četvrtak, subota  →  ?', answer: 'ponedjeljak' },
      { q: '3, 6, 12, 24  →  ?', answer: '48' },
      { q: 'I, II, IV, VIII  →  ?', answer: 'XVI' },
      { q: '1, 2, 4, 7, 11  →  ?', answer: '16' },
    ]
  },

  40: {
    hint: '👉 Za svaku rečenicu odaberi broj kojim pokazuješ pravi redoslijed priče.',
    type: 'order-panel',
    tasks: [
      {
        title: 'Zadatak 1',
        sentences: [
          'Kad je završio s crtanjem, ponosno je pokazao crtež svojoj obitelji.',
          'Ivan je uzeo papire i flomastere i sjeo za stol.',
          'Odlučio je nacrtati sliku šume s jelenom.',
          'Njegova obitelj pohvalila ga je za trud i maštovitost.',
        ],
        answer: [3, 1, 2, 4]
      },
      {
        title: 'Zadatak 2',
        sentences: [
          'Na kraju je našao mali kafić i tamo se odmorio uz sok.',
          'Luka je odlučio ići pješice do parka.',
          'Ožednio je pa je odlučio kupiti bocu vode.',
          'Put je bio dug i sunce je jako sjalo.',
          'Kada je stigao u park, sjeo je na klupu i otvorio svoju bilježnicu za crtanje.',
          'Zapisao je nekoliko ideja za strip koji je želio nacrtati.',
        ],
        answer: [6, 1, 3, 2, 4, 5]
      }
    ]
  },

  41: {
    hint: '👉 Prouči prvi popis 30 sekundi, sakrij ga i zapiši čega se sjećaš. Isto ponovi s drugim popisom.',
    type: 'memory',
    lists: [
      { title: 'Zadatak 1 (8 riječi)', seconds: 30, words: ['drvo', 'pas', 'knjiga', 'bicikl', 'jabuka', 'kuća', 'pjesma', 'torba'], recall: 'grid' },
      { title: 'Zadatak 2 (12 riječi)', seconds: 40, words: ['lopta', 'raketa', 'klavir', 'kolač', 'sat', 'more', 'leptir', 'olovka', 'auto', 'mjesec', 'boja', 'ključ'], recall: 'grid' },
    ]
  },

  43: {
    hint: '👉 Odgovori na pitanja o Ivanu i Mariji, pa za kraj pokušaj cijelu priču ispričati svojim riječima.',
    type: 'text-panel',
    questions: [
      { q: 'U koliko je sati film počeo?', answer: '10' },
      { q: 'Tko je platio kokice i piće? Zašto?', answer: 'Ivan' },
      { q: 'U koliko je sati film završio?', answer: '12' },
      { q: 'Koga su Ivan i Marija sreli u parku?', answer: 'Frana' },
      { q: 'Kako su proveli vrijeme u parku?', answer: 'igru' },
      { q: 'U koliko su sati došli u park?', answer: '12:15' },
      { q: 'Što misliš – zašto je Marija mogla zaboraviti novčanik? Napiši jedno moguće objašnjenje.' },
      { q: '🎁 Bonus: Ispričaj cijelu priču svojim riječima (bez gledanja u tekst).', multiline: true },
    ]
  },

  44: {
    hint: '👉 Osvrni se na sve izazove koje si riješio/riješila.',
    type: 'text-panel',
    questions: [
      { q: 'Najdraži izazov mi je bio:', multiline: true },
      { q: 'Najteže mi je bilo:', multiline: true },
      { q: 'Najviše sam napredovao/napredovala u:', multiline: true },
      { q: 'Želim još vježbati:', multiline: true },
    ]
  },

  46: { type: 'diploma' },
};

/* ---------------------------------------------------------------------
   4) RENDERERI ZA POJEDINE TIPOVE ZADATAKA
   --------------------------------------------------------------------- */

function buildHintBlock(panel, cfg, pageNum) {
  const head = ce('div', 'panel-head');
  if (cfg.hint) head.appendChild(ce('div', 'panel-hint', cfg.hint));
  if (cfg.tip) {
    const btn = ce('button', 'tip-btn', '💡 Savjet');
    const box = ce('div', 'tip-box hidden', cfg.tip);
    btn.addEventListener('click', () => box.classList.toggle('hidden'));
    head.appendChild(btn);
    head.appendChild(box);
  }
  const resetBtn = ce('button', 'reset-btn', '↺ Poništi');
  resetBtn.addEventListener('click', () => {
    if (confirm('Obrisati sve unesene odgovore na ovoj stranici?')) {
      Store.clear(pageNum);
      loadPageByIndex(currentIndex);
    }
  });
  head.appendChild(resetBtn);
  panel.appendChild(head);
}

// ---- drag-rings ----
function renderDragRings(pageNum, cfg, panel) {
  const layer = document.getElementById('interactive-layer');
  const state = Store.get(pageNum);
  const matched = new Set(state.matched || []);

  cfg.targets.forEach(t => {
    const zone = ce('div', 'target-zone');
    zone.dataset.id = t.id;
    zone.style.top = t.top; zone.style.left = t.left;
    zone.style.width = t.width; zone.style.height = t.height;
    if (matched.has(t.id)) zone.classList.add('matched');
    layer.appendChild(zone);
  });

  buildHintBlock(panel, cfg, pageNum);
  const tray = ce('div', 'rings-tray');
  panel.appendChild(tray);
  const progress = ce('div', 'progress-text');
  panel.appendChild(progress);

  function updateProgress() {
    progress.textContent = `Pronađeno: ${matched.size} / ${cfg.targets.length}` +
      (matched.size === cfg.targets.length ? '  🎉 Bravo, pronašao/pronašla si sve razlike!' : '');
  }

  function attachDrag(ring, id) {
    ring.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const rect = ring.getBoundingClientRect();
      const ghost = ce('div', 'ring-ghost');
      ghost.style.width = rect.width + 'px';
      ghost.style.height = rect.height + 'px';
      ghost.style.left = rect.left + 'px';
      ghost.style.top = rect.top + 'px';
      document.body.appendChild(ghost);
      ring.classList.add('dragging-source');

      const offX = e.clientX - rect.left, offY = e.clientY - rect.top;

      function move(ev) {
        ghost.style.left = (ev.clientX - offX) + 'px';
        ghost.style.top = (ev.clientY - offY) + 'px';
      }
      function up(ev) {
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        const px = ev.clientX, py = ev.clientY;
        let hit = null;
        layer.querySelectorAll('.target-zone:not(.matched)').forEach(z => {
          const r = z.getBoundingClientRect();
          if (px >= r.left && px <= r.right && py >= r.top && py <= r.bottom) hit = z;
        });
        ghost.remove();
        if (hit) {
          hit.classList.add('matched');
          matched.add(parseInt(hit.dataset.id));
          Store.patch(pageNum, { matched: [...matched] });
          ring.remove();
          updateProgress();
        } else {
          ring.classList.remove('dragging-source');
        }
      }
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
    });
  }

  cfg.targets.forEach(t => {
    if (matched.has(t.id)) return;
    const ring = ce('div', 'drag-ring');
    ring.dataset.id = t.id;
    tray.appendChild(ring);
    attachDrag(ring, t.id);
  });
  updateProgress();
}

// ---- tally-mark ----
function renderTallyMark(pageNum, cfg, panel) {
  const layer = document.getElementById('interactive-layer');
  layer.classList.add('markable');
  const state = Store.get(pageNum);
  const marks = state.marks || [];
  const found = state.found || {};
  let activePen = cfg.pens[0].key;

  buildHintBlock(panel, cfg, pageNum);

  if (cfg.pens.length > 1) {
    const bar = ce('div', 'pen-bar');
    cfg.pens.forEach(p => {
      const chip = ce('button', 'pen-chip' + (p.key === activePen ? ' active' : ''),
        `<span class="dot" style="background:${p.color}"></span>${p.label}`);
      chip.addEventListener('click', () => {
        activePen = p.key;
        bar.querySelectorAll('.pen-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
      });
      bar.appendChild(chip);
    });
    panel.appendChild(bar);
  }

  const counts = ce('div', 'count-row');
  panel.appendChild(counts);

  const hasGoal = !!(cfg.targets || cfg.targetTotal);
  if (hasGoal) {
    panel.appendChild(ce('div', 'tally-note',
      'ℹ️ Ovo samo broji dodire – ne provjerava jesu li baš ta mjesta točna. Provjeri s nekim!'));
  }

  function tally() {
    const c = {};
    marks.forEach(m => c[m.pen] = (c[m.pen] || 0) + 1);
    return c;
  }
  function renderCounts() {
    const c = tally();
    counts.innerHTML = '';
    cfg.pens.forEach(p => {
      const n = c[p.key] || 0;
      const goal = cfg.targets ? cfg.targets[p.key] : (cfg.targetTotal && cfg.pens.length === 1 ? cfg.targetTotal : null);
      const reached = goal != null && n === goal;
      counts.appendChild(ce('div', 'count-badge' + (reached ? ' goal' : ''),
        `<span style="color:${p.color}">●</span> ${p.label}: <b>${n}</b>${goal != null ? (' / ' + goal) : ''} ${reached ? '🎯' : ''}`));
    });
  }

  function redrawMarks() {
    layer.querySelectorAll('.mark-dot').forEach(d => d.remove());
    marks.forEach((m, idx) => {
      const pen = cfg.pens.find(p => p.key === m.pen);
      const dot = ce('div', 'mark-dot');
      dot.style.left = m.x + '%'; dot.style.top = m.y + '%';
      dot.style.borderColor = pen ? pen.color : '#ef4444';
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        marks.splice(idx, 1);
        Store.patch(pageNum, { marks });
        redrawMarks(); renderCounts();
      });
      layer.appendChild(dot);
    });
  }

  layer.addEventListener('click', (e) => {
    if (e.target.classList.contains('mark-dot')) return;
    const rect = layer.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    marks.push({ x, y, pen: activePen });
    Store.patch(pageNum, { marks });
    redrawMarks(); renderCounts();
  });

  if (cfg.checklist) {
    const list = ce('div', 'word-checklist');
    cfg.checklist.forEach(w => {
      const chip = ce('button', 'word-chip' + (found[w] ? ' found' : ''), w);
      chip.addEventListener('click', () => {
        found[w] = !found[w];
        chip.classList.toggle('found');
        Store.patch(pageNum, { found });
      });
      list.appendChild(chip);
    });
    panel.appendChild(list);
  }

  redrawMarks(); renderCounts();
}

// ---- draw-canvas ----
function renderDrawCanvas(pageNum, cfg, panel) {
  const layer = document.getElementById('interactive-layer');
  buildHintBlock(panel, cfg, pageNum);

  let penActive = false;
  let activeStartPoint = null;
  let savedLines = [];

  // Paleta boja za svaki od 3 grida
  const GRID_THEMES = [
    { dot: '#2563eb', line: '#1d4ed8', active: '#60a5fa' }, // 1. Grid (Plava)
    { dot: '#9333ea', line: '#7e22ce', active: '#c084fc' }, // 2. Grid (Ljubičasta)
    { dot: '#ea580c', line: '#c2410c', active: '#fb923c' }  // 3. Grid (Narančasta)
  ];

  const toolbar = ce('div', 'draw-toolbar');
  const clearBtn = ce('button', 'small-btn', '🧹 Obriši sve');
  toolbar.appendChild(clearBtn);
  panel.appendChild(toolbar);

  // PLUTAJUĆI KONTEJNER
  const floatingContainer = ce('div', 'floating-draw-tools');
  Object.assign(floatingContainer.style, {
    position: 'fixed',
    left: '50%',
    transform: 'translateX(-50%)',
    transformOrigin: 'center top',
    zIndex: '2147483647',
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    pointerEvents: 'none'
  });

  const baseBtnStyle = {
    padding: '10px 18px',
    borderRadius: '24px',
    border: '1px solid rgba(255, 255, 255, 0.6)',
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(10px)',
    webkitBackdropFilter: 'blur(10px)',
    color: '#334155',
    fontWeight: 'bold',
    fontSize: '14px',
    boxShadow: '0 4px 18px rgba(0,0,0,0.25)',
    cursor: 'pointer',
    opacity: '0.9',
    transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
    pointerEvents: 'auto',
    touchAction: 'none',
    whiteSpace: 'nowrap'
  };

  const togglePenBtn = ce('button', 'floating-pen-btn', '✏️ Olovka');
  Object.assign(togglePenBtn.style, baseBtnStyle);

  const undoBtn = ce('button', 'floating-undo-btn', '↩️ Korak natrag');
  Object.assign(undoBtn.style, baseBtnStyle);
  undoBtn.style.display = 'none';

  floatingContainer.appendChild(togglePenBtn);
  floatingContainer.appendChild(undoBtn);
  document.body.appendChild(floatingContainer);

  function updateUndoVisibility() {
    undoBtn.style.display = savedLines.length > 0 ? 'inline-block' : 'none';
  }

  function updateContainerViewportPosition() {
    if (!floatingContainer) return;

    if (window.visualViewport) {
      const vv = window.visualViewport;
      const scale = 1 / vv.scale;
      const leftOffset = vv.offsetLeft + vv.width / 2;
      const topOffset = vv.offsetTop + 16 * scale;

      floatingContainer.style.top = `${topOffset}px`;
      floatingContainer.style.left = `${leftOffset}px`;
      floatingContainer.style.transform = `translateX(-50%) scale(${scale})`;
    } else {
      floatingContainer.style.top = '16px';
      floatingContainer.style.left = '50%';
      floatingContainer.style.transform = 'translateX(-50%)';
    }
  }

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', updateContainerViewportPosition);
    window.visualViewport.addEventListener('scroll', updateContainerViewportPosition);
  }
  window.addEventListener('scroll', updateContainerViewportPosition);

  const inkCanvas = document.createElement('canvas');
  inkCanvas.className = 'draw-canvas';
  const cursorCanvas = document.createElement('canvas');
  cursorCanvas.className = 'draw-canvas pen-cursor-canvas';
  
  inkCanvas.style.pointerEvents = 'none';
  cursorCanvas.style.pointerEvents = 'none';

  layer.appendChild(inkCanvas);
  layer.appendChild(cursorCanvas);

  const ink = inkCanvas.getContext('2d');
  const cur = cursorCanvas.getContext('2d');

  function getGridConfigs() {
    return cfg.grids || [
      { x: 0.522, y: 0.312, w: 0.225, h: 0.120, rows: 5, cols: 5 }, // 1. Zadatak
      { x: 0.522, y: 0.485, w: 0.225, h: 0.120, rows: 5, cols: 5 }, // 2. Zadatak
      { x: 0.522, y: 0.658, w: 0.225, h: 0.120, rows: 5, cols: 5 }  // 3. Zadatak
    ];
  }

  function getAllGridPoints() {
    const allPoints = [];
    const width = inkCanvas.width;
    const height = inkCanvas.height;
    const gridConfigs = getGridConfigs();

    gridConfigs.forEach((g, gridIndex) => {
      const startX = g.x * width;
      const startY = g.y * height;
      const gridW = g.w * width;
      const gridH = g.h * height;
      const rows = g.rows || 5;
      const cols = g.cols || 5;

      const stepX = gridW / (cols - 1);
      const stepY = gridH / (rows - 1);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          allPoints.push({
            id: `g${gridIndex}_r${r}_c${c}`,
            gridIndex: gridIndex,
            x: startX + c * stepX,
            y: startY + r * stepY
          });
        }
      }
    });

    return allPoints;
  }

  function redrawAll() {
    ink.clearRect(0, 0, inkCanvas.width, inkCanvas.height);
    cur.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);

    const width = inkCanvas.width;
    const height = inkCanvas.height;
    const gridConfigs = getGridConfigs();

    // 1. CRTANJE BIJELE POZADINE IZA SVAKOG GRIDA (Prekriva crne točke s PNG-a)
    const pad = 12; // Extra margina u px za potpuno prekrivanje
    gridConfigs.forEach(g => {
      const gx = (g.x * width) - pad;
      const gy = (g.y * height) - pad;
      const gw = (g.w * width) + (pad * 2);
      const gh = (g.h * height) + (pad * 2);

      ink.beginPath();
      ink.roundRect(gx, gy, gw, gh, 8); // Zaobljeni bijeli pravokutnik
      ink.fillStyle = '#ffffff';
      ink.fill();
    });

    // 2. Crtanje spremljenih linija
    savedLines.forEach(line => {
      const theme = GRID_THEMES[line.gridIndex] || GRID_THEMES[0];
      ink.lineWidth = 3.5;
      ink.lineCap = 'round';
      ink.strokeStyle = theme.line;

      ink.beginPath();
      ink.moveTo(line.x1, line.y1);
      ink.lineTo(line.x2, line.y2);
      ink.stroke();
    });

    // 3. Crtanje novih interaktivnih točkica u boji
    const allPoints = getAllGridPoints();
    allPoints.forEach(p => {
      const theme = GRID_THEMES[p.gridIndex] || GRID_THEMES[0];
      
      ink.beginPath();
      ink.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
      ink.fillStyle = theme.dot;
      ink.fill();
    });

    // 4. Prikaz aktivne selekcije
    if (activeStartPoint && penActive) {
      const theme = GRID_THEMES[activeStartPoint.gridIndex] || GRID_THEMES[0];

      cur.beginPath();
      cur.arc(activeStartPoint.x, activeStartPoint.y, 8, 0, Math.PI * 2);
      cur.fillStyle = theme.active;
      cur.globalAlpha = 0.4;
      cur.fill();

      cur.beginPath();
      cur.arc(activeStartPoint.x, activeStartPoint.y, 4, 0, Math.PI * 2);
      cur.fillStyle = theme.line;
      cur.globalAlpha = 1.0;
      cur.fill();
    }

    updateUndoVisibility();
  }

  function resize() {
    const rect = layer.getBoundingClientRect();
    [inkCanvas, cursorCanvas].forEach(c => { c.width = rect.width; c.height = rect.height; });
    redrawAll();
    updateContainerViewportPosition();
  }
  resize();
  window.addEventListener('resize', resize);

  onPageCleanup(() => {
    window.removeEventListener('resize', resize);
    window.removeEventListener('scroll', updateContainerViewportPosition);
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', updateContainerViewportPosition);
      window.visualViewport.removeEventListener('scroll', updateContainerViewportPosition);
    }
    if (floatingContainer && floatingContainer.parentNode) {
      floatingContainer.parentNode.removeChild(floatingContainer);
    }
  });

  togglePenBtn.addEventListener('click', () => {
    penActive = !penActive;

    if (penActive) {
      togglePenBtn.style.background = '#10b981';
      togglePenBtn.style.color = '#ffffff';
      togglePenBtn.style.opacity = '1';
      togglePenBtn.style.boxShadow = '0 4px 18px rgba(16, 185, 129, 0.5)';
      
      inkCanvas.style.pointerEvents = 'auto';
    } else {
      togglePenBtn.style.background = 'rgba(255, 255, 255, 0.85)';
      togglePenBtn.style.color = '#334155';
      togglePenBtn.style.opacity = '0.9';
      togglePenBtn.style.boxShadow = '0 4px 18px rgba(0,0,0,0.25)';

      inkCanvas.style.pointerEvents = 'none';
      activeStartPoint = null;
      redrawAll();
    }
  });

  function findClickedPoint(clickX, clickY, maxRadius = 22) {
    const points = getAllGridPoints();
    let closest = null;
    let minDist = maxRadius;

    points.forEach(p => {
      const dist = Math.hypot(p.x - clickX, p.y - clickY);
      if (dist < minDist) {
        minDist = dist;
        closest = p;
      }
    });

    return closest;
  }

  inkCanvas.addEventListener('pointerdown', (e) => {
    if (!penActive) return;

    const r = inkCanvas.getBoundingClientRect();
    const clickX = e.clientX - r.left;
    const clickY = e.clientY - r.top;

    const clickedPoint = findClickedPoint(clickX, clickY);
    if (!clickedPoint) return;

    if (!activeStartPoint) {
      activeStartPoint = clickedPoint;
    } 
    else if (activeStartPoint.id === clickedPoint.id) {
      activeStartPoint = null;
    } 
    else {
      if (activeStartPoint.gridIndex === clickedPoint.gridIndex) {
        savedLines.push({
          gridIndex: activeStartPoint.gridIndex,
          x1: activeStartPoint.x,
          y1: activeStartPoint.y,
          x2: clickedPoint.x,
          y2: clickedPoint.y
        });
        activeStartPoint = clickedPoint;
      } else {
        activeStartPoint = clickedPoint;
      }
    }

    redrawAll();
  });

  undoBtn.addEventListener('click', () => {
    savedLines.pop();
    activeStartPoint = null;
    redrawAll();
  });

  clearBtn.addEventListener('click', () => {
    savedLines = [];
    activeStartPoint = null;
    redrawAll();
  });
}

// ---- text-panel ----
function renderTextPanel(pageNum, cfg, panel) {
  buildHintBlock(panel, cfg, pageNum);
  const state = Store.get(pageNum);
  const answers = state.answers || {};
  const wrap = ce('div', 'qa-list');

  cfg.questions.forEach((item, i) => {
    const row = ce('div', 'qa-row');
    row.appendChild(ce('div', 'qa-label', item.q));
    const input = document.createElement(item.multiline ? 'textarea' : 'input');
    input.className = 'qa-input';
    if (!item.multiline) input.type = 'text';
    input.placeholder = 'Upiši odgovor…';
    input.value = answers[i] || '';
    input.addEventListener('input', () => { answers[i] = input.value; Store.patch(pageNum, { answers }); });
    row.appendChild(input);
    const fb = ce('span', 'qa-feedback');
    row.appendChild(fb);
    row._fb = fb; row._input = input; row._answer = item.answer;
    wrap.appendChild(row);
  });
  panel.appendChild(wrap);

  if (cfg.questions.some(q => q.answer)) {
    const btn = ce('button', 'check-btn', '✅ Provjeri odgovore');
    btn.addEventListener('click', () => {
      wrap.querySelectorAll('.qa-row').forEach(row => {
        if (!row._answer) return;
        const ok = isCorrect(row._input.value, row._answer);
        row._fb.textContent = ok ? '✅' : ('❌ (' + row._answer + ')');
        row._fb.className = 'qa-feedback ' + (ok ? 'ok' : 'bad');
      });
    });
    panel.appendChild(btn);
  }
}

function renderChecklist(pageNum, cfg, panel) {
  buildHintBlock(panel, cfg, pageNum);
  const state = Store.get(pageNum);
  const found = state.found || {};

  const list = ce('div', 'word-checklist');
  cfg.checklist.forEach(w => {
    const chip = ce('button', 'word-chip' + (found[w] ? ' found' : ''), w);
    chip.addEventListener('click', () => {
      found[w] = !found[w];
      chip.classList.toggle('found');
      Store.patch(pageNum, { found });
    });
    list.appendChild(chip);
  });
  panel.appendChild(list);

  const progress = ce('div', 'progress-text');
  panel.appendChild(progress);
  function updateProgress() {
    const n = Object.values(found).filter(Boolean).length;
    progress.textContent = `Pronađeno: ${n} / ${cfg.checklist.length}` +
      (n === cfg.checklist.length ? '  🎉 Sve riječi pronađene!' : '');
  }
  updateProgress();
  list.addEventListener('click', updateProgress);
}

// ---- choice-fill ----
function renderChoiceFill(pageNum, cfg, panel) {
  buildHintBlock(panel, cfg, pageNum);
  const state = Store.get(pageNum);
  const picks = state.picks || {};
  const wrap = ce('div', 'fill-list');

  cfg.items.forEach((item, i) => {
    const row = ce('div', 'fill-row');
    row.appendChild(ce('div', 'qa-label', item.label));
    const chips = ce('div', 'chip-row');
    item.options.forEach(opt => {
      const chip = ce('button', 'chip' + (picks[i] === opt ? ' selected' : ''), opt);
      chip.addEventListener('click', () => {
        picks[i] = opt;
        Store.patch(pageNum, { picks });
        chips.querySelectorAll('.chip').forEach(c => c.classList.remove('selected', 'correct', 'incorrect'));
        chip.classList.add('selected');
      });
      chips.appendChild(chip);
    });
    row.appendChild(chips);
    row._chips = chips; row._answer = item.answer;
    wrap.appendChild(row);
  });
  panel.appendChild(wrap);

  const btn = ce('button', 'check-btn', '✅ Provjeri odgovore');
  btn.addEventListener('click', () => {
    wrap.querySelectorAll('.fill-row').forEach((row, i) => {
      const sel = picks[i];
      row._chips.querySelectorAll('.chip').forEach(c => {
        c.classList.remove('correct', 'incorrect');
        if (c.textContent === row._answer) c.classList.add('correct');
        else if (c.textContent === sel) c.classList.add('incorrect');
      });
    });
  });
  panel.appendChild(btn);
}

// ---- matching ----
function renderMatching(pageNum, cfg, panel) {
  buildHintBlock(panel, cfg, pageNum);
  const state = Store.get(pageNum);
  const conn = state.conn || {};
  const palette = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#f97316', '#14b8a6', '#ec4899', '#8b5cf6', '#84cc16', '#06b6d4'];
  const rightOrder = state.rightOrder || shuffle(cfg.pairs.map((_, i) => i));
  Store.patch(pageNum, { rightOrder });

  const wrap = ce('div', 'match-wrap');
  const colL = ce('div', 'match-col');
  const colR = ce('div', 'match-col');
  wrap.appendChild(colL); wrap.appendChild(colR);
  panel.appendChild(wrap);
  panel.appendChild(ce('div', 'tally-note', 'ℹ️ Dodirni obojeni (već spojeni) pojam da poništiš spoj.'));

  let selL = null, selR = null;
  function colorFor(i) { return palette[i % palette.length]; }

  function tryConnect() {
    if (selL != null && selR != null) {
      conn[selL] = selR;
      Store.patch(pageNum, { conn });
      selL = null; selR = null;
      refresh();
    }
  }

  function refresh() {
    colL.innerHTML = ''; colR.innerHTML = '';

    cfg.pairs.forEach((p, i) => {
      const connected = conn[i] != null;
      const chip = ce('div', 'match-chip', p.left + (connected ? ' <span class="unlink">✕</span>' : ''));
      if (connected) { chip.style.borderColor = colorFor(i); chip.style.background = colorFor(i) + '22'; }
      chip.addEventListener('click', () => {
        if (connected) {
          delete conn[i];
          Store.patch(pageNum, { conn });
          selL = null; selR = null;
          refresh();
          return;
        }
        selL = i;
        colL.querySelectorAll('.match-chip').forEach(c => c.classList.remove('picked'));
        chip.classList.add('picked');
        tryConnect();
      });
      colL.appendChild(chip);
    });

    rightOrder.forEach((ri) => {
      const usedKey = Object.keys(conn).find(k => conn[k] === ri);
      const connected = usedKey != null;
      const chip = ce('div', 'match-chip', cfg.pairs[ri].right + (connected ? ' <span class="unlink">✕</span>' : ''));
      if (connected) { chip.style.borderColor = colorFor(ri); chip.style.background = colorFor(ri) + '22'; }
      chip.addEventListener('click', () => {
        if (connected) {
          delete conn[usedKey];
          Store.patch(pageNum, { conn });
          selL = null; selR = null;
          refresh();
          return;
        }
        selR = ri;
        colR.querySelectorAll('.match-chip').forEach(c => c.classList.remove('picked'));
        chip.classList.add('picked');
        tryConnect();
      });
      colR.appendChild(chip);
    });
  }
  refresh();

  const btn = ce('button', 'check-btn', '✅ Provjeri spojeve');
  btn.addEventListener('click', () => {
    const keys = Object.keys(conn);
    const allOk = keys.length === cfg.pairs.length && keys.every(li => parseInt(li) === conn[li]);
    alert(allOk ? '🎉 Sve je točno spojeno!' : 'Provjeri ponovno – neki parovi nisu točni.');
  });
  panel.appendChild(btn);
}

// ---- choice-panel ----
function renderChoicePanel(pageNum, cfg, panel) {
  buildHintBlock(panel, cfg, pageNum);
  const state = Store.get(pageNum);
  let picked = state.picked;
  const list = ce('div', 'choice-list');

  cfg.options.forEach(opt => {
    const chip = ce('button', 'choice-btn' + (picked === opt.key ? ' selected' : ''), `<b>${opt.key})</b> ${opt.text}`);
    chip.addEventListener('click', () => {
      picked = opt.key;
      Store.patch(pageNum, { picked });
      list.querySelectorAll('.choice-btn').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
    });
    list.appendChild(chip);
  });
  panel.appendChild(list);

  if (cfg.answer) {
    const btn = ce('button', 'check-btn', '✅ Provjeri odgovor');
    btn.addEventListener('click', () => {
      list.querySelectorAll('.choice-btn').forEach((c, i) => {
        const key = cfg.options[i].key;
        c.classList.remove('correct', 'incorrect');
        if (key === cfg.answer) c.classList.add('correct');
        else if (key === picked) c.classList.add('incorrect');
      });
      if (cfg.note) {
        let note = panel.querySelector('.choice-note');
        if (!note) { note = ce('div', 'choice-note'); panel.appendChild(note); }
        note.textContent = '💡 ' + cfg.note;
      }
    });
    panel.appendChild(btn);
  }
}

// ---- truefalse ----
function renderTrueFalse(pageNum, cfg, panel) {
  buildHintBlock(panel, cfg, pageNum);
  const state = Store.get(pageNum);
  const picks = state.picks || {};
  const wrap = ce('div', 'tf-list');

  cfg.statements.forEach((s, i) => {
    const row = ce('div', 'tf-row');
    row.appendChild(ce('div', 'tf-text', s.text));
    const btns = ce('div', 'tf-btns');
    const yes = ce('button', 'tf-btn' + (picks[i] === true ? ' selected' : ''), '✅');
    const no = ce('button', 'tf-btn' + (picks[i] === false ? ' selected' : ''), '❌');
    yes.addEventListener('click', () => { picks[i] = true; Store.patch(pageNum, { picks }); yes.classList.add('selected'); no.classList.remove('selected'); });
    no.addEventListener('click', () => { picks[i] = false; Store.patch(pageNum, { picks }); no.classList.add('selected'); yes.classList.remove('selected'); });
    btns.appendChild(yes); btns.appendChild(no);
    row.appendChild(btns);
    row._answer = s.answer;
    wrap.appendChild(row);
  });
  panel.appendChild(wrap);

  const btn = ce('button', 'check-btn', '✅ Provjeri odgovore');
  btn.addEventListener('click', () => {
    wrap.querySelectorAll('.tf-row').forEach((row, i) => {
      const pick = picks[i];
      row.classList.remove('tf-ok', 'tf-bad');
      if (pick === undefined) return;
      row.classList.add(pick === row._answer ? 'tf-ok' : 'tf-bad');
    });
  });
  panel.appendChild(btn);
}

// ---- choice-groups (bez provjere) ----
function renderChoiceGroups(pageNum, cfg, panel) {
  buildHintBlock(panel, cfg, pageNum);
  const state = Store.get(pageNum);
  const picks = state.picks || {};

  cfg.groups.forEach((g, gi) => {
    const box = ce('div', 'group-box');
    box.appendChild(ce('div', 'qa-label', g.title));
    const row = ce('div', 'chip-row');
    g.options.forEach(opt => {
      const chip = ce('button', 'chip' + (picks[gi] === opt ? ' selected' : ''), opt);
      chip.addEventListener('click', () => {
        picks[gi] = opt; Store.patch(pageNum, { picks });
        row.querySelectorAll('.chip').forEach(c => c.classList.remove('selected', 'correct', 'incorrect'));
        chip.classList.add('selected');
      });
      row.appendChild(chip);
    });
    box.appendChild(row);
    box._row = row; box._answer = g.answer;
    panel.appendChild(box);
  });

  const btn = ce('button', 'check-btn', '✅ Provjeri odgovore');
  btn.addEventListener('click', () => {
    panel.querySelectorAll('.group-box').forEach((box, gi) => {
      const sel = picks[gi];
      box._row.querySelectorAll('.chip').forEach(c => {
        c.classList.remove('correct', 'incorrect');
        if (c.textContent === box._answer) c.classList.add('correct');
        else if (c.textContent === sel) c.classList.add('incorrect');
      });
    });
  });
  panel.appendChild(btn);
}

// ---- memory ----
function renderMemory(pageNum, cfg, panel) {
  buildHintBlock(panel, cfg, pageNum);
  const layer = document.getElementById('interactive-layer');
  const state = Store.get(pageNum);
  const recalls = state.recalls || {};

  cfg.lists.forEach((lst, li) => {
    const box = ce('div', 'memory-box');
    box.appendChild(ce('div', 'qa-label', lst.title));

    const btnRow = ce('div', 'memory-btns');
    const showBtn = ce('button', 'small-btn', `👀 Pogledaj (${lst.seconds}s)`);
    const hideBtn = ce('button', 'small-btn ghost', '🙈 Sakrij sada');
    const revealBtn = ce('button', 'small-btn ghost', '🔍 Prikaži rješenje');
    btnRow.appendChild(showBtn); btnRow.appendChild(hideBtn); btnRow.appendChild(revealBtn);
    box.appendChild(btnRow);

    const timerEl = ce('div', 'memory-timer');
    box.appendChild(timerEl);

    let cover = null, timerId = null;
    function startCover() {
      if (cover) return;
      cover = ce('div', 'memory-cover', '🧠 Sjećaš li se?');
      layer.appendChild(cover);
    }
    function removeCover() {
      if (cover) { cover.remove(); cover = null; }
      if (timerId) { clearInterval(timerId); timerId = null; }
    }
    showBtn.addEventListener('click', () => {
      removeCover();
      let t = lst.seconds;
      timerEl.textContent = `⏳ ${t}s`;
      timerId = setInterval(() => {
        t--;
        if (t <= 0) {
          startCover();
          timerEl.textContent = 'Vrijeme je isteklo – pokušaj se prisjetiti!';
          clearInterval(timerId); timerId = null;
        } else timerEl.textContent = `⏳ ${t}s`;
      }, 1000);
    });
    hideBtn.addEventListener('click', () => { startCover(); if (timerId) { clearInterval(timerId); timerId = null; } timerEl.textContent = ''; });

    const recallWrap = ce('div', 'recall-wrap');
    if (lst.recall === 'textarea') {
      const ta = document.createElement('textarea');
      ta.className = 'qa-input'; ta.placeholder = 'Upiši riječi kojih se sjećaš…';
      ta.value = recalls[li] || '';
      ta.addEventListener('input', () => { recalls[li] = ta.value; Store.patch(pageNum, { recalls }); });
      recallWrap.appendChild(ta);
    } else if (lst.recall === 'grid') {
      const arr = recalls[li] || [];
      const grid = ce('div', 'recall-grid');
      for (let i = 0; i < lst.words.length; i++) {
        const inp = document.createElement('input');
        inp.type = 'text'; inp.className = 'qa-input small'; inp.placeholder = (i + 1) + '.';
        inp.value = arr[i] || '';
        inp.addEventListener('input', () => {
          const cur = recalls[li] || []; cur[i] = inp.value; recalls[li] = cur; Store.patch(pageNum, { recalls });
        });
        grid.appendChild(inp);
      }
      recallWrap.appendChild(grid);
    } else {
      const inp = document.createElement('input');
      inp.type = 'text'; inp.className = 'qa-input'; inp.placeholder = 'Upiši niz…';
      inp.value = recalls[li] || '';
      inp.addEventListener('input', () => { recalls[li] = inp.value; Store.patch(pageNum, { recalls }); });
      recallWrap.appendChild(inp);
    }
    box.appendChild(recallWrap);

    const solBox = ce('div', 'solution-box hidden', '✅ ' + (lst.words ? lst.words.join(', ') : lst.value));
    box.appendChild(solBox);
    revealBtn.addEventListener('click', () => solBox.classList.toggle('hidden'));

    panel.appendChild(box);
  });
}

// ---- table-fill ----
function renderTableFill(pageNum, cfg, panel) {
  buildHintBlock(panel, cfg, pageNum);
  const state = Store.get(pageNum);
  const vals = state.vals || {};

  const table = document.createElement('table');
  table.className = 'fill-table';
  const thead = document.createElement('tr');
  thead.appendChild(ce('th', '', 'Razred'));
  cfg.cols.forEach(c => thead.appendChild(ce('th', '', c)));
  table.appendChild(thead);

  cfg.rows.forEach((r, ri) => {
    const tr = document.createElement('tr');
    tr.appendChild(ce('td', 'row-label', r.label));
    r.answers.forEach((ans, ci) => {
      const td = document.createElement('td');
      const inp = document.createElement('input');
      inp.type = 'text'; inp.className = 'qa-input small';
      const key = ri + '_' + ci;
      inp.value = vals[key] || '';
      inp.addEventListener('input', () => { vals[key] = inp.value; Store.patch(pageNum, { vals }); });
      td.appendChild(inp);
      tr.appendChild(td);
    });
    table.appendChild(tr);
  });
  panel.appendChild(table);

  const btn = ce('button', 'check-btn', '✅ Provjeri tablicu');
  btn.addEventListener('click', () => {
    const rows = table.querySelectorAll('tr');
    cfg.rows.forEach((r, ri) => {
      r.answers.forEach((ans, ci) => {
        const inp = rows[ri + 1].querySelectorAll('input')[ci];
        inp.style.background = isCorrect(inp.value, ans) ? '#dcfce7' : '#fee2e2';
      });
    });
  });
  panel.appendChild(btn);
}

// ---- assign (bez provjere) ----
function renderAssign(pageNum, cfg, panel) {
  buildHintBlock(panel, cfg, pageNum);
  const state = Store.get(pageNum);
  const vals = state.vals || {};
  const wrap = ce('div', 'assign-wrap');

  for (let i = 0; i < cfg.slots; i++) {
    const row = ce('div', 'assign-row');
    row.appendChild(ce('div', 'qa-label', (i + 1) + '. mjesto'));
    const sel = document.createElement('select');
    sel.className = 'qa-select';
    const empty = document.createElement('option'); empty.value = ''; empty.textContent = '—'; sel.appendChild(empty);
    cfg.names.forEach(n => {
      const o = document.createElement('option'); o.value = n; o.textContent = n; sel.appendChild(o);
    });
    sel.value = vals[i] || '';
    sel.addEventListener('change', () => { vals[i] = sel.value; Store.patch(pageNum, { vals }); });
    row.appendChild(sel);
    wrap.appendChild(row);
  }
  panel.appendChild(wrap);
}

// ---- order-panel ----
function renderOrderPanel(pageNum, cfg, panel) {
  buildHintBlock(panel, cfg, pageNum);
  const state = Store.get(pageNum);
  const vals = state.vals || {};

  cfg.tasks.forEach((task, ti) => {
    const box = ce('div', 'order-box');
    box.appendChild(ce('div', 'qa-label', task.title));
    task.sentences.forEach((s, si) => {
      const row = ce('div', 'order-row');
      const sel = document.createElement('select');
      sel.className = 'order-select';
      const key = ti + '_' + si;
      const empty = document.createElement('option'); empty.value = ''; empty.textContent = '?';
      sel.appendChild(empty);
      for (let n = 1; n <= task.sentences.length; n++) {
        const o = document.createElement('option'); o.value = n; o.textContent = n; sel.appendChild(o);
      }
      sel.value = vals[key] || '';
      sel.addEventListener('change', () => { vals[key] = sel.value; Store.patch(pageNum, { vals }); });
      row.appendChild(sel);
      row.appendChild(ce('div', 'order-text', s));
      box.appendChild(row);
    });
    panel.appendChild(box);
  });

  const btn = ce('button', 'check-btn', '✅ Provjeri redoslijed');
  btn.addEventListener('click', () => {
    let allOk = true;
    cfg.tasks.forEach((task, ti) => {
      task.sentences.forEach((s, si) => {
        const key = ti + '_' + si;
        if (parseInt(vals[key]) !== task.answer[si]) allOk = false;
      });
    });
    alert(allOk ? '🎉 Odličan redoslijed!' : 'Nešto nije na svom mjestu – pokušaj ponovno.');
  });
  panel.appendChild(btn);
}

// ---- self-assessment ----
function renderSelfAssessment(pageNum, panel) {
  buildHintBlock(panel, { hint: '👉 Dodirni ono što te najbolje opisuje.' }, pageNum);
  const state = Store.get(pageNum);
  const data = state.data || {};

  function scaleRow(title, options, key) {
    const box = ce('div', 'assess-box');
    box.appendChild(ce('div', 'qa-label', title));
    const row = ce('div', 'assess-row');
    options.forEach(opt => {
      const chip = ce('button', 'assess-chip' + (data[key] === opt.v ? ' selected' : ''), opt.label);
      chip.addEventListener('click', () => {
        data[key] = opt.v; Store.patch(pageNum, { data });
        row.querySelectorAll('.assess-chip').forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
      });
      row.appendChild(chip);
    });
    box.appendChild(row);
    panel.appendChild(box);
  }

  scaleRow('Kako sam se osjećao/osjećala?', [
    { v: 1, label: '😀 Odlično' }, { v: 2, label: '🙂 Dobro' }, { v: 3, label: '😐 Tako-tako' },
    { v: 4, label: '🙁 Loše' }, { v: 5, label: '😣 Vrlo loše' }
  ], 'feel');

  scaleRow('Koliko su zadaci bili teški?', [
    { v: 1, label: '1 – Vrlo lagani' }, { v: 2, label: '2 – Lagani' }, { v: 3, label: '3 – Umjereni' },
    { v: 4, label: '4 – Teški' }, { v: 5, label: '5 – Jako teški' }
  ], 'diff');

  scaleRow('Koliko sam uspješno radio/la?', [
    { v: 1, label: '1 – Slabo' }, { v: 2, label: '2 – Moglo bolje' }, { v: 3, label: '3 – Ok' },
    { v: 4, label: '4 – Dobro' }, { v: 5, label: '5 – Odlično' }
  ], 'success');

  const box = ce('div', 'assess-box');
  box.appendChild(ce('div', 'qa-label', 'Nešto što bih sljedeći put napravio/napravila drugačije:'));
  const ta = document.createElement('textarea');
  ta.className = 'qa-input'; ta.value = data.note || '';
  ta.addEventListener('input', () => { data.note = ta.value; Store.patch(pageNum, { data }); });
  box.appendChild(ta);
  panel.appendChild(box);
}

// ---- diploma ----
function renderDiploma(pageNum, panel) {
  buildHintBlock(panel, { hint: '👉 Upiši svoje ime i prezime na diplomu!' }, pageNum);
  const state = Store.get(pageNum);
  const box = ce('div', 'diploma-box');
  const inp = document.createElement('input');
  inp.type = 'text'; inp.className = 'diploma-input'; inp.placeholder = 'Ime i prezime';
  inp.value = state.name || '';
  inp.addEventListener('input', () => { Store.patch(pageNum, { name: inp.value }); });
  box.appendChild(inp);
  panel.appendChild(box);
}

/* ---------------------------------------------------------------------
   5) DISPATCHER
   --------------------------------------------------------------------- */

function renderInteractiveElements(pageNum, cfg) {
  runPageCleanup();

  // "Resetiramo" interactive-layer kloniranjem, da uklonimo SVE stare
  // event listenere zakačene na njega u prijašnjim posjetima ove stranice.
  const oldLayer = document.getElementById('interactive-layer');
  const layer = oldLayer.cloneNode(false);
  oldLayer.replaceWith(layer);

  taskPanel.innerHTML = '';

  if (!cfg) {
    pageViewport.classList.remove('with-panel');
    return;
  }
  pageViewport.classList.add('with-panel');

  switch (cfg.type) {
    case 'drag-rings': renderDragRings(pageNum, cfg, taskPanel); break;
    case 'tally-mark': renderTallyMark(pageNum, cfg, taskPanel); break;
    case 'draw-canvas': renderDrawCanvas(pageNum, cfg, taskPanel); break;
    case 'text-panel': renderTextPanel(pageNum, cfg, taskPanel); break;
    case 'choice-fill': renderChoiceFill(pageNum, cfg, taskPanel); break;
    case 'matching': renderMatching(pageNum, cfg, taskPanel); break;
    case 'choice-panel': renderChoicePanel(pageNum, cfg, taskPanel); break;
    case 'truefalse': renderTrueFalse(pageNum, cfg, taskPanel); break;
    case 'choice-groups': renderChoiceGroups(pageNum, cfg, taskPanel); break;
    case 'memory': renderMemory(pageNum, cfg, taskPanel); break;
    case 'table-fill': renderTableFill(pageNum, cfg, taskPanel); break;
    case 'assign': renderAssign(pageNum, cfg, taskPanel); break;
    case 'order-panel': renderOrderPanel(pageNum, cfg, taskPanel); break;
    case 'self-assessment': renderSelfAssessment(pageNum, taskPanel); break;
    case 'diploma': renderDiploma(pageNum, taskPanel); break;
	case 'checklist': renderChecklist(pageNum, cfg, taskPanel); break;
    default: pageViewport.classList.remove('with-panel');
  }
}

/* ---------------------------------------------------------------------
   6) NAVIGACIJA (stranice, swipe, dropdown)
   --------------------------------------------------------------------- */

let currentIndex = 0;

const bgImage = document.getElementById('bg-image');
const pageViewport = document.querySelector('.page-viewport');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const pageSelect = document.getElementById('page-select');
const pageIndicator = document.getElementById('page-indicator');
const pageSubtitle = document.getElementById('page-subtitle');
const swipeArea = document.getElementById('swipe-area');

// Task panel se stvara jednom i ostaje u DOM-u (puni se/prazni po stranici)
const taskPanel = ce('div', 'task-panel');
pageViewport.appendChild(taskPanel);

function initPageSelect() {
  pageSelect.innerHTML = '';
  validPages.forEach((pageNum, index) => {
    const opt = document.createElement('option');
    opt.value = index;
    opt.textContent = `${pageNum}`;
    pageSelect.appendChild(opt);
  });
}

function loadPageByIndex(index) {
  if (index < 0 || index >= validPages.length) return;
  currentIndex = index;
  const pageNum = validPages[currentIndex];

  bgImage.src = `images/${pageNum}.png`;
  pageSelect.value = currentIndex;
  pageIndicator.textContent = `Stranica ${pageNum} / 50`;
  pageSubtitle.textContent = cjelinaFor(pageNum);

  btnPrev.disabled = currentIndex === 0;
  btnNext.disabled = currentIndex === validPages.length - 1;

  const cfg = pagesConfig[pageNum];
  renderInteractiveElements(pageNum, cfg);
}

btnPrev.addEventListener('click', () => {
  if (currentIndex > 0) loadPageByIndex(currentIndex - 1);
});
btnNext.addEventListener('click', () => {
  if (currentIndex < validPages.length - 1) loadPageByIndex(currentIndex + 1);
});
pageSelect.addEventListener('change', (e) => {
  loadPageByIndex(parseInt(e.target.value));
});

/* ---------------------------------------------------------------------
   7) POKRETANJE
   --------------------------------------------------------------------- */

initPageSelect();
loadPageByIndex(0);
