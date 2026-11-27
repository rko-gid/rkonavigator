/**
 * =======================================================================
 * ЛОГИКА ВИТРИНЫ РКО, КАЛЬКУЛЯТОРА И СКВОЗНОГО ТРЕКИНГА (APP.JS)
 * =======================================================================
 */

document.addEventListener("DOMContentLoaded", function () {
    syncCardsWithConfig();
    initPartnerLinksAndTracking();
    initBankFilters();
    initQuizAssistant();
    initRatingViewSwitcher();
    initTariffCalculator();
    initDetailsToggles();
    initFaqAccordion();
    initLeadForm();
});

/**
 * 0. Синхронизация данных карточек на сайте с файлом config.js
 * Автоматически обновляет текст бонуса, стоимость обслуживания, лимиты вывода и рейтинг
 */
function syncCardsWithConfig() {
    const config = window.RKO_CONFIG || {};
    const banks = config.banks || {};

    const cards = document.querySelectorAll(".bank-card");
    cards.forEach(card => {
        const btn = card.querySelector("[data-bank]");
        if (!btn) return;
        const bankKey = btn.getAttribute("data-bank");
        const bankData = banks[bankKey];
        if (!bankData) return;

        // 1. Название банка
        if (bankData.name) {
            const h3 = card.querySelector("h3");
            if (h3) h3.textContent = bankData.name;
        }

        // 2. Текст бонуса
        if (bankData.bonusText) {
            const bonusEl = card.querySelector(".bonus-alert");
            if (bonusEl) bonusEl.textContent = bankData.bonusText;
        }

        // 3. Рейтинг банка
        if (bankData.rating) {
            const badges = card.querySelectorAll(".badge");
            badges.forEach(b => {
                if (b.textContent.includes("РЕЙТИНГ") || b.textContent.includes("★")) {
                    b.textContent = `РЕЙТИНГ ${bankData.rating} ★`;
                }
            });
        }

        // 4. Характеристики тарифа в карточке
        const specBoxes = card.querySelectorAll(".spec-box");
        specBoxes.forEach(box => {
            const nameEl = box.querySelector(".spec-name");
            const valEl = box.querySelector(".spec-val");
            if (!nameEl || !valEl) return;
            const nameText = nameEl.textContent.toLowerCase();

            if (nameText.includes("обслуживан") || nameText.includes("стоимост")) {
                if (bankData.monthlyFee) valEl.textContent = bankData.monthlyFee;
            } else if (nameText.includes("перевод себе") || nameText.includes("вывод на физлиц") || nameText.includes("вывод себе")) {
                if (bankData.limitFreeCash) valEl.textContent = bankData.limitFreeCash;
            }
        });
    });
}

/**
 * 1. Инициализация партнерских ссылок и динамическая сквозная разметка SubID
 */
function initPartnerLinksAndTracking() {
    const config = window.RKO_CONFIG || {};
    const banks = config.banks || {};

    // Извлекаем UTM-метки из текущей адресной строки браузера
    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get("utm_source") || "direct";
    const utmCampaign = urlParams.get("utm_campaign") || "organic";
    const utmContent = urlParams.get("utm_content") || "web";

    // Собираем сквозной SubID для передачи в CPA-сеть
    const subIdValue = encodeURIComponent(`${utmSource}_${utmContent}`);

    // Находим все кнопки открытия счета и регистрации с дата-атрибутом data-bank
    const bankButtons = document.querySelectorAll("[data-bank]");
    bankButtons.forEach(btn => {
        const bankKey = btn.getAttribute("data-bank");
        const actionType = btn.getAttribute("data-action"); // "reg", "acquiring" или null
        
        if (banks[bankKey]) {
            let baseUrl = banks[bankKey].partnerUrl;
            if (actionType === "reg" && banks[bankKey].partnerRegUrl) {
                baseUrl = banks[bankKey].partnerRegUrl;
            } else if (actionType === "acquiring" && banks[bankKey].partnerAcquiringUrl) {
                baseUrl = banks[bankKey].partnerAcquiringUrl;
            } else if (actionType === "internet_acquiring" && banks[bankKey].partnerInternetAcquiringUrl) {
                baseUrl = banks[bankKey].partnerInternetAcquiringUrl;
            }

            if (baseUrl) {
                // Защита для офферов со строгими правилами по источникам (БСПБ):
                // Если пользователь пришел из соцсетей или контекста, не передаем эти метки в ссылку БСПБ
                let effectiveSubId = subIdValue;
                let effectiveCampaign = utmCampaign;
                if (bankKey === "bspb") {
                    effectiveSubId = "site_showcase";
                    effectiveCampaign = "organic";
                }

                let separator = baseUrl.includes("?") ? "&" : "?";
                let finalUrl = baseUrl;
                if (baseUrl.includes("leads.su")) {
                    finalUrl = `${baseUrl}${separator}aff_sub1=${effectiveSubId}&aff_sub2=${effectiveCampaign}`;
                } else if (baseUrl.includes("admitad.com")) {
                    finalUrl = `${baseUrl}${separator}subid=${effectiveSubId}&subid1=${effectiveCampaign}`;
                } else if (baseUrl.includes("pampadu.ru")) {
                    finalUrl = `${baseUrl}${separator}partner_id=${effectiveSubId}`;
                } else {
                    finalUrl = `${baseUrl}${separator}sub1=${effectiveSubId}&sub2=${effectiveCampaign}`;
                }

                btn.setAttribute("href", finalUrl);
            }
        }

        // Навешиваем событие клика для Яндекс.Метрики
        btn.onclick = function () {
            let goalName = `${bankKey}_click`;
            if (actionType === "reg") goalName = `${bankKey}_reg_click`;
            if (actionType === "acquiring") goalName = `${bankKey}_acq_click`;
            if (actionType === "internet_acquiring") goalName = `${bankKey}_iacq_click`;
            sendMetrikaGoal(goalName);
        };
    });

    // Обновляем ссылки на Telegram-канал и бота из конфига
    const tgChannelLinks = document.querySelectorAll(".link-tg-channel");
    tgChannelLinks.forEach(link => {
        if (config.telegramChannelUrl) link.setAttribute("href", config.telegramChannelUrl);
    });

    const tgBotLinks = document.querySelectorAll(".link-tg-bot");
    tgBotLinks.forEach(link => {
        if (config.telegramBotUrl) {
            link.setAttribute("href", config.telegramBotUrl);
        } else {
            link.style.display = "none";
        }
    });
}

function sendMetrikaGoal(goalName) {
    const config = window.RKO_CONFIG || {};
    const counterId = config.yandexMetrikaId;
    if (typeof window[`yaCounter${counterId}`] !== "undefined") {
        window[`yaCounter${counterId}`].reachGoal(goalName);
    } else if (typeof window.ym !== "undefined") {
        window.ym(counterId, "reachGoal", goalName);
    }
}

/**
 * 2. Фильтрация банков по категориям
 */
function initBankFilters() {
    const filterButtons = document.querySelectorAll(".filter-btn");
    const cards = document.querySelectorAll(".bank-card");
    const tableRows = document.querySelectorAll("#quick-compare-table-wrap tbody tr");

    filterButtons.forEach(btn => {
        btn.addEventListener("click", function () {
            filterButtons.forEach(b => b.classList.remove("active"));
            this.classList.add("active");

            const filterValue = this.getAttribute("data-filter");

            cards.forEach(card => {
                const category = card.getAttribute("data-category") || "";
                const catList = category.split(/\s+/);
                if (filterValue === "all" || catList.includes(filterValue)) {
                    card.style.display = "block";
                } else {
                    card.style.display = "none";
                }
            });

            tableRows.forEach(row => {
                const category = row.getAttribute("data-category") || "all";
                const catList = category.split(/\s+/);
                if (filterValue === "all" || catList.includes(filterValue)) {
                    row.style.display = "";
                } else {
                    row.style.display = "none";
                }
            });
        });
    });
}

/**
 * 2.1 Переключатель вида «Карточки / Таблица сравнения»
 */
function initRatingViewSwitcher() {
    const viewButtons = document.querySelectorAll(".view-tab-btn");
    const cardsList = document.querySelector(".cards-list");
    const tableWrap = document.getElementById("quick-compare-table-wrap");
    if (!viewButtons.length || !cardsList || !tableWrap) return;

    viewButtons.forEach(btn => {
        btn.addEventListener("click", function () {
            viewButtons.forEach(b => b.classList.remove("active"));
            this.classList.add("active");
            const mode = this.getAttribute("data-view");
            if (mode === "table") {
                cardsList.style.display = "none";
                tableWrap.classList.add("active");
            } else {
                tableWrap.classList.remove("active");
                cardsList.style.display = "flex";
            }
        });
    });
}

/**
 * 2.2 Умный экспресс-квиз предквалификации (защита апрува и подбор под статус/город)
 */
function initQuizAssistant() {
    const quizBox = document.getElementById("quiz-assistant");
    if (!quizBox) return;

    const pills = quizBox.querySelectorAll(".quiz-pill");
    const titleEl = document.getElementById("quiz-result-title");
    const reasonEl = document.getElementById("quiz-result-reason");
    const actionsEl = document.getElementById("quiz-result-actions");

    const state = { status: "under30", geo: "all", goal: "mp" };

    function renderRecommendation() {
        let primary = { key: "ozon", name: "Озон Банк", action: null, cta: "Открыть в Озон Банке →" };
        let reserve = { key: "vtb", name: "ВТБ Бизнес", action: null, cta: "Резерв ВТБ (0 ₽ вывод) →" };
        let reason = "";

        if (state.status === "new") {
            // С нуля: только банки с РегБиз + РКО 0 ₽ (никогда не даём Сбер!)
            if (state.goal === "mp") {
                primary = { key: "ozon", name: "Озон Банк", action: "reg", cta: "Открыть ИП / ООО 0 ₽ в Озоне 🚀" };
                reserve = { key: "vtb", name: "ВТБ Бизнес", action: "reg", cta: "Открыть в ВТБ (вывод 0 ₽) →" };
                reason = "Вам нужна бесплатная регистрация бизнеса (0 ₽ пошлина): Озон Банк лучше всего подходит под маркетплейсы, а ВТБ позволит бесплатно выводить всю прибыль.";
            } else if (state.goal === "cash") {
                primary = { key: "vtb", name: "ВТБ Бизнес", action: "reg", cta: "Открыть ИП / ООО 0 ₽ в ВТБ 🚀" };
                reserve = { key: "ozon", name: "Озон Банк", action: "reg", cta: "Резервный счёт в Озоне →" };
                reason = "ВТБ регистрирует ИП и ООО за 0 ₽ без госпошлины, даёт ЭДО на 1 год и 0 ₽ вывод дохода на карту ВТБ без ограничений суммы.";
            } else {
                primary = { key: "alfa", name: "Альфа-Банк", action: "reg", cta: "Открыть ИП / ООО 0 ₽ в Альфе 🚀" };
                reserve = { key: "vtb", name: "ВТБ Бизнес", action: "reg", cta: "Резерв в ВТБ 0 ₽ →" };
                reason = "Альфа-Банк бесплатно зарегистрирует бизнес, даст до 300 000 ₽ бонусов на рекламу и эквайринг под 1% для розницы и услуг.";
            }
        } else if (state.status === "under30") {
            // До 30 дней: СберБизнес исключён (не оплачивается новорегам <30 дней)
            if (state.goal === "mp") {
                primary = { key: "ozon", name: "Озон Банк", action: null, cta: "Открыть счёт в Озон Банке →" };
                reserve = { key: "tochka", name: "Точка Банк", action: null, cta: "Резервный счёт Точка →" };
                reason = "Для бизнеса младше 30 дней Озон Банк даёт 0 ₽ навсегда, до 14,1% на остаток и быстрый вывод выручки WB/Ozon без блокировок.";
            } else if (state.goal === "cash") {
                primary = { key: "vtb", name: "ВТБ Бизнес", action: null, cta: "Открыть счёт в ВТБ →" };
                reserve = { key: "ozon", name: "Озон Банк", action: null, cta: "Резервный счёт Озон (0 ₽) →" };
                reason = "Для молодого ИП ВТБ — №1 по выводу прибыли: 0 ₽ без комиссий и лимитов на личную карту ВТБ + 3 месяца обслуживания за 0 ₽.";
            } else if (state.goal === "acq") {
                primary = { key: "alfa", name: "Альфа-Банк", action: null, cta: "Открыть счёт в Альфе →" };
                reserve = { key: "vtb", name: "ВТБ Бизнес", action: "acquiring", cta: "Эквайринг ВТБ от 1,3% →" };
                reason = "Альфа-Банк даёт льготный эквайринг для розницы и бесплатную бухгалтерию, а ВТБ — выгодные терминалы от 1,3% с бесплатной SIM-картой.";
            } else {
                primary = { key: "tochka", name: "Точка Банк", action: null, cta: "Открыть счёт в Точке →" };
                reserve = { key: "ozon", name: "Озон Банк", action: null, cta: "Резерв Озон Банк →" };
                reason = "Точка даёт скидку 80% на старт, бесплатную бухгалтерию для УСН 6% и помощь по 115-ФЗ с первых дней работы.";
            }
        } else {
            // Действующий бизнес (>30 дней) / ООО
            if (state.goal === "mp") {
                primary = { key: "ozon", name: "Озон Банк", action: null, cta: "Открыть счёт в Озон Банке →" };
                reserve = { key: "vtb", name: "ВТБ Бизнес", action: null, cta: "Резервный ВТБ (0 ₽ вывод) →" };
                reason = "Идеальная связка для селлера: приём платежей и 14,1% годовых в Озоне + 0 ₽ вывод прибыли без ограничений через ВТБ.";
            } else if (state.goal === "cash") {
                primary = { key: "vtb", name: "ВТБ Бизнес", action: null, cta: "Открыть в ВТБ (0 ₽ без лимита) →" };
                reserve = { key: "sber", name: "СберБизнес", action: null, cta: "Сбер (до 300k под 0%) →" };
                reason = "Для бизнеса от 30 дней отличное комбо: безлимитный 0% вывод в ВТБ и до 300 000 ₽/мес на карту Сбера + 0 ₽ платежи контрагентам в Сбере.";
            } else if (state.goal === "acq") {
                primary = { key: "alfa", name: "Альфа-Банк", action: "acquiring", cta: "Подключить эквайринг 1% (Альфа) →" };
                reserve = { key: "psb", name: "Промсвязьбанк (ПСБ)", action: null, cta: "Счёт ПСБ (эквайринг от 0,9%) →" };
                reason = "Действующему бизнесу (>30 дней) доступен промо-эквайринг 1% в Альфа-Банке (0 ₽ аренда) и терминалы от 0,9% в ПСБ из «Белого списка».";
            } else if (state.geo === "top4") {
                primary = { key: "uralsib", name: "Банк Уралсиб", action: null, cta: "Открыть в Уралсибе (19 ₽) →" };
                reserve = { key: "bspb", name: "Банк «Санкт-Петербург»", action: null, cta: "Резерв БСПБ (ВЭД 0,12%) →" };
                reason = "В вашем регионе доступен БСПБ (ВЭД 0,12% и выездной менеджер) и Уралсиб (платежи по 19 ₽ и кэшбэк 7%).";
            } else {
                primary = { key: "sber", name: "СберБизнес", action: null, cta: "Открыть в СберБизнесе →" };
                reserve = { key: "uralsib", name: "Банк Уралсиб", action: null, cta: "Уралсиб (платежки 19 ₽) →" };
                reason = "Для действующих ИП/ООО старше 30 дней СберБизнес даёт бесплатные расчёты с 60% контрагентов в РФ, а Уралсиб — дешёвый межбанк по 19 ₽.";
            }
        }

        if (titleEl) titleEl.textContent = `${primary.name} + ${reserve.name} (резерв)`;
        if (reasonEl) reasonEl.textContent = reason;
        if (actionsEl) {
            const pAttr = primary.action ? `data-action="${primary.action}"` : "";
            const rAttr = reserve.action ? `data-action="${reserve.action}"` : "";
            actionsEl.innerHTML = `
                <a href="#" class="btn-quiz-primary" data-bank="${primary.key}" ${pAttr} target="_blank" rel="sponsored nofollow">${primary.cta}</a>
                <a href="#" class="btn-quiz-reserve" data-bank="${reserve.key}" ${rAttr} target="_blank" rel="sponsored nofollow">${reserve.cta}</a>
            `;
            initPartnerLinksAndTracking();
        }
    }

    pills.forEach(pill => {
        pill.addEventListener("click", function () {
            const groupEl = this.closest(".quiz-pills");
            if (!groupEl) return;
            const groupName = groupEl.getAttribute("data-quiz-group");
            groupEl.querySelectorAll(".quiz-pill").forEach(p => p.classList.remove("active"));
            this.classList.add("active");
            state[groupName] = this.getAttribute("data-val");
            renderRecommendation();
        });
    });

    renderRecommendation();
}

/**
 * 3. Высокоточный математический калькулятор стоимости тарифа РКО (Версия 2.0 Max Conversion)
 * Рассчитывает реальные финансовые расходы в каждом банке:
 * Обслуживание + Платежи сверх бесплатных + Процент комиссии за вывод себе на карту + Эквайринг + Бухгалтерия.
 */
const BANK_TARIFF_MODELS = {
    ozon: {
        key: "ozon",
        name: "Озон Банк",
        tariffName: "Тариф «Базовый»",
        logo: "images/banks/ozon.png",
        badge: "№1 для маркетплейсов и e-commerce",
        perksText: "0 ₽ обслуживание навсегда + доход до 14,1% годовых и до 25 бесплатных платежек",
        hasAcquiring: true,
        hasAccounting: false,
        calc: function (turnover, payments, cashout, currentPreset) {
            const fee = 0;
            // Для селлеров расчеты внутри маркетплейса и 3 внешние платежки — 0 ₽
            const payFee = currentPreset === "seller_mp" ? 0 : Math.max(0, payments - 3) * 49;
            let cashoutFee = 0;
            // Для селлеров маркетплейсов вывод на Ozon Карту физлица — 0% без ограничений!
            if (currentPreset === "seller_mp") {
                cashoutFee = 0;
            } else if (cashout <= 150000) {
                cashoutFee = 0;
            } else if (cashout <= 500000) {
                cashoutFee = (cashout - 150000) * 0.01;
            } else {
                cashoutFee = (350000 * 0.01) + (cashout - 500000) * 0.015;
            }
            return {
                fee,
                payFee,
                cashoutFee,
                total: Math.round(fee + payFee + cashoutFee),
                desc: "0 ₽ обслуживание навсегда для любого бизнеса: розница, услуги, IT и торговля + до 14,1% на остаток."
            };
        }
    },
    tochka: {
        key: "tochka",
        name: "Точка Банк",
        tariffName: "Тариф «Ноль» / «Начало»",
        logo: "images/banks/tochka.svg",
        badge: "Лучший банк для малого бизнеса и стартапов",
        perksText: "Скидка 80% на 3 мес. + онлайн-бухгалтерия и до 360 000 ₽ бонусов",
        hasAcquiring: true,
        hasAccounting: true,
        calc: function (turnover, payments, cashout) {
            let fee = 0;
            let payFee = 0;
            let cashoutFee = 0;
            if (turnover <= 250000 && payments <= 5) {
                fee = 0;
                payFee = payments * 60;
                cashoutFee = cashout <= 150000 ? 0 : (cashout - 150000) * 0.01;
            } else {
                fee = 700;
                payFee = Math.max(0, payments - 7) * 50;
                cashoutFee = cashout <= 400000 ? 0 : (cashout - 400000) * 0.015;
            }
            return {
                fee,
                payFee,
                cashoutFee,
                total: Math.round(fee + payFee + cashoutFee),
                desc: "Встроенная бесплатная бухгалтерия на УСН 6%, живой чат 24/7 и отсутствие скрытых списаний."
            };
        }
    },
    sber: {
        key: "sber",
        name: "СберБизнес",
        tariffName: "Тариф «Легкий старт»",
        logo: "images/banks/sber.png",
        badge: "Бизнес от 30 дней • Вывод 300 000 ₽ под 0%",
        perksText: "300 000 ₽ под 0% на карту физлица + 0 ₽ платежи внутри Сбера (для бизнеса от 30 дней)",
        hasAcquiring: true,
        hasAccounting: true,
        calc: function (turnover, payments, cashout) {
            const fee = 0;
            const externalPay = Math.ceil(payments * 0.5);
            const payFee = Math.max(0, externalPay - 3) * 199;
            let cashoutFee = 0;
            if (cashout <= 300000) {
                cashoutFee = 0;
            } else if (cashout <= 500000) {
                cashoutFee = (cashout - 300000) * 0.015;
            } else {
                cashoutFee = (200000 * 0.015) + (cashout - 500000) * 0.03;
            }
            return {
                fee,
                payFee,
                cashoutFee,
                total: Math.round(fee + payFee + cashoutFee),
                desc: "Рекордный лимит вывода: 300 000 ₽/мес под 0% на личную карту и бесплатные платежи партнерам в Сбере."
            };
        }
    },
    ubrir: {
        key: "ubrir",
        name: "УБРиР (Уральский банк)",
        tariffName: "Тариф «Взлетай!» / «Промо»",
        logo: "images/banks/ubrir.png",
        badge: "3 месяца за 0 ₽ + кэшбэк до 20% на АЗС",
        perksText: "3 мес. за 0 ₽ на «Взлетай» + до 20% кэшбэк на АЗС и розыгрыш 25 000 ₽",
        hasAcquiring: true,
        hasAccounting: false,
        calc: function (turnover, payments, cashout) {
            const fee = 0;
            const payFee = Math.max(0, payments - 15) * 35;
            let cashoutFee = 0;
            if (cashout <= 150000) {
                cashoutFee = 0;
            } else if (cashout <= 400000) {
                cashoutFee = (cashout - 150000) * 0.012;
            } else {
                cashoutFee = (250000 * 0.012) + (cashout - 400000) * 0.025;
            }
            return {
                fee,
                payFee,
                cashoutFee,
                total: Math.round(fee + payFee + cashoutFee),
                desc: "Максимальная выгода по платежкам: 15 переводов юрлицам бесплатно каждый месяц и 0 ₽ ведение счета."
            };
        }
    },
    uralsib: {
        key: "uralsib",
        name: "Банк Уралсиб",
        tariffName: "Тариф «Старт» / «Стартовый»",
        logo: "images/banks/uralsib.png",
        badge: "Платежи в любые банки всего по 19 ₽",
        perksText: "Платежки по 19 ₽ в любые банки РФ + кэшбэк до 7% по бизнес-карте",
        hasAcquiring: true,
        hasAccounting: false,
        calc: function (turnover, payments, cashout) {
            const fee = 0;
            const payFee = payments * 19;
            let cashoutFee = 0;
            if (cashout <= 150000) {
                cashoutFee = 0;
            } else if (cashout <= 500000) {
                cashoutFee = (cashout - 150000) * 0.015;
            } else {
                cashoutFee = (350000 * 0.015) + (cashout - 500000) * 0.03;
            }
            return {
                fee,
                payFee,
                cashoutFee,
                total: Math.round(fee + payFee + cashoutFee),
                desc: "Платежи юрлицам всего 19 ₽, кэшбэк до 7% по бизнес-карте и зарплатный проект за 1 000 ₽/год."
            };
        }
    },
    alfa: {
        key: "alfa",
        name: "Альфа-Банк",
        tariffName: "Тариф «Ноль за обслуживание»",
        logo: "images/banks/alfa.png",
        badge: "ТОП для розницы, услуг и эквайринга",
        perksText: "Торговый эквайринг 1% + 0 ₽ аренда терминалов и до 300 000 ₽ бонусов",
        hasAcquiring: true,
        hasAccounting: true,
        calc: function (turnover, payments, cashout) {
            const fee = 0;
            const payFee = payments * 30;
            let cashoutFee = 0;
            if (cashout <= 100000) {
                cashoutFee = 0;
            } else if (cashout <= 500000) {
                cashoutFee = (cashout - 100000) * 0.015;
            } else {
                cashoutFee = (400000 * 0.015) + (cashout - 500000) * 0.025;
            }
            return {
                fee,
                payFee,
                cashoutFee,
                total: Math.round(fee + payFee + cashoutFee),
                desc: "0 ₽ обслуживание навсегда, бесплатные терминалы эквайринга и высокая надежность."
            };
        }
    },
    vtb: {
        key: "vtb",
        name: "ВТБ Бизнес",
        tariffName: "Тариф «На старте»",
        logo: "images/banks/vtb.png",
        badge: "0 ₽ вывод на карту физлица без лимита",
        perksText: "0 ₽ вывод на карту ВТБ без лимита + регистрация бизнеса 0 ₽ и ЭДО на 1 год",
        hasAcquiring: true,
        hasAccounting: true,
        calc: function (turnover, payments, cashout) {
            const fee = 0;
            const payFee = Math.max(0, payments - 5) * 49;
            const cashoutFee = 0; // 0 ₽ без лимитов на переводы со счёта ИП на личную дебетовую карту ВТБ
            return {
                fee,
                payFee,
                cashoutFee,
                total: Math.round(fee + payFee + cashoutFee),
                desc: "0 ₽ без лимита на переводы себе на карту ВТБ, 5 платежек бесплатно, регистрация бизнеса 0 ₽ и ЭДО на 1 год."
            };
        }
    },
    psb: {
        key: "psb",
        name: "Промсвязьбанк (ПСБ)",
        tariffName: "Тариф «Бизнес Старт»",
        logo: "images/banks/psb.png",
        badge: "Переводы физлицам до 10 млн ₽ + эквайринг от 0,9%",
        perksText: "Переводы физлицам до 10 млн ₽ + эквайринг от 0,9% и кэшбэк до 10%",
        hasAcquiring: true,
        hasAccounting: false,
        calc: function (turnover, payments, cashout) {
            const fee = 0;
            const payFee = Math.max(0, payments - 3) * 45;
            let cashoutFee = cashout <= 100000 ? 0 : (cashout - 100000) * 0.015;
            return {
                fee,
                payFee,
                cashoutFee,
                total: Math.round(fee + payFee + cashoutFee),
                desc: "Переводы физлицам до 10 млн ₽, эквайринг от 0,9% («Белый список» Минцифры) и спецсчета 44/223-ФЗ 0 ₽."
            };
        }
    },
    bspb: {
        key: "bspb",
        name: "Банк «Санкт-Петербург» (БСПБ)",
        tariffName: "Тариф «Деловой старт»",
        logo: "images/banks/bspb.png",
        badge: "СПб, Москва, Клд, Нск • ВЭД от 0.12%",
        perksText: "Выездной сервис 0 ₽ + бизнес-карта 0 ₽ и спецтарифы по ВЭД (СПб, Москва, Клд, Нск)",
        hasAcquiring: false,
        hasAccounting: false,
        calc: function (turnover, payments, cashout) {
            const fee = 0;
            const payFee = payments * 25;
            let cashoutFee = cashout <= 150000 ? 0 : (cashout - 150000) * 0.015;
            return {
                fee,
                payFee,
                cashoutFee,
                total: Math.round(fee + payFee + cashoutFee),
                desc: "Выгодный валютный контроль от 0.12% и персональный валютный контролер для торговли."
            };
        }
    }
};

function initTariffCalculator() {
    const turnoverInput = document.getElementById("calc-turnover");
    const turnoverValDisplay = document.getElementById("turnover-val");

    const cashOutInput = document.getElementById("calc-cashout");
    const cashOutValDisplay = document.getElementById("cashout-val");

    const payCountInput = document.getElementById("calc-payments");
    const payCountValDisplay = document.getElementById("payments-val");

    const acquiringCheckbox = document.getElementById("calc-addon-acquiring");
    const accountingCheckbox = document.getElementById("calc-addon-accounting");

    const winnerName = document.getElementById("calc-winner-name");
    const winnerLogo = document.getElementById("calc-winner-logo");
    const winnerSavings = document.getElementById("calc-savings-val");
    const winnerDesc = document.getElementById("calc-winner-desc");
    const winnerBtn = document.getElementById("calc-winner-btn");
    const perksText = document.getElementById("calc-perks-text");

    const bdFee = document.getElementById("calc-bd-fee");
    const bdPay = document.getElementById("calc-bd-pay");
    const bdCash = document.getElementById("calc-bd-cash");
    const compareBars = document.getElementById("calc-compare-bars");
    const bridgeLink = document.getElementById("calc-bridge-link");

    const personaChips = document.querySelectorAll(".persona-chip");

    // Пресеты быстрого выбора бизнеса
    const presets = {
        start_ip: {
            turnover: 150000,
            cashout: 100000,
            payments: 2,
            acquiring: false,
            accounting: true,
            bizType: "ИП (начинающий)"
        },
        seller_mp: {
            turnover: 1200000,
            cashout: 300000,
            payments: 3,
            acquiring: true,
            accounting: true,
            bizType: "ИП (начинающий)"
        },
        ooo_trade: {
            turnover: 3500000,
            cashout: 400000,
            payments: 25,
            acquiring: true,
            accounting: false,
            bizType: "ООО (организация)"
        },
        freelance: {
            turnover: 400000,
            cashout: 300000,
            payments: 1,
            acquiring: false,
            accounting: true,
            bizType: "ИП (начинающий)"
        },
        retail_cafe: {
            turnover: 950000,
            cashout: 150000,
            payments: 12,
            acquiring: true,
            accounting: true,
            bizType: "ИП (начинающий)"
        },
        max_cashout: {
            turnover: 900000,
            cashout: 300000,
            payments: 2,
            acquiring: false,
            accounting: true,
            bizType: "ИП (начинающий)"
        },
        tender_gos: {
            turnover: 2800000,
            cashout: 150000,
            payments: 12,
            acquiring: false,
            accounting: false,
            bizType: "ООО (организация)"
        },
        ved_trade: {
            turnover: 4500000,
            cashout: 250000,
            payments: 18,
            acquiring: false,
            accounting: false,
            bizType: "ООО (организация)"
        }
    };

    let currentPreset = "seller_mp";

    // Клики по плашкам сценариев
    personaChips.forEach(chip => {
        chip.addEventListener("click", function () {
            personaChips.forEach(c => c.classList.remove("active"));
            this.classList.add("active");

            const key = this.getAttribute("data-preset");
            const p = presets[key];
            if (!p) return;
            currentPreset = key;

            if (turnoverInput) turnoverInput.value = p.turnover;
            if (cashOutInput) cashOutInput.value = p.cashout;
            if (payCountInput) payCountInput.value = p.payments;
            if (acquiringCheckbox) acquiringCheckbox.checked = p.acquiring;
            if (accountingCheckbox) accountingCheckbox.checked = p.accounting;

            calculate();
        });
    });

    if (acquiringCheckbox) acquiringCheckbox.addEventListener("change", calculate);
    if (accountingCheckbox) accountingCheckbox.addEventListener("change", calculate);

    function calculate() {
        if (!turnoverInput || !cashOutInput || !payCountInput) return;

        const turnover = parseInt(turnoverInput.value, 10);
        const cashOut = parseInt(cashOutInput.value, 10);
        const payCount = parseInt(payCountInput.value, 10);
        const hasAcquiring = acquiringCheckbox ? acquiringCheckbox.checked : false;
        const hasAccounting = accountingCheckbox ? accountingCheckbox.checked : false;

        turnoverValDisplay.textContent = formatCurrency(turnover);
        cashOutValDisplay.textContent = formatCurrency(cashOut);
        payCountValDisplay.textContent = `${payCount} шт / мес`;

        // 1. Рассчитываем затраты по каждому банку
        const results = [];
        for (const [key, bank] of Object.entries(BANK_TARIFF_MODELS)) {
            const cost = bank.calc(turnover, payCount, cashOut, currentPreset);
            results.push({
                key: key,
                name: bank.name,
                tariffName: bank.tariffName,
                badge: bank.badge,
                logo: bank.logo,
                perksText: bank.perksText,
                hasAccounting: bank.hasAccounting,
                hasAcquiring: bank.hasAcquiring,
                cost: cost
            });
        }

        // 2. Умная сортировка и ранжирование (учет затрат, опций эквайринга/бухгалтерии и сценариев)
        results.sort((a, b) => {
            // Эффективная стоимость с учетом ценности бесплатной бухгалтерии (~1500 ₽/мес) и наличия эквайринга
            const aEff = a.cost.total - (hasAccounting && a.hasAccounting ? 1500 : 0) - (hasAcquiring && a.hasAcquiring ? 300 : 0);
            const bEff = b.cost.total - (hasAccounting && b.hasAccounting ? 1500 : 0) - (hasAcquiring && b.hasAcquiring ? 300 : 0);

            if (a.cost.total !== b.cost.total) {
                return a.cost.total - b.cost.total;
            }
            if (aEff !== bEff) {
                return aEff - bEff;
            }
            // При равенстве затрат:
            // Селлеры и маркетплейсы -> Озон Банк
            if (currentPreset === "seller_mp" || turnover >= 1000000) {
                if (a.key === "ozon") return -1;
                if (b.key === "ozon") return 1;
            }
            // Максимум вывода или крупный вывод (> 250k) -> ВТБ Бизнес (0 ₽ без лимита на карту ВТБ)
            if (currentPreset === "max_cashout" || (cashOut >= 250000 && currentPreset !== "seller_mp")) {
                if (a.key === "vtb") return -1;
                if (b.key === "vtb") return 1;
                if (a.key === "sber") return -1;
                if (b.key === "sber") return 1;
            }
            // Много платежек (> 12) -> УБРиР
            if (payCount >= 12) {
                if (a.key === "ubrir") return -1;
                if (b.key === "ubrir") return 1;
            }
            // Специальные пресеты:
            if (currentPreset === "tender_gos") {
                if (a.key === "psb") return -1;
                if (b.key === "psb") return 1;
            }
            if (currentPreset === "ved_trade") {
                if (a.key === "bspb") return -1;
                if (b.key === "bspb") return 1;
            }

            // Начинающий бизнес -> Озон или Точка
            if (currentPreset === "start_ip") {
                if (a.key === "ozon") return -1;
                if (b.key === "ozon") return 1;
                if (a.key === "tochka") return -1;
                if (b.key === "tochka") return 1;
            }
            return 0;
        });

        const winner = results[0];

        // 3. Расчет годовой экономии
        // Базовый среднерыночный тариф: 1 490 ₽ абонплата + 49 ₽ за платежку + 1.5% вывод
        const marketMonthlyBase = 1490 + (payCount * 49) + (cashOut * 0.015);
        let monthlySavings = Math.max(1500, Math.round(marketMonthlyBase - winner.cost.total));
        
        // Бонус экономии на эквайринге (разница между 2.3% среднерыночной и 1.2% льготной)
        const acquiringMonthlySavings = hasAcquiring ? Math.round(turnover * 0.45 * 0.011) : 0;
        monthlySavings += acquiringMonthlySavings;

        let annualSavings = monthlySavings * 12;
        // Экономия на бухгалтерии
        if (hasAccounting && winner.hasAccounting) {
            annualSavings += 18000;
        }

        // 4. Обновление блока победителя
        if (winnerName) winnerName.textContent = winner.name;
        if (winnerLogo) winnerLogo.src = winner.logo;
        if (winnerSavings) winnerSavings.textContent = `${formatCurrency(annualSavings)} / год`;
        if (winnerDesc) winnerDesc.textContent = winner.cost.desc;
        if (perksText) perksText.textContent = winner.perksText;

        if (bdFee) bdFee.textContent = formatCurrency(winner.cost.fee);
        if (bdPay) bdPay.textContent = formatCurrency(winner.cost.payFee);
        if (bdCash) bdCash.textContent = formatCurrency(winner.cost.cashoutFee);

        if (winnerBtn) {
            winnerBtn.setAttribute("data-bank", winner.key);
            winnerBtn.textContent = `Зарезервировать счет в ${winner.name} (0 ₽) →`;
        }

        // 5. Визуальные шкалы сравнения ВСЕХ 9 банков
        if (compareBars) {
            const maxCost = Math.max(...results.map(r => r.cost.total), 3000);
            let barsHtml = "";

            results.forEach((item, index) => {
                const isWinner = index === 0;
                let costStr = "";
                let barWidthPercent = 6;
                let barClass = "green";

                if (item.cost.total === 0) {
                    costStr = isWinner ? "0 ₽ (Лучший тариф)" : "0 ₽ / мес";
                    barWidthPercent = isWinner ? 8 : 10;
                    barClass = "green";
                } else {
                    costStr = `${formatCurrency(item.cost.total)} / мес`;
                    barWidthPercent = Math.min(100, Math.max(15, Math.round((item.cost.total / maxCost) * 100)));
                    barClass = isWinner ? "green" : (index <= 2 ? "blue" : "gray");
                }

                barsHtml += `
                    <div class="calc-bar-row ${isWinner ? "winner" : ""}">
                        <div class="bar-bank-meta">
                            <img src="${item.logo}" alt="${item.name}" class="bar-bank-logo">
                            <div class="bar-bank-title">
                                <span class="bar-bank-name">${index + 1}. ${item.name}</span>
                                <span class="bar-bank-tariff">${item.tariffName}</span>
                            </div>
                        </div>
                        <div class="bar-visual-wrap">
                            <div class="bar-track">
                                <div class="bar-fill ${barClass}" style="width: ${barWidthPercent}%;"></div>
                            </div>
                        </div>
                        <span class="bar-cost-text ${item.cost.total === 0 ? "zero" : ""}">${costStr}</span>
                        <a href="#" data-bank="${item.key}" class="btn-bar-cta" target="_blank" rel="sponsored nofollow">
                            ${isWinner ? "Зарезервировать ⚡" : "Открыть счет →"}
                        </a>
                    </div>
                `;
            });

            // Добавляем строку среднерыночного банка для мощного контраста
            const marketTotal = Math.round(marketMonthlyBase);
            barsHtml += `
                <div class="calc-bar-row" style="opacity: 0.8; background: #fff1f2; border-color: #fecdd3;">
                    <div class="bar-bank-meta">
                        <span style="font-size: 24px;">🏛️</span>
                        <div class="bar-bank-title">
                            <span class="bar-bank-name" style="color: #9f1239;">Средний платный банк на рынке</span>
                            <span class="bar-bank-tariff">Стандартные комиссии без льгот</span>
                        </div>
                    </div>
                    <div class="bar-visual-wrap">
                        <div class="bar-track">
                            <div class="bar-fill" style="width: 100%; background: #f43f5e;"></div>
                        </div>
                    </div>
                    <span class="bar-cost-text" style="color: #9f1239;">+${formatCurrency(marketTotal)} / мес</span>
                    <span style="font-size: 11.5px; color: #9f1239; font-weight: 700; text-align: center;">Переплата</span>
                </div>
            `;

            compareBars.innerHTML = barsHtml;
        }

        // Обновляем партнерские ссылки и клики метрики для всех новых сгенерированных кнопок
        initPartnerLinksAndTracking();
    }

    // Мостик в консультацию: связываем клик по ссылке с предзаполнением формы
    if (bridgeLink) {
        bridgeLink.addEventListener("click", function (e) {
            e.preventDefault();
            const consultSection = document.getElementById("consultation");
            if (consultSection) {
                consultSection.scrollIntoView({ behavior: "smooth" });
                
                // Предзаполняем поля формы
                const leadGoal = document.getElementById("lead-goal");
                const leadBank = document.getElementById("lead-bank");
                const leadBiz = document.getElementById("lead-biz");

                if (leadGoal) leadGoal.value = "Проверить тариф на скрытые комиссии и лимиты";
                if (leadBank && winnerName) {
                    const cleanName = winnerName.textContent.trim();
                    for (let i = 0; i < leadBank.options.length; i++) {
                        if (cleanName.includes(leadBank.options[i].value) || leadBank.options[i].value.includes(cleanName)) {
                            leadBank.selectedIndex = i;
                            break;
                        }
                    }
                }
                if (leadBiz && presets[currentPreset]) {
                    leadBiz.value = presets[currentPreset].bizType;
                }
            }
        });
    }

    if (turnoverInput && cashOutInput && payCountInput) {
        turnoverInput.addEventListener("input", calculate);
        cashOutInput.addEventListener("input", calculate);
        payCountInput.addEventListener("input", calculate);
        calculate(); // начальный запуск
    }
}

function formatCurrency(num) {
    return Math.round(num).toLocaleString("ru-RU") + " ₽";
}

/**
 * 4. Переключение спойлеров «Подробнее о тарифе»
 */
function initDetailsToggles() {
    const toggleButtons = document.querySelectorAll(".btn-toggle-details");
    toggleButtons.forEach(btn => {
        btn.addEventListener("click", function () {
            const card = this.closest(".bank-card");
            const drawer = card.querySelector(".tariff-details-drawer");
            if (drawer) {
                const isOpen = drawer.classList.contains("open");
                drawer.classList.toggle("open");
                this.textContent = isOpen ? "Подробнее о тарифе ▼" : "Свернуть условия ▲";
            }
        });
    });
}

/**
 * 5. FAQ Аккордеон
 */
function initFaqAccordion() {
    const faqItems = document.querySelectorAll(".faq-item");
    faqItems.forEach(item => {
        const question = item.querySelector(".faq-question");
        if (!question) return;
        question.addEventListener("click", function () {
            const isOpen = item.classList.contains("active");
            faqItems.forEach(i => i.classList.remove("active"));
            if (!isOpen) {
                item.classList.add("active");
            }
        });
    });
}

/**
 * 6. Обработка формы бесплатной консультации и отправка лида
 */
function initLeadForm() {
    const form = document.getElementById("lead-form");
    if (!form) return;

    const messengerPills = form.querySelectorAll(".messenger-pill");
    const selectedMessengerInput = document.getElementById("selected-messenger");
    const contactLabel = document.getElementById("messenger-input-label");
    const contactInput = document.getElementById("lead-messenger-contact");
    const channelHint = document.getElementById("channel-hint");
    const phoneInput = document.getElementById("lead-phone");
    const submitBtn = document.getElementById("btn-submit-lead");
    const successAlert = document.getElementById("form-success-alert");

    // Конфигурация под каждый мессенджер / способ связи
    const channelConfig = {
        whatsapp: {
            name: "WhatsApp",
            label: "Номер телефона для WhatsApp:",
            placeholder: "+7 (___) ___-__-__",
            hint: "Напишем вам в WhatsApp с расчетом тарифа и ответом на любые вопросы без навязчивых звонков."
        },
        telegram: {
            name: "Telegram",
            label: "Ваш ник в Telegram (через @) или ссылка:",
            placeholder: "@username или https://t.me/username",
            hint: "Эксперт свяжется с вами напрямую в Telegram. Конфиденциально и быстро."
        },
        vk: {
            name: "ВКонтакте",
            label: "Ссылка на ваш профиль ВКонтакте или ник:",
            placeholder: "https://vk.com/id... или никнейм",
            hint: "Отправим сравнительную таблицу и ответим в личные сообщения ВКонтакте."
        },
        call: {
            name: "Только телефонный звонок",
            label: "Удобное время для разговора по телефону:",
            placeholder: "Например: сегодня с 13:00 до 18:00 по МСК",
            hint: "Банковский специалист лично перезвонит на указанный номер телефона для подробной беседы."
        }
    };

    // Переключение плашек мессенджеров
    messengerPills.forEach(pill => {
        pill.addEventListener("click", function () {
            messengerPills.forEach(p => p.classList.remove("active"));
            this.classList.add("active");

            const channelKey = this.getAttribute("data-channel") || "whatsapp";
            if (selectedMessengerInput) selectedMessengerInput.value = channelKey;

            const cfg = channelConfig[channelKey] || channelConfig.whatsapp;
            if (contactLabel) contactLabel.textContent = cfg.label;
            if (contactInput) {
                contactInput.placeholder = cfg.placeholder;
                // При выборе WhatsApp авто-подставляем номер из поля phone
                if (channelKey === "whatsapp" && phoneInput && phoneInput.value && !contactInput.value) {
                    contactInput.value = phoneInput.value;
                } else if (channelKey === "call" && !contactInput.value) {
                    contactInput.value = "В рабочее время (с 10:00 до 19:00)";
                }
            }
            if (channelHint) channelHint.textContent = cfg.hint;
        });
    });

    // Автоматическая синхронизация номера WhatsApp при вводе телефона
    if (phoneInput && contactInput) {
        phoneInput.addEventListener("input", function () {
            if (selectedMessengerInput && selectedMessengerInput.value === "whatsapp") {
                contactInput.value = this.value;
            }
        });
    }

    // Обработка отправки формы
    form.addEventListener("submit", function (e) {
        e.preventDefault();

        const config = window.RKO_CONFIG || {};
        const notification = config.leadNotification || {};
        const targetEmail = notification.email || config.leadEmail || "y.sevelev@mail.ru";
        const formSubmitEndpoint = notification.formSubmitUrl || `https://formsubmit.co/ajax/${targetEmail}`;

        const name = (document.getElementById("lead-name")?.value || "").trim();
        const phone = (document.getElementById("lead-phone")?.value || "").trim();
        const email = (document.getElementById("lead-email")?.value || "").trim();
        const goal = (document.getElementById("lead-goal")?.value || "Подобрать лучший банк");
        const biz = (document.getElementById("lead-biz")?.value || "ИП");
        const bank = (document.getElementById("lead-bank")?.value || "Любой банк");
        const channelKey = selectedMessengerInput ? selectedMessengerInput.value : "whatsapp";
        const channelName = channelConfig[channelKey]?.name || channelKey;
        const messengerContact = (contactInput?.value || "").trim();

        if (!name || !phone) {
            alert("Пожалуйста, заполните имя и номер телефона.");
            return;
        }

        // Блокируем кнопку на время отправки
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = "Отправка заявки... ⏳";
        }

        sendMetrikaGoal("lead_form_submitted");

        // Формируем структурированные данные заявки
        const leadData = {
            "Имя клиента": name,
            "Основной телефон": phone,
            "Email для связи": email || "Не указан",
            "Цель консультации": goal,
            "Тип бизнеса": biz,
            "Банк": bank,
            "Способ связи": channelName,
            "Контакт для связи / Время": messengerContact,
            "Дата заявки": new Date().toLocaleString("ru-RU"),
            "Получатель": targetEmail,
            _subject: `🔥 Новая заявка на РКО: ${name} (${channelName})`,
            _template: "table",
            _captcha: "false"
        };

        const postPromises = [];

        // 1. Отправка на почту y.sevelev@mail.ru через FormSubmit AJAX
        const emailPromise = fetch(formSubmitEndpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(leadData)
        }).catch(err => {
            console.log("Email dispatch notice:", err);
            return null;
        });
        postPromises.push(emailPromise);

        // 2. Локальное сохранение на бэкенде (/api/lead) для 100% гарантии сохранения
        const localPromise = fetch("/api/lead", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(leadData)
        }).catch(() => null);
        postPromises.push(localPromise);

        // 3. Отправка в Telegram (если включено в config.js)
        if (notification.enabledTelegram && notification.botToken && notification.adminChatId) {
            const tgText = `🔔 *НОВАЯ ЗАЯВКА НА ПОДБОР РКО!*\n\n` +
                           `👤 *Имя:* ${name}\n` +
                           `📱 *Телефон:* ${phone}\n` +
                           `✉️ *Email:* ${email || "Не указан"}\n` +
                           `🎯 *Цель:* ${goal}\n` +
                           `🏢 *Бизнес:* ${biz}\n` +
                           `🏦 *Банк:* ${bank}\n` +
                           `💬 *Способ связи:* ${channelName}\n` +
                           `📍 *Контакт/Время:* ${messengerContact}\n` +
                           `🕒 *Время:* ${new Date().toLocaleString("ru-RU")}`;

            const tgPromise = fetch(`https://api.telegram.org/bot${notification.botToken}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: notification.adminChatId,
                    text: tgText,
                    parse_mode: "Markdown"
                })
            }).catch(() => null);
            postPromises.push(tgPromise);
        }

        // Обработка успешного завершения
        Promise.allSettled(postPromises).then(() => {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = "Получить бесплатную консультацию →";
            }
            if (successAlert) {
                successAlert.style.display = "flex";
                successAlert.scrollIntoView({ behavior: "smooth", block: "center" });
            }
            form.reset();

            // Сброс плашек к WhatsApp по умолчанию
            messengerPills.forEach(p => p.classList.remove("active"));
            const defaultPill = form.querySelector('.messenger-pill[data-channel="whatsapp"]');
            if (defaultPill) defaultPill.classList.add("active");
            if (selectedMessengerInput) selectedMessengerInput.value = "whatsapp";
            if (contactLabel) contactLabel.textContent = channelConfig.whatsapp.label;
            if (contactInput) {
                contactInput.placeholder = channelConfig.whatsapp.placeholder;
                contactInput.value = "";
            }
            if (channelHint) channelHint.textContent = channelConfig.whatsapp.hint;
        });
    });
}
