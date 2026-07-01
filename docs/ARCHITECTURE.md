# Architecture — ElectroPlan

## 📁 Полная структура файлов

```
electro/
├── docs/                          # Документация
│   ├── PROJECT_OVERVIEW.md
│   ├── ARCHITECTURE.md
│   ├── TECH_STACK.md
│   ├── CURRENT_STATUS.md
│   └── DEPLOYMENT.md
│
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── layout.tsx             # Root layout
│   │   ├── page.tsx               # Landing
│   │   ├── globals.css            # Глобальные стили
│   │   │
│   │   ├── calculator/            # Калькулятор
│   │   │   └── page.tsx
│   │   │
│   │   ├── panel/                 # Визуализация щитка
│   │   │   └── page.tsx
│   │   │
│   │   ├── consultant/            # AI-консультант
│   │   │   └── page.tsx
│   │   │
│   │   └── schemes/               # Схемы (заглушка)
│   │       └── page.tsx
│   │
│   ├── components/
│   │   ├── panel/
│   │   │   └── RealisticPanel.tsx  # Визуализация щитка (чистый HTML/CSS + dnd-kit)
│   │   │
│   │   └── tools/
│   │       └── calculator/
│   │           ├── CalculatorForm.tsx    # Форма ввода
│   │           └── CalculatorResults.tsx # Результаты расчёта
│   │
│   ├── lib/
│   │   ├── calculations/
│   │   │   ├── breakers.ts        # Логика выбора автоматов + STANDARD_LOADS
│   │   │   ├── rcd.ts             # Логика УЗО/дифавтоматов
│   │   │   └── panel.ts           # Расчёт модулей и выбор щитка
│   │   │
│   │   ├── calculate.ts           # Сборка полного расчёта (generateLoadItems)
│   │   ├── deepseek.ts            # DeepSeek API клиент
│   │   └── utils.ts               # cn(), форматирование
│   │
│   ├── store/
│   │   └── calculatorStore.ts     # Zustand store
│   │
│   └── types/
│       └── electrical.ts          # Все типы: Breaker, RCD, PanelItem, Load...
│
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🧩 Ключевые компоненты

### RealisticPanel.tsx — Визуализация щитка

Главный компонент для отображения электрического щитка в реалистичном виде.

**Архитектура рендеринга:**
```
Enclosure (серый корпус)
  └── rows (flex-col)
       └── PanelRow
            ├── Bus (3 полосы: PE, N, L)
            ├── Drops (вертикальные линии 1px к устройствам)
            ├── DeviceCards (flex, sortable через dnd-kit)
            ├── DIN-рейка (градиент)
            ├── GroupBrackets (скобки УЗО/диф → автоматы)
            └── Out (N/PE выходные шины + метки нагрузок)
```

**Константы:**
```typescript
const MOD = 56       // px на 1 DIN-модуль
const CARD_H = 68    // высота карточки устройства
const BUS_H = 6      // высота полосы шины
const DROP_H = 32    // высота спусков
const OUT_H = 56     // высота выходов
const ROW_GAP = 12   // зазор между рядами
```

**Подкомпоненты (внутри RealisticPanel.tsx):**
- `DeviceCard` — sortable карточка устройства (useSortable от dnd-kit)
  - Цветная полоса слева (3px)
  - Номинал и символ устройства
  - Номер (ref) справа сверху
  - Клеммы подключения сверху и снизу (кружки)
- `GroupBrackets` — вертикальные скобки, объединяющие УЗО/диф с его автоматами
- `PanelRow` — один ряд устройств
- `Enclosure` — внешний корпус щитка

**Цвета проводки:**
- L (фаза): `#e74c3c` (красный)
- N (ноль): `#3498db` (синий)
- PE (земля): `#27ae60` (зелёный)

**История реализации:**
1. ✅ Чистый HTML/CSS — первая версия
2. ❌ React Flow (@xyflow/react) — попытка, отказались (масштаб, линии сливались)
3. ✅ Чистый HTML/CSS + @dnd-kit — финальная версия

---

### CalculatorForm.tsx — Форма калькулятора
- Многошаговое взаимодействие через `useState` в `calculatorStore`
- Выбор типа помещения, количества этажей, фазности
- Добавление комнат: название, розеточные группы, освещение
- Выбор спецнагрузок из STANDARD_LOADS

### CalculatorResults.tsx — Результаты расчёта
- Вводной автомат
- УЗО/дифавтоматы
- Групповые автоматы
- Материалы (BOM)
- Кнопка печати

---

## 🗄️ Логика расчёта

### calculate.ts — Центральный модуль сборки

Функция `generateLoadItems()`:
1. Читает выбранные нагрузки из STANDARD_LOADS
2. Добавляет **panelEquipment** (voltage_relay, din_rail_socket) — устройства без автомата, только занимают модули
3. Сортирует: mainBreaker → panelEquipment → RCDs → breakers
4. Возвращает `CalculationResult` со всеми устройствами

### breakers.ts — Автоматы
- `STANDARD_LOADS` — словарь предустановленных нагрузок
- `selectBreakerRating()` — выбор номинала по току
- `calcMainBreaker()` — расчёт вводного
- `calcRoomBreakers()` — групповые автоматы

### rcd.ts — УЗО/дифы
- `generateRCDStrategy()` — три стратегии защиты:
  - `economy` — один дифавтомат на влажное помещение
  - `separate` — отдельно на розетки и на свет
  - `everything_separated` — индивидуальный дифавтомат на КАЖДЫЙ breaker (максимальная селективность)
- Приборы, связанные с водой (washer, dishwasher, boiler, water_heater): 10мА
- Влажные помещения (bathroom, toilet): 10мА
- Тёплый пол в мокрой зоне: 10мА

### panel.ts — Размер щитка
- `countModules()` — подсчёт модулей с запасом 30%
- `selectPanelSize()` — выбор из MODULAR_PANEL_SIZES: [12, 18, 24, 36, 48, 54, 60, 72]

---

## 🔄 Data Flow

```
CalculatorForm
    ↓ (выборки в store)
calculatorStore (Zustand)
    ↓
calculate.ts (generateLoadItems)
    ├── breakers.ts   → CircuitBreaker[]
    ├── rcd.ts        → RCDDevice[]
    ├── panel.ts      → размер щитка
    └── panelEquipment → оборудование (voltage_relay, din_rail_socket)
    ↓
CalculatorResults
    ↓
RealisticPanel (визуализация щитка)
```

---

## 🖥️ Стек сервера

```
Node.js 20 LTS   — среда Next.js
Next.js 16       — SSR + API Routes
Tailwind CSS 3   — стилизация
Zustand 5        — состояние
@dnd-kit         — drag-and-drop
```

> Подробная инструкция по деплою: `docs/DEPLOYMENT.md`
