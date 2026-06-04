# Current Status — ElectroPlan

## 📊 Статус: Архитектурное планирование ✅

---

## 🗺️ План реализации по этапам

### ЭТАП 0 — Фундамент (День 1-2)
**Цель**: Работающий Next.js проект с правильной конфигурацией

```bash
# Инициализация
npx create-next-app@latest electroplan \
  --typescript --tailwind --app --src-dir --import-alias "@/*"

# UI компоненты
npx shadcn@latest init
npx shadcn@latest add button input select slider badge card tooltip tabs separator

# Дополнительные зависимости
npm install framer-motion zustand react-hook-form zod \
  lucide-react clsx tailwind-merge
```

**Задачи**:
- [ ] Настройка `tailwind.config.ts` (кастомные цвета, шрифты)
- [ ] `globals.css` с CSS переменными (тёмная/светлая тема)
- [ ] `ThemeProvider.tsx` + `useTheme.ts`
- [ ] `Header.tsx` + `Footer.tsx`
- [ ] `PageWrapper.tsx` с Framer Motion
- [ ] Подключение Google Fonts (Rajdhani, IBM Plex Sans, IBM Plex Mono)

**Критерий готовности**: Приложение открывается, тема переключается без flash.

---

### ЭТАП 1 — Лендинг (День 3-4)
**Цель**: Визуально впечатляющая главная страница

**Задачи**:
- [ ] `HeroSection.tsx` — анимированный заголовок, декоративная SVG
- [ ] `FeaturesSection.tsx` — 4 карточки с hover
- [ ] `HowItWorksSection.tsx` — timeline
- [ ] `CTASection.tsx`
- [ ] Адаптив (мобайл / планшет / десктоп)

**Критерий готовности**: Lighthouse Performance > 90, выглядит "wow".

---

### ЭТАП 2 — Расчётная логика (День 5-7)
**Цель**: Работающие алгоритмы расчёта

**Задачи**:
- [ ] `lib/calculations/constants.ts`
  - Таблица токов нагрузок (ГОСТ)
  - Номинальный ряд автоматов: 6, 10, 16, 20, 25, 32, 40, 50, 63А
  - Токи УЗО: 10, 25, 40, 63А / токи утечки: 10, 30, 100, 300мА
- [ ] `lib/calculations/breakers.ts`
  - `selectBreaker(loadAmps)` → ближайший больший номинал
  - `selectGroupBreakers(rooms)` → массив автоматов по группам
  - `selectMainBreaker(totalLoad)` → вводной автомат
- [ ] `lib/calculations/rcd.ts`
  - `selectRCD(groupBreakers)` → УЗО на группу / УЗО вводное
  - `shouldUseDiff(room)` → диф вместо УЗО+автомат (ванная, детская)
- [ ] `lib/calculations/panel.ts`
  - `countModules(devices)` → сумма модулей
  - `selectPanelSize(modules)` → рекомендация щита
- [ ] `POST /api/calculate` — API роут

**Критерий готовности**: Unit-тесты проходят, расчёт для 2-комнатной квартиры корректен.

---

### ЭТАП 3 — Калькулятор UI (День 8-10)
**Цель**: Полнофункциональный калькулятор

**Задачи**:
- [ ] `calculatorStore.ts` (Zustand)
- [ ] `CalculatorForm.tsx` — многошаговая форма (Stepper)
- [ ] `RoomConfigurator.tsx` — добавление/удаление комнат
- [ ] `LoadItem.tsx` — нагрузки (чекбоксы + кастомные)
- [ ] `CalculatorResults.tsx` — анимированные результаты
- [ ] `BreakerCard.tsx` — карточки устройств
- [ ] `MaterialsList.tsx` — BOM таблица

**Критерий готовности**: Пользователь заполняет форму → видит список автоматов с номиналами.

---

### ЭТАП 4 — Конфигуратор щитка (День 11-12)
**Цель**: Визуализация щитка

**Задачи**:
- [ ] `panelStore.ts` (Zustand, связан с calculatorStore)
- [ ] `DINRail.tsx` — SVG рейка с модулями
- [ ] `ModuleItem.tsx` — визуальный модуль (автомат/УЗО/диф)
- [ ] `PanelConfigurator.tsx` — drag-and-drop компоновщик
- [ ] `PanelSummary.tsx` — рекомендации по щиту
- [ ] `PanelExport.tsx` — экспорт

**Критерий готовности**: Щиток отображается графически, можно перемещать модули.

---

### ЭТАП 5 — Схемы расключения (День 13-16)
**Цель**: Интерактивные SVG-схемы

**Задачи**:
- [ ] `WireAnimator.tsx` — базовый анимированный провод
- [ ] `LightBoxScheme.tsx` — схема на свет
- [ ] `SocketBoxScheme.tsx` — схема на розетки
- [ ] `PassthroughScheme.tsx` — проходной выключатель (интерактивный!)
- [ ] `CrossScheme.tsx` — перекрёстный выключатель (интерактивный!)
- [ ] `PanelScheme.tsx` — принципиальная схема щитка
- [ ] `SchemeViewer.tsx` — обёртка с зумом
- [ ] Страница каталога схем + индивидуальные страницы

**Критерий готовности**: Все 5 схем работают, проходной выключатель интерактивен.

---

### ЭТАП 6 — AI Консультант (День 17-18)
**Цель**: Чат с DeepSeek

**Задачи**:
- [ ] `lib/deepseek.ts` — клиент с системным промптом
- [ ] `data/prompts.ts` — экспертный системный промпт (ПУЭ, ГОСТ)
- [ ] `POST /api/consultant` — streaming route (DeepSeek API)
- [ ] `ConsultantChat.tsx` — чат UI
- [ ] `MessageBubble.tsx` — пузыри сообщений
- [ ] `StreamingResponse.tsx` — стриминг
- [ ] `QuickPrompts.tsx` — быстрые запросы
- [ ] Передача контекста расчёта в промпт

**Критерий готовности**: Пользователь может спросить вопрос и получить ответ со ссылками на ПУЭ.

---

### ЭТАП 7 — PDF Экспорт + Полировка (День 19-21)
**Цель**: Production-ready

**Задачи**:
- [ ] `lib/pdf-generator.ts` — @react-pdf/renderer шаблон
- [ ] `POST /api/export-pdf` — роут
- [ ] SEO: metadata, OG-теги, sitemap
- [ ] Производительность: lazy loading схем
- [ ] Адаптив: финальная проверка мобайл
- [ ] Accessibility: aria-labels, keyboard nav
- [ ] Error boundaries
- [ ] 404 / loading states

---

## 📋 Текущие задачи

### В работе
- [x] Архитектура и документация ✅

### Следующий шаг
- [ ] ЭТАП 0: Инициализация проекта

---

## ⚡ Системный промпт для DeepSeek-консультанта

```
Ты — эксперт-электрик по жилым помещениям России и СНГ.
Знаешь ПУЭ 7-е издание, ГОСТ Р 50571, СП 256.1325800.

Правила ответов:
1. Конкретные номиналы (16А, 25А, 30мА) — всегда
2. Ссылки на пункты ПУЭ где применимо
3. Объясняй ПОЧЕМУ, не только ЧТО
4. Предупреждай об опасных ошибках
5. Рекомендуй схему TN-C-S для новых установок
6. Отвечай на русском языке

Контекст: бытовая электроустановка, 220В, 50Гц, однофазная.
```
