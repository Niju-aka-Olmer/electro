# Changelog

## [1.1.0] — 2026-06-05

### Полноценный калькулятор электроустановок + схемы расключения

Полная переработка страниц-заглушек в рабочий инструмент: калькулятор с формой помещений, результатами и интерактивными схемами расключения.

#### Добавлено
- **Калькулятор** (`/calculator`):
  - [CalculatorForm.tsx](file:///k:/project/electro/src/components/tools/calculator/CalculatorForm.tsx) — форма с шагами 1-2:
    - Шаг 1: параметры подключения (заземление, фазы, вводной автомат 25-63А)
    - Шаг 2: добавление комнат — 9 типов помещений с иконками, розетки/свет/спецнагрузки (7 предустановленных мощных потребителей)
    - Выбор стратегии защиты влажных помещений: «Эконом» (1 диф) или «Раздельный» (2 дифа) с пояснениями
    - Пояснение (i) для системы заземления — TN-C, TN-C-S, TN-S, TT
  - [CalculatorResults.tsx](file:///k:/project/electro/src/components/tools/calculator/CalculatorResults.tsx) — результаты:
    - Таблица спецификации (вводной, УЗО, дифы, групповые автоматы)
    - Визуализация раскладки по DIN-рейкам (цветные блоки)
    - Предупреждения и примечания
    - Секция «Как рассчитывалось» с пояснениями
  - [calculate.ts](file:///k:/project/electro/src/lib/calculate.ts) — оркестратор расчёта
  - [calculate.ts](file:///k:/project/electro/src/lib/calculate.ts) — предупреждение про селективность (сумма номиналов > вводного — это нормально)
- **Схемы расключения** (`/schemes`):
  - 4 SVG-схемы: проходной выключатель (2 и 3 точки), распределительная коробка, сборка щитка
  - Переключение между схемами кнопками
  - 3 карточки пояснений (как читать схему, безопасность, сечения)
- **Выбор стратегии влажных помещений**:
  - `bathroomStrategy` в `CalculationInput`
  - `economy`: 1 дифавтомат на всё помещение (дешевле)
  - `separate`: 2 дифа — отдельно розетки/техника, отдельно свет (безопаснее)

#### Изменено
- Структура проекта: черновые файлы из корня → `src/` (типы, расчёты, стора, компоненты)
- [page.tsx](file:///k:/project/electro/src/app/page.tsx) — лендинг с кнопками «Начать расчёт →» и «Смотреть схемы»
- [calculator/page.tsx](file:///k:/project/electro/src/app/calculator/page.tsx) — пошаговая инструкция (3 пункта), индикатор шагов
- [schemes/page.tsx](file:///k:/project/electro/src/app/schemes/page.tsx) — 4 SVG-схемы с пояснениями
- [layout.tsx](file:///k:/project/electro/src/app/layout.tsx) — шрифты Rajdhani, IBM Plex Sans/Mono
- [globals.css](file:///k:/project/electro/src/app/globals.css) — кастомная тёмная тема «Industrial Precision»
- [tailwind.config.ts](file:///k:/project/electro/tailwind.config.ts) — кастомные цвета (bg-base, accent-amber и т.д.)
- [rcd.ts](file:///k:/project/electro/src/lib/calculations/rcd.ts) — поддержка двух стратегий защиты влажных помещений
- [electrical.ts](file:///k:/project/electro/src/types/electrical.ts) — добавлен `bathroomStrategy` в `CalculationInput`

#### Исправлено
- UUID в названиях УЗО → человекочитаемые названия групп (fix `b.id` → `b.group`)
- `leakageMA` vs `leakageCurrentMa` — УЗО не отображались в результатах
- `panelRows` — ошибка рендера (число использовалось как массив)
- Типизация `loads` — добавлены поля `currentA`, `isHighLoad`
- Tailwind v3 vs v4 — переписана конфигурация postcss

#### Установленные зависимости
- `next`, `react`, `typescript`, `tailwindcss@3`
- `zustand` (управление состоянием), `clsx` + `tailwind-merge` (CSS)
- `lucide-react` (иконки), `framer-motion` (анимации)

---

## [1.0.0] — 2026-06-04

### Замена AI Claude → DeepSeek

Замена AI-консультанта с Anthropic Claude API на DeepSeek API (OpenAI-совместимый).

#### Добавлено
- [deepseek.ts](file:///k:/project/electro/src/lib/deepseek.ts) — клиент DeepSeek API
- [prompts.ts](file:///k:/project/electro/src/data/prompts.ts) — системный промпт эксперта-электрика

#### Удалено
- `claude.ts` — старый клиент Claude API

#### Переменная окружения (требуется)
```
DEEPSEEK_API_KEY=sk-...
```
