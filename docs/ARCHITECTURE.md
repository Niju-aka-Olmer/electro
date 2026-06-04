# Architecture — ElectroPlan

## 📁 Полная структура файлов

```
electroplan/
├── docs/                          # Контекст для Cursor
│   ├── PROJECT_OVERVIEW.md
│   ├── ARCHITECTURE.md
│   ├── TECH_STACK.md
│   └── CURRENT_STATUS.md
│
├── public/
│   ├── icons/                     # SVG иконки (автоматы, УЗО, дифы)
│   └── og-image.png
│
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── layout.tsx             # Root layout (шрифты, тема, провайдеры)
│   │   ├── page.tsx               # Landing / Hero
│   │   ├── globals.css            # CSS переменные, базовые стили
│   │   │
│   │   ├── calculator/            # Калькулятор автоматики
│   │   │   └── page.tsx
│   │   │
│   │   ├── panel/                 # Расчёт щитка
│   │   │   └── page.tsx
│   │   │
│   │   ├── schemes/               # Схемы расключения
│   │   │   ├── page.tsx           # Каталог схем
│   │   │   └── [slug]/page.tsx    # Конкретная схема
│   │   │
│   │   ├── consultant/            # AI-консультант
│   │   │   └── page.tsx
│   │   │
│   │   └── api/
│   │       ├── calculate/route.ts # Расчёт автоматики (серверный)
│   │       ├── consultant/route.ts# DeepSeek API стриминг
│   │       └── export-pdf/route.ts# Генерация PDF
│   │
│   ├── components/
│   │   │
│   │   ├── ui/                    # Базовые UI-примитивы (shadcn)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── slider.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── card.tsx
│   │   │   ├── tooltip.tsx
│   │   │   ├── tabs.tsx
│   │   │   └── separator.tsx
│   │   │
│   │   ├── layout/                # Структурные компоненты
│   │   │   ├── Header.tsx         # Навигация + переключатель темы
│   │   │   ├── Footer.tsx
│   │   │   ├── ThemeProvider.tsx  # Context для темы
│   │   │   └── PageWrapper.tsx    # Анимированный wrapper страниц
│   │   │
│   │   ├── sections/              # Секции лендинга
│   │   │   ├── HeroSection.tsx    # Главный экран
│   │   │   ├── FeaturesSection.tsx# 4 возможности
│   │   │   ├── HowItWorksSection.tsx # 3 шага
│   │   │   ├── DemoSection.tsx    # Интерактивное демо
│   │   │   └── CTASection.tsx     # Призыв к действию
│   │   │
│   │   ├── tools/                 # Инструменты (основной функционал)
│   │   │   ├── calculator/
│   │   │   │   ├── CalculatorForm.tsx      # Форма ввода параметров
│   │   │   │   ├── RoomConfigurator.tsx    # Добавление комнат
│   │   │   │   ├── LoadItem.tsx            # Одна нагрузка (прибор)
│   │   │   │   ├── CalculatorResults.tsx   # Результаты расчёта
│   │   │   │   ├── BreakerCard.tsx         # Карточка автомата
│   │   │   │   └── MaterialsList.tsx       # BOM-список
│   │   │   │
│   │   │   ├── panel/
│   │   │   │   ├── PanelConfigurator.tsx   # Компоновщик щитка
│   │   │   │   ├── DINRail.tsx             # Визуализация DIN-рейки
│   │   │   │   ├── ModuleItem.tsx          # Один модуль (автомат/УЗО)
│   │   │   │   ├── PanelSummary.tsx        # Итог: размер щита
│   │   │   │   └── PanelExport.tsx         # Кнопки экспорта
│   │   │   │
│   │   │   └── consultant/
│   │   │       ├── ConsultantChat.tsx      # Чат-интерфейс
│   │   │       ├── MessageBubble.tsx       # Сообщение (user/ai)
│   │   │       ├── QuickPrompts.tsx        # Быстрые запросы
│   │   │       └── StreamingResponse.tsx  # Стриминг ответа DeepSeek
│   │   │
│   │   └── schemes/               # Электрические схемы
│   │       ├── SchemeViewer.tsx           # Контейнер схемы
│   │       ├── SchemeControls.tsx         # Зум, сброс, пояснения
│   │       ├── svg/
│   │       │   ├── LightBoxScheme.tsx     # Расключение на свет
│   │       │   ├── SocketBoxScheme.tsx    # Расключение на розетки
│   │       │   ├── PassthroughScheme.tsx  # Проходной выключатель
│   │       │   ├── CrossScheme.tsx        # Перекрёстный выключатель
│   │       │   ├── PanelScheme.tsx        # Принципиальная схема щитка
│   │       │   └── WireAnimator.tsx       # Анимация тока по проводам
│   │       └── SchemeCard.tsx             # Карточка в каталоге схем
│   │
│   ├── lib/
│   │   ├── calculations/
│   │   │   ├── breakers.ts         # Логика выбора автоматов
│   │   │   ├── rcd.ts              # Логика УЗО/дифавтоматов
│   │   │   ├── panel.ts            # Расчёт модулей щитка
│   │   │   ├── cable.ts            # Выбор сечения кабеля
│   │   │   └── constants.ts        # ПУЭ-константы, таблицы токов
│   │   │
│   │   ├── deepseek.ts             # DeepSeek API клиент
│   │   ├── pdf-generator.ts        # Генерация PDF-отчёта
│   │   └── utils.ts                # cn(), форматирование
│   │
│   ├── hooks/
│   │   ├── useCalculator.ts        # Хук калькулятора
│   │   ├── usePanel.ts             # Хук конфигуратора щитка
│   │   ├── useTheme.ts             # Хук темы
│   │   └── useSchemeZoom.ts        # Зум схемы (pinch/scroll)
│   │
│   ├── store/
│   │   ├── calculatorStore.ts      # Zustand: состояние расчёта
│   │   └── panelStore.ts           # Zustand: состояние щитка
│   │
│   ├── types/
│   │   ├── electrical.ts           # Типы: Breaker, RCD, Load...
│   │   ├── calculator.ts           # Типы форм калькулятора
│   │   └── scheme.ts               # Типы схем
│   │
│   └── data/
│       ├── schemes.ts              # Метаданные схем (slug, title, desc)
│       ├── equipment.ts            # Каталог оборудования (ABB, Legrand)
│       └── prompts.ts              # Системный промпт для DeepSeek
│
├── tailwind.config.ts
├── next.config.ts
└── tsconfig.json
```

---

## 🧩 Компоненты — детальное описание

### Layout компоненты

#### `Header.tsx`
Sticky навигация с glassmorphism-эффектом.
- Логотип (молния + "ElectroPlan")
- Nav-ссылки: Калькулятор / Щиток / Схемы / Консультант
- ThemeToggle (sun/moon с анимацией rotate)
- Mobile: бургер → drawer

#### `ThemeProvider.tsx`
Context + localStorage персистентность.
Применяет `data-theme="dark|light"` на `<html>`.
Без flash при загрузке (inline script в `<head>`).

#### `PageWrapper.tsx`
Framer Motion `AnimatePresence` + `motion.div` для page transitions.
Fade + slight Y-shift между страницами.

---

### Секции лендинга

#### `HeroSection.tsx`
- Fullscreen, тёмный фон с сеткой (CSS grid-background)
- Анимированный заголовок (stagger по словам)
- Подзаголовок + 2 CTA-кнопки
- Декоративная SVG-схема щитка справа (анимация тока)
- Floating-бейджи: "ПУЭ-7 совместимо", "220В Россия/СНГ"

#### `FeaturesSection.tsx`
4 карточки с hover-эффектом (amber border glow):
1. Калькулятор автоматики
2. Конструктор щитка
3. Интерактивные схемы
4. AI-консультант

#### `HowItWorksSection.tsx`
3 шага с анимированным timeline-коннектором:
1. Описываете помещение
2. Получаете расчёт
3. Скачиваете PDF

---

### Tools / Calculator

#### `CalculatorForm.tsx`
Многошаговая форма (Stepper):
- Шаг 1: Тип (квартира/дом), площадь, этажей
- Шаг 2: Комнаты + нагрузки (добавить/удалить)
- Шаг 3: Доп. параметры (вводной кабель, система заземления TN-C-S/TN-S)

#### `RoomConfigurator.tsx`
Карточка комнаты с accordion:
- Название комнаты
- Кол-во розеточных групп
- Кол-во точек освещения
- Спецнагрузки (варочная, духовка, стиралка, кондей — чекбоксы)

#### `CalculatorResults.tsx`
Анимированный reveal результатов:
- Секция вводного автомата
- Секция УЗО/дифавтоматов
- Секция групповых автоматов
- Таблица: Наименование / Номинал / Кол-во / Причина

#### `BreakerCard.tsx`
Карточка одного устройства:
- Иконка типа (автомат / УЗО / диф)
- Номинал (большим шрифтом, монospace)
- Характеристика (B/C/D)
- Ток утечки (для УЗО)
- Tooltip с пояснением выбора

---

### Tools / Panel

#### `PanelConfigurator.tsx`
Drag-and-drop компоновщик щитка.
- Список доступных модулей слева
- Визуализация DIN-реек справа
- Auto-arrange от результатов калькулятора

#### `DINRail.tsx`
SVG-визуализация DIN-рейки 35мм.
- Слоты для модулей (каждый = 17.5мм / 1 mod)
- Отображение установленных устройств
- Подписи (L1, N, PE)
- Итог: занято X из Y модулей

#### `PanelSummary.tsx`
- Итого модулей (расчёт + 20% запас)
- Рекомендация щита: AP (наружный) / UP (встроенный)
- Размер: 1/2/3-рядный, количество мест
- Примеры артикулов (ABB, IEK, Legrand)

---

### Schemes

#### `LightBoxScheme.tsx`
SVG-схема расключения распредкоробки на освещение:
- Провода: L (коричневый), N (синий), PE (жёлто-зелёный)
- Входящий кабель → клеммы → выход на выключатель → выход на люстру
- Анимация тока (пунктирный дэш по фазному проводу)
- Подписи всех проводников

#### `PassthroughScheme.tsx`
Схема проходного выключателя (2 выключателя, 1 лампа):
- 3-жильный кабель между выключателями
- Принцип работы: таблица переключений
- Интерактив: клик по выключателям меняет схему (лампа вкл/выкл)

#### `CrossScheme.tsx`
Схема перекрёстного выключателя (3+ точки управления):
- Проходные (крайние) + перекрёстный (средний)
- Пошаговая анимация при клике

#### `WireAnimator.tsx`
Reusable компонент анимации тока:
- Принимает SVG path ref
- Анимирует `stroke-dashoffset` через Framer Motion
- Цвет = цвет провода (L/N/PE/COM)

---

### Consultant

#### `ConsultantChat.tsx`
Чат-интерфейс (похож на мессенджер, не на ChatGPT):
- История сообщений с автоскроллом
- Input + Send (Ctrl+Enter)
- Streaming ответ DeepSeek

#### `QuickPrompts.tsx`
Быстрые подсказки (chips):
- "Какой автомат на варочную панель?"
- "Как подключить проходной выключатель?"
- "Сколько модулей нужно в щиток для 2-комнатной квартиры?"
- "УЗО или дифавтомат — что лучше?"

---

## 🖥️ Инфраструктура и деплой

> Подробная инструкция: `docs/DEPLOYMENT.md`

### Рекомендуемый сервер (продакшн)
```
ОС:    Ubuntu 24.04 LTS
CPU:   2 vCPU
RAM:   2–4 GB
Диск:  40 GB SSD
```

### Стек сервера
```
Node.js 20 LTS   — среда Next.js
PM2              — менеджер процессов (cluster mode, 2 воркера)
Nginx            — reverse proxy + SSL termination + кэш статики
Certbot          — бесплатный SSL (Let's Encrypt)
UFW              — файрвол (80, 443, 22)
```

### Схема трафика
```
Internet → Nginx:443 (SSL) → Next.js:3000 (PM2 cluster)
                                ├── SSR pages
                                ├── /api/calculate    (Node.js)
                                ├── /api/consultant   (Edge, стриминг SSE)
                                └── /api/export-pdf   (Node.js)
```

### Варианты хостинга
| Вариант | Хостер | Цена/мес | Когда |
|---------|--------|----------|-------|
| Managed | Vercel (free) | 0 | MVP, старт |
| Managed | Vercel Pro | $20 | Первые users |
| VPS РФ | Timeweb Cloud | ~450 руб | Аудитория РФ |
| VPS EU | Hetzner | ~€5 | Международная |
| Docker | Любой VPS | цена VPS | Полный контроль |

### DEEPSEEK_API_KEY — безопасность
- Ключ только в `.env.production` на сервере
- `НИКОГДА` не в клиентском коде (только `route.ts` без `'use client'`)
- Rate limiting: 10 req/min на `/api/consultant`

---

## 🔄 Data Flow

```
CalculatorForm
    ↓ (Zod-validated data)
calculatorStore (Zustand)
    ↓
lib/calculations/breakers.ts  ←→  lib/calculations/rcd.ts
    ↓
CalculatorResults
    ↓ (передаёт список устройств)
panelStore (Zustand)
    ↓
PanelConfigurator → DINRail → PanelSummary
    ↓
PDF Export / Print
```

## 🌐 API Routes

### `POST /api/calculate`
Серверный расчёт (тяжёлые вычисления не на клиенте).
Input: `CalculationInput` (Zod)
Output: `CalculationResult` (автоматы, УЗО, щиток)

### `POST /api/consultant`
Стриминг DeepSeek API (OpenAI-совместимый).
Input: `{ messages: Message[], context?: CalculationResult }`
Output: `text/event-stream`
Системный промпт: эксперт по ПУЭ-7, ГОСТ Р 50571, объясняет просто.

### `POST /api/export-pdf`
Input: `{ calculation, panel, title }`
Output: `application/pdf`
