/**
 * =======================================================================
 * ГЛАВНЫЙ ФАЙЛ НАСТРОЕК ВИТРИНЫ РКО (MASTER CONFIG 2026–2027)
 * =======================================================================
 * Все ссылки, счетчики и отображаемые условия банков настраиваются ЗДЕСЬ.
 * Порядок банков соответствует текущему рейтингу на сайте (1–9).
 *
 * Памятка перед публикацией:
 * 1. Замените тестовые ссылки https://leads.su/click/demo_* на ваши реальные CPA-ссылки.
 * 2. Впишите ваш реальный номер счетчика Яндекс.Метрики (yandexMetrikaId).
 */

const RKO_CONFIG = {
    // 1. Адрес сайта (заполните, когда подключите постоянный домен)
    siteUrl: "https://rkonavigator.ru",

    // 2. Идентификатор счетчика Яндекс.Метрики (замените на ваш номер)
    yandexMetrikaId: "114728691",

    // 3. Контакты и Telegram
    telegramChannelUrl: "https://t.me/fin_konsult_2026",
    telegramBotUrl: "", // Оставьте пустым, если кнопка бота не используется на сайте
    leadEmail: "y.sevelev@mail.ru",

    // 4. ПАРТНЕРСКИЕ ССЫЛКИ И АКТУАЛЬНЫЕ УСЛОВИЯ БАНКОВ (в порядке рейтинга 1–9)
    banks: {
        // 1 место: Озон Банк (РКО + Регистрация ИП/ООО 0 ₽)
        ozon: {
            name: "Озон Банк (Ozon Бизнес)",
            partnerUrl: "https://t.fincpanetwork.ru/click/61172/417?erid=2W5zFHbppTA",
            partnerRegUrl: "https://t.fincpanetwork.ru/click/61172/955?erid=2W5zFHPj8YH",
            bonusText: "0 ₽ обслуживание навсегда + до 14,1% на остаток и бесплатная онлайн-бухгалтерия",
            monthlyFee: "0 ₽ навсегда без условий",
            limitFreeCash: "До 3 млн ₽ снятие наличных по бизнес-карте (до 150 000 ₽ СБП 0%)",
            rating: "4.9 / 5.0"
        },

        // 2 место: Альфа-Банк (РКО + Регистрация ИП/ООО 0 ₽ + Эквайринг 1%)
        alfa: {
            name: "Альфа-Банк",
            partnerUrl: "https://t.fincpanetwork.ru/click/61172/338?erid=2W5zFJhpPwv",
            partnerRegUrl: "https://t.fincpanetwork.ru/click/61172/337?erid=2W5zFJerRPE",
            partnerAcquiringUrl: "https://leads.su/click/demo_alfa_acquiring",
            partnerInternetAcquiringUrl: "https://leads.su/click/demo_alfa_internet_acquiring", // Ссылка на интернет-эквайринг Альфа-Банка
            bonusText: "Торговый эквайринг 1% + 0 ₽ аренда терминалов и до 300 000 ₽ партнерских бонусов",
            monthlyFee: "0 ₽ навсегда без условий",
            limitFreeCash: "До 100 000 ₽ / мес 0%",
            rating: "4.8 / 5.0"
        },

        // 3 место: ВТБ Бизнес (РКО + Регистрация ИП/ООО 0 ₽ + Эквайринг от 1,3%)
        vtb: {
            name: "ВТБ Бизнес",
            partnerUrl: "https://rko-group.ru/s/DL6zDPSX",
            partnerRegUrl: "https://trk.ppdu.ru/click/yb31w90s?erid=Kra23bNL5&siteId=30797",
            partnerAcquiringUrl: "https://leads.su/click/demo_vtb_acquiring",
            bonusText: "0 ₽ перевод на карту физлица без ограничений + бесплатная регистрация ИП/ООО без госпошлины и ЭДО на 1 год",
            monthlyFee: "0 ₽ на старте (3 мес без условий)",
            limitFreeCash: "0 ₽ без лимита на карту ВТБ",
            rating: "4.8 / 5.0"
        },

        // 4 место: СберБизнес (строго для действующего бизнеса старше 30 дней)
        sber: {
            name: "СберБизнес",
            partnerUrl: "https://t.fincpanetwork.ru/click/61172/982",
            bonusText: "0 ₽ платежи внутри Сбера + 300 000 ₽ вывод под 0% (для действующих ИП и ООО со сроком от 30 дней)",
            monthlyFee: "0 ₽ навсегда без условий",
            limitFreeCash: "До 300 000 ₽ / мес 0% на карту Сбера",
            rating: "4.8 / 5.0"
        },

        // 5 место: Точка Банк (РКО + Регистрация бизнеса 0 ₽)
        tochka: {
            name: "Точка Банк",
            partnerUrl: "https://rko-group.ru/s/6wwc7cXX",
            partnerRegUrl: "https://rko-group.ru/s/hmxBlW4q",
            bonusText: "Скидка 80% на 3 мес. + онлайн-бухгалтерия (УСН) 0 ₽, эквайринг от 1,14% и бонусы до 360 000 ₽",
            monthlyFee: "0 ₽ на старте / скидка 80%",
            limitFreeCash: "До 1 000 000 ₽ / мес 0%",
            rating: "4.9 / 5.0"
        },

        // 6 место: УБРиР (Уральский банк)
        ubrir: {
            name: "УБРиР (Уральский банк)",
            partnerUrl: "https://leads.su/click/demo_ubrir",
            bonusText: "3 месяца за 0 ₽ на тарифе «Взлетай» + до 20% кэшбэк на АЗС и розыгрыш 25 000 ₽",
            monthlyFee: "0 ₽ (3 мес за 0 ₽ на «Взлетай»)",
            limitFreeCash: "До 400 000 ₽ / мес 0%",
            rating: "4.8 / 5.0"
        },

        // 7 место: Банк Уралсиб
        uralsib: {
            name: "Банк Уралсиб",
            partnerUrl: "https://leads.su/click/demo_uralsib",
            bonusText: "Платежки юрлицам всего 19 ₽ + кэшбэк до 7% по бизнес-карте и зарплатный проект за 1 000 ₽/год",
            monthlyFee: "0 ₽ (Тариф «Стартовый»)",
            limitFreeCash: "До 150 000 ₽ / мес 0%",
            rating: "4.8 / 5.0"
        },

        // 8 место: Промсвязьбанк (ПСБ)
        psb: {
            name: "Промсвязьбанк (ПСБ)",
            partnerUrl: "https://rko-group.ru/s/4si7uLG3",
            bonusText: "Переводы физлицам до 10 млн ₽ + эквайринг от 0,9% и кэшбэк до 10% по карте",
            monthlyFee: "От 0 ₽ (дистанционное открытие)",
            limitFreeCash: "До 10 млн ₽ 0%",
            rating: "4.8 / 5.0"
        },

        // 9 место: Банк «Санкт-Петербург» (СПб и ЛО, Москва, Калининград, Новосибирск)
        bspb: {
            name: "Банк «Санкт-Петербург» (БСПБ)",
            partnerUrl: "https://leads.su/click/demo_bspb",
            bonusText: "Выездной сервис 0 ₽ + бизнес-карта 0 ₽ и спецтарифы по ВЭД (СПб и ЛО, Москва, Калининград, Новосибирск)",
            monthlyFee: "0 ₽ первые месяцы",
            limitFreeCash: "До 150 000 ₽ / мес 0%",
            rating: "4.8 / 5.0"
        }
    },

    // 5. Настройки приема заявок с формы консультации (Email + опционально Telegram)
    leadNotification: {
        email: "y.sevelev@mail.ru",
        formSubmitUrl: "https://formsubmit.co/ajax/y.sevelev@mail.ru",
        enabledTelegram: false, // Поставьте true, если хотите дублировать заявки с формы себе в Telegram
        botToken: "ВАШ_ТОКЕН_БОТА",
        adminChatId: "ВАШ_CHAT_ID"
    }
};

// Экспорт для браузера
if (typeof window !== "undefined") {
    window.RKO_CONFIG = RKO_CONFIG;
}
