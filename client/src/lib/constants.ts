// Tender categories
export const TENDER_CATEGORIES = [
  { value: "equipment", label: "Спецтехника" },
  { value: "materials", label: "Материалы" },
  { value: "tools", label: "Инструменты" },
  { value: "services", label: "Услуги" },
  { value: "repair", label: "Ремонт" },
  { value: "repair-house", label: "Ремонт → Дома" },
  { value: "repair-apartment", label: "Ремонт → Квартиры" },
  { value: "repair-commercial", label: "Ремонт → Коммерческого помещения" },
  { value: "property", label: "Недвижимость" },
  { value: "transport", label: "Транспорт" },
];

// Marketplace categories
export const MARKETPLACE_CATEGORIES = [
  { value: "equipment", label: "Спецтехника" },
  { value: "tools", label: "Инструменты" },
  { value: "materials", label: "Материалы" },
  { value: "services", label: "Услуги" },
];

// Subcategories for tenders and marketplace
export const SUBCATEGORIES = {
  equipment: [
    { value: "excavators", label: "Экскаваторы" },
    { value: "loaders", label: "Погрузчики" },
    { value: "cranes", label: "Краны" },
    { value: "trucks", label: "Грузовики" },
    { value: "concrete_mixers", label: "Бетоносмесители" },
    { value: "other", label: "Другое" }
  ],
  tools: [
    { value: "power_tools", label: "Электроинструменты" },
    { value: "hand_tools", label: "Ручные инструменты" },
    { value: "measuring_tools", label: "Измерительные инструменты" },
    { value: "ladders", label: "Лестницы" },
    { value: "scaffolding", label: "Строительные леса" },
    { value: "other", label: "Другое" }
  ],
  materials: [
    { value: "bricks", label: "Кирпич" },
    { value: "cement", label: "Цемент" },
    { value: "wood", label: "Древесина" },
    { value: "metal", label: "Металл" },
    { value: "paint", label: "Краска" },
    { value: "sand", label: "Песок" },
    { value: "panels", label: "Панели" },
    { value: "windows", label: "Окна" },
    { value: "doors", label: "Двери" },
    { value: "other", label: "Другое" }
  ],
  services: [
    { value: "repair", label: "Ремонт" },
    { value: "construction", label: "Строительство" },
    { value: "design", label: "Проектирование" },
    { value: "demolition", label: "Демонтаж" },
    { value: "cleaning", label: "Уборка" },
    { value: "consulting", label: "Консультации" },
    { value: "installation", label: "Монтаж" },
    { value: "plumbing", label: "Сантехника" },
    { value: "electrical", label: "Электрика" },
    { value: "other", label: "Другое" }
  ],
  property: [
    { value: "commercial", label: "Коммерческая недвижимость" },
    { value: "residential", label: "Жилая недвижимость" },
    { value: "land", label: "Земельный участок" },
    { value: "industrial", label: "Промышленные объекты" },
    { value: "other", label: "Другое" }
  ],
  transport: [
    { value: "truck", label: "Грузовики" },
    { value: "van", label: "Фургоны" },
    { value: "special", label: "Спецтранспорт" },
    { value: "other", label: "Другое" }
  ]
};

// Listing types
export const LISTING_TYPES = [
  { value: "sell", label: "Продажа" },
  { value: "rent", label: "Аренда" },
  { value: "buy", label: "Покупка" },
];

// Tender statuses
export const TENDER_STATUSES = [
  { value: "open", label: "Актуален" },
  { value: "in_progress", label: "В работе" },
  { value: "completed", label: "Завершен" },
  { value: "canceled", label: "Отменен" },
];

// User types
export const USER_TYPES = [
  { value: "individual", label: "Физическое лицо" },
  { value: "contractor", label: "Подрядчик" },
  { value: "company", label: "Компания" },
];

// Person types (for tenders)
export const PERSON_TYPES = [
  { value: "individual", label: "Физическое лицо" },
  { value: "legal_entity", label: "Юридическое лицо" },
];

// Professions
export const PROFESSIONS = [
  { value: "builder", label: "Строитель" },
  { value: "carpenter", label: "Плотник" },
  { value: "electrician", label: "Электрик" },
  { value: "plumber", label: "Сантехник" },
  { value: "painter", label: "Маляр" },
  { value: "welder", label: "Сварщик" },
  { value: "tiler", label: "Плиточник" },
  { value: "roofer", label: "Кровельщик" },
  { value: "plasterer", label: "Штукатур" },
  { value: "bricklayer", label: "Каменщик" },
  { value: "concrete_worker", label: "Бетонщик" },
  { value: "excavator_operator", label: "Оператор экскаватора" },
  { value: "crane_operator", label: "Крановщик" },
  { value: "architect", label: "Архитектор" },
  { value: "designer", label: "Дизайнер" },
  { value: "engineer", label: "Инженер" },
  { value: "project_manager", label: "Руководитель проекта" },
];

// Для обратной совместимости со старыми компонентами
export const MARKETPLACE_SUBCATEGORIES = SUBCATEGORIES;
export const CONSTRUCTION_CATEGORIES = TENDER_CATEGORIES;
