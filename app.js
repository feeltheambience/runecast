const API_BASE = window.location.origin;
const tg = window.Telegram?.WebApp;

let allDecks = [];
let currentDeckId = null;
let allCards = [];
let allSpreads = [];
let selectedSpreadId = null;
let currentPosition = 0;
let filledPositions = [];
let currentSuitFilter = "all";

// ── Init ──

document.addEventListener("DOMContentLoaded", async () => {
    if (tg) { tg.ready(); tg.expand(); }
    await loadDecks();
    bindEvents();
});

async function loadDecks() {
    try {
        const resp = await fetch(`${API_BASE}/api/decks`);
        allDecks = await resp.json();
    } catch {
        allDecks = [
            {id:"runes", name:"Руны", description:"Старший Футарк — 24 руны", icon:"ᚱ"},
            {id:"tarot_full", name:"Таро", description:"Полная колода — 78 карт", icon:"🃏"},
            {id:"tarot_major", name:"Старшие Арканы", description:"22 карты Старших Арканов", icon:"✦"},
        ];
    }
    renderDeckList();
}

async function loadCardsAndSpreads(deckId) {
    try {
        const [cardsResp, spreadsResp] = await Promise.all([
            fetch(`${API_BASE}/api/cards/${deckId}`),
            fetch(`${API_BASE}/api/spreads?deck=${deckId}`),
        ]);
        allCards = await cardsResp.json();
        allSpreads = await spreadsResp.json();
    } catch {
        allCards = [];
        allSpreads = [];
    }

    if (!allCards.length) loadFallbackCards(deckId);
    if (!allSpreads.length) loadFallbackSpreads();
}

// ── Fallback data ──

function loadFallbackCards(deckId) {
    const runes = [
        {id:"fehu",name:"Феху",symbol:"ᚠ",reversible:true},{id:"uruz",name:"Уруз",symbol:"ᚢ",reversible:true},
        {id:"thurisaz",name:"Турисаз",symbol:"ᚦ",reversible:true},{id:"ansuz",name:"Ансуз",symbol:"ᚨ",reversible:true},
        {id:"raidho",name:"Райдо",symbol:"ᚱ",reversible:true},{id:"kenaz",name:"Кано",symbol:"ᚲ",reversible:true},
        {id:"gebo",name:"Гебо",symbol:"ᚷ",reversible:false},{id:"wunjo",name:"Вуньо",symbol:"ᚹ",reversible:true},
        {id:"hagalaz",name:"Хагалаз",symbol:"ᚺ",reversible:false},{id:"nauthiz",name:"Наутиз",symbol:"ᚾ",reversible:true},
        {id:"isa",name:"Иса",symbol:"ᛁ",reversible:false},{id:"jera",name:"Йера",symbol:"ᛃ",reversible:false},
        {id:"eihwaz",name:"Эйваз",symbol:"ᛇ",reversible:false},{id:"perthro",name:"Перт",symbol:"ᛈ",reversible:true},
        {id:"algiz",name:"Альгиз",symbol:"ᛉ",reversible:true},{id:"sowilo",name:"Соулу",symbol:"ᛊ",reversible:false},
        {id:"tiwaz",name:"Тейваз",symbol:"ᛏ",reversible:true},{id:"berkano",name:"Беркана",symbol:"ᛒ",reversible:true},
        {id:"ehwaz",name:"Эваз",symbol:"ᛖ",reversible:true},{id:"mannaz",name:"Манназ",symbol:"ᛗ",reversible:true},
        {id:"laguz",name:"Лагуз",symbol:"ᛚ",reversible:true},{id:"ingwaz",name:"Ингуз",symbol:"ᛝ",reversible:false},
        {id:"dagaz",name:"Дагаз",symbol:"ᛞ",reversible:false},{id:"othala",name:"Отала",symbol:"ᛟ",reversible:true},
    ];
    if (deckId === "runes") { allCards = runes; return; }

    const major = [
        {id:"fool",name:"Шут",symbol:"0",reversible:true},
        {id:"magician",name:"Маг",symbol:"I",reversible:true},
        {id:"high_priestess",name:"Верховная Жрица",symbol:"II",reversible:true},
        {id:"empress",name:"Императрица",symbol:"III",reversible:true},
        {id:"emperor",name:"Император",symbol:"IV",reversible:true},
        {id:"hierophant",name:"Иерофант",symbol:"V",reversible:true},
        {id:"lovers",name:"Влюблённые",symbol:"VI",reversible:true},
        {id:"chariot",name:"Колесница",symbol:"VII",reversible:true},
        {id:"strength",name:"Сила",symbol:"VIII",reversible:true},
        {id:"hermit",name:"Отшельник",symbol:"IX",reversible:true},
        {id:"wheel",name:"Колесо Фортуны",symbol:"X",reversible:true},
        {id:"justice",name:"Справедливость",symbol:"XI",reversible:true},
        {id:"hanged_man",name:"Повешенный",symbol:"XII",reversible:true},
        {id:"death",name:"Смерть",symbol:"XIII",reversible:true},
        {id:"temperance",name:"Умеренность",symbol:"XIV",reversible:true},
        {id:"devil",name:"Дьявол",symbol:"XV",reversible:true},
        {id:"tower",name:"Башня",symbol:"XVI",reversible:true},
        {id:"star",name:"Звезда",symbol:"XVII",reversible:true},
        {id:"moon",name:"Луна",symbol:"XVIII",reversible:true},
        {id:"sun",name:"Солнце",symbol:"XIX",reversible:true},
        {id:"judgement",name:"Суд",symbol:"XX",reversible:true},
        {id:"world",name:"Мир",symbol:"XXI",reversible:true},
    ];
    if (deckId === "tarot_major") { allCards = major; return; }
    allCards = major; // tarot_full fallback shows at least major
}

function loadFallbackSpreads() {
    allSpreads = [
        {id:"single",name:"Карта дня",description:"Одна карта — совет",hint:"Для быстрого совета или ежедневной практики",
         positions:[{index:0,name:"Послание",description:"Основной совет"}],layout:"single"},
        {id:"three",name:"Три карты",description:"Прошлое — Настоящее — Будущее",hint:"Обзор развития ситуации во времени",
         positions:[{index:0,name:"Прошлое",description:"Что повлияло"},{index:1,name:"Настоящее",description:"Текущее состояние"},{index:2,name:"Будущее",description:"К чему ведёт"}],layout:"row"},
        {id:"cross",name:"Крест",description:"Глубокий анализ ситуации",hint:"Для серьёзных вопросов",
         positions:[{index:0,name:"Суть",description:"Суть ситуации"},{index:1,name:"Прошлое",description:"Что привело"},{index:2,name:"Будущее",description:"Куда движется"},{index:3,name:"Совет",description:"Что поможет"},{index:4,name:"Итог",description:"Результат"}],layout:"cross"},
    ];
}

// ── Events ──

function bindEvents() {
    document.getElementById("btn-start").addEventListener("click", goToSpread);
    document.getElementById("btn-back-deck").addEventListener("click", goToDeck);
    document.getElementById("btn-back").addEventListener("click", goToQuery);
    document.getElementById("btn-interpret").addEventListener("click", doInterpret);
    document.getElementById("btn-reset").addEventListener("click", resetSpread);
    document.getElementById("query-input").addEventListener("input", updateStartBtn);
    const backResult = document.getElementById("btn-back-result");
    if (backResult) backResult.addEventListener("click", resetAll);
}

function updateStartBtn() {
    const q = document.getElementById("query-input").value.trim();
    document.getElementById("btn-start").disabled = !q || !selectedSpreadId;
}

// ── Navigation ──

function showScreen(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById(id).classList.add("active");
    window.scrollTo(0, 0);
}

function goToDeck() { showScreen("screen-deck"); }

function goToQuery() { showScreen("screen-query"); }

async function selectDeck(deckId) {
    currentDeckId = deckId;
    const deck = allDecks.find(d => d.id === deckId);
    document.getElementById("deck-title").textContent = deck.name;
    await loadCardsAndSpreads(deckId);
    selectedSpreadId = null;
    document.getElementById("query-input").value = "";
    renderSpreadList();
    updateStartBtn();
    showScreen("screen-query");
}

function goToSpread() {
    showScreen("screen-spread");
    const spread = allSpreads.find(s => s.id === selectedSpreadId);
    document.getElementById("spread-title").textContent = spread.name;
    resetSpread();
}

function resetAll() {
    currentDeckId = null;
    selectedSpreadId = null;
    showScreen("screen-deck");
}

// ── Deck list ──

function renderDeckList() {
    const el = document.getElementById("deck-list");
    el.innerHTML = "";
    allDecks.forEach(deck => {
        const div = document.createElement("div");
        div.className = "deck-option";
        div.innerHTML = `
            <span class="deck-icon">${deck.icon}</span>
            <div class="deck-info">
                <div class="deck-name">${deck.name}</div>
                <div class="deck-desc">${deck.description}</div>
            </div>
            <span class="arrow">›</span>
        `;
        div.addEventListener("click", () => selectDeck(deck.id));
        el.appendChild(div);
    });
}

// ── Spread list ──

function renderSpreadList() {
    const el = document.getElementById("spread-list");
    el.innerHTML = "";
    allSpreads.forEach(sp => {
        const div = document.createElement("div");
        div.className = "spread-option";
        const countWord = currentDeckId === "runes" ? runeWord(sp.positions.length) : cardWord(sp.positions.length);
        div.innerHTML = `
            <div class="spread-option-name">${sp.name}</div>
            <div class="spread-option-desc">${sp.description}</div>
            ${sp.hint ? `<div class="spread-option-hint">💡 ${sp.hint}</div>` : ""}
            <div class="spread-option-count">${sp.positions.length} ${countWord}</div>
        `;
        div.addEventListener("click", () => {
            document.querySelectorAll(".spread-option").forEach(o => o.classList.remove("selected"));
            div.classList.add("selected");
            selectedSpreadId = sp.id;
            updateStartBtn();
        });
        el.appendChild(div);
    });
}

function runeWord(n) { return n === 1 ? "руна" : n <= 4 ? "руны" : "рун"; }
function cardWord(n) { return n === 1 ? "карта" : n <= 4 ? "карты" : "карт"; }

// ── Spread layout ──

function resetSpread() {
    const spread = allSpreads.find(s => s.id === selectedSpreadId);
    if (!spread) return;
    currentPosition = 0;
    filledPositions = spread.positions.map(() => null);
    currentSuitFilter = "all";
    renderSpreadLayout();
    renderSuitFilter();
    renderCardGrid();
    updateInterpretBtn();
    updateHint();
}

function renderSpreadLayout() {
    const spread = allSpreads.find(s => s.id === selectedSpreadId);
    const el = document.getElementById("spread-layout");
    el.className = `spread-layout layout-${spread.layout}`;
    el.innerHTML = "";

    spread.positions.forEach((pos, i) => {
        const slot = document.createElement("div");
        slot.className = `position-slot pos-${i}`;
        slot.dataset.index = i;

        if (filledPositions[i]) {
            slot.classList.add("filled");
            if (filledPositions[i].reversed) slot.classList.add("reversed");
            slot.innerHTML = `
                <span class="card-in-slot">${filledPositions[i].symbol}</span>
                <span class="pos-label">${pos.name}</span>
                ${filledPositions[i].reversed ? '<span class="reversed-badge">перев.</span>' : ''}
            `;
            slot.addEventListener("click", () => toggleReversed(i));
        } else {
            if (i === currentPosition) slot.classList.add("active");
            slot.innerHTML = `
                <span class="pos-number">${i + 1}</span>
                <span class="pos-label">${pos.name}</span>
            `;
        }

        el.appendChild(slot);
    });
}

function toggleReversed(index) {
    const filled = filledPositions[index];
    if (!filled) return;
    const cardData = allCards.find(c => c.id === filled.id);
    if (cardData && !cardData.reversible) return;
    filled.reversed = !filled.reversed;
    renderSpreadLayout();
}

// ── Suit filter ──

function renderSuitFilter() {
    const el = document.getElementById("suit-filter");
    if (currentDeckId !== "tarot_full") { el.style.display = "none"; return; }
    el.style.display = "flex";
    el.innerHTML = "";

    const suits = [
        {id: "all", label: "Все"},
        {id: "major", label: "Старшие"},
        {id: "wands", label: "♣ Жезлы"},
        {id: "cups", label: "♥ Кубки"},
        {id: "swords", label: "♠ Мечи"},
        {id: "pentacles", label: "♦ Пентакли"},
    ];

    suits.forEach(s => {
        const btn = document.createElement("button");
        btn.className = "suit-btn" + (currentSuitFilter === s.id ? " active" : "");
        btn.textContent = s.label;
        btn.addEventListener("click", () => {
            currentSuitFilter = s.id;
            renderSuitFilter();
            renderCardGrid();
        });
        el.appendChild(btn);
    });
}

// ── Card grid ──

function renderCardGrid() {
    const el = document.getElementById("card-grid");
    el.innerHTML = "";
    const usedIds = new Set(filledPositions.filter(Boolean).map(f => f.id));

    let cards = allCards;
    if (currentDeckId === "tarot_full" && currentSuitFilter !== "all") {
        if (currentSuitFilter === "major") {
            cards = allCards.filter(c => !c.suit || c.suit === "major");
        } else {
            cards = allCards.filter(c => c.suit === currentSuitFilter);
        }
    }

    cards.forEach(card => {
        const item = document.createElement("div");
        let suitClass = "";
        if (card.suit && card.suit !== "major") suitClass = ` suit-${card.suit}`;
        item.className = "card-item" + suitClass;
        if (usedIds.has(card.id)) item.classList.add("used");
        item.innerHTML = `
            <div class="card-sym">${card.symbol}</div>
            <div class="card-nm">${card.name}</div>
        `;
        item.addEventListener("click", () => placeCard(card));
        el.appendChild(item);
    });
}

function placeCard(card) {
    const spread = allSpreads.find(s => s.id === selectedSpreadId);
    if (currentPosition >= spread.positions.length) return;
    if (filledPositions.some(f => f && f.id === card.id)) return;

    filledPositions[currentPosition] = {
        id: card.id,
        symbol: card.symbol,
        name: card.name,
        reversed: false,
    };

    currentPosition++;
    while (currentPosition < spread.positions.length && filledPositions[currentPosition]) {
        currentPosition++;
    }

    renderSpreadLayout();
    renderCardGrid();
    updateInterpretBtn();
    updateHint();
}

function updateHint() {
    const spread = allSpreads.find(s => s.id === selectedSpreadId);
    const hint = document.getElementById("position-hint");
    if (currentPosition < spread.positions.length) {
        const pos = spread.positions[currentPosition];
        hint.textContent = `Позиция ${currentPosition + 1}: ${pos.name} — ${pos.description}`;
    } else {
        hint.textContent = "Все позиции заполнены. Нажми на карту в раскладе, чтобы перевернуть.";
    }
}

function updateInterpretBtn() {
    const allFilled = filledPositions.length > 0 && filledPositions.every(f => f !== null);
    const btn = document.getElementById("btn-interpret");
    if (allFilled) {
        btn.classList.remove("btn-disabled");
    } else {
        btn.classList.add("btn-disabled");
    }
    // Also remove HTML disabled attribute in case it was set
    btn.removeAttribute("disabled");
}

// ── Interpret ──

function doInterpret() {
    // Validate — all positions must be filled
    const allFilled = filledPositions.length > 0 && filledPositions.every(f => f !== null);
    if (!allFilled) {
        const hint = document.getElementById("position-hint");
        hint.textContent = "⚠️ Заполни все позиции!";
        hint.style.color = "#c04050";
        setTimeout(() => { hint.style.color = ""; updateHint(); }, 2000);
        return;
    }

    const query = document.getElementById("query-input").value.trim();
    const spread = allSpreads.find(s => s.id === selectedSpreadId);

    const cards = filledPositions.map((f, i) => ({
        position: i,
        rune_id: f.id,
        name: f.name,
        symbol: f.symbol,
        reversed: f.reversed,
        pos_name: spread.positions[i].name,
    }));

    const payload = JSON.stringify({
        query,
        deck_id: currentDeckId,
        spread_id: selectedSpreadId,
        spread_name: spread.name,
        runes: cards,
    });

    // Show confirmation in-app before sending
    renderResult(spread);

    // Send data to Telegram bot — bot will call LLM and reply in chat
    if (tg && tg.sendData) {
        try {
            tg.sendData(payload);
        } catch (e) {
            // sendData might fail if opened via inline button
            document.getElementById("result-text").innerHTML =
                '<b style="color:var(--danger)">Открой расклад через кнопку «✦ Расклад» внизу чата (не через инлайн-кнопку).</b>';
        }
    } else {
        document.getElementById("result-text").innerHTML =
            '<b>Данные расклада:</b><br><pre style="font-size:12px;overflow-x:auto">' + payload + '</pre>';
    }

    showScreen("screen-result");
}

function renderResult(spread) {
    const summary = document.getElementById("result-spread-summary");
    summary.innerHTML = "";
    filledPositions.forEach((f, i) => {
        const chip = document.createElement("span");
        chip.className = "result-card-chip" + (f.reversed ? " reversed" : "");
        chip.innerHTML = `
            <span class="chip-sym">${f.symbol}</span>
            <span>${f.name}</span>
            <span class="chip-pos">${spread.positions[i].name}</span>
        `;
        summary.appendChild(chip);
    });
    document.getElementById("result-text").innerHTML =
        '⏳ <b>Отправлено!</b><br>Толкование придёт сообщением в чат.';
}

// ── Loading ──

const loadingSymbols = "ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛝᛞᛟ";
let loadingInterval;

function showLoading(show) {
    const el = document.getElementById("loading");
    if (show) {
        el.classList.add("active");
        let idx = 0;
        loadingInterval = setInterval(() => {
            document.getElementById("loading-rune").textContent = loadingSymbols[idx % loadingSymbols.length];
            idx++;
        }, 150);
    } else {
        el.classList.remove("active");
        clearInterval(loadingInterval);
    }
}
