# Tech Stack — ElectroPlan

## 🏗️ Стек

### Core Framework: **Next.js 16 (App Router + Turbopack)**
```
✅ SSR для страниц (калькулятор, щиток, консультант)
✅ API Routes — встроенный бэкенд (DeepSeek API)
✅ Turbopack — быстрая разработка
```

### Language: **TypeScript 5**
```
✅ Типизация для электрических расчётов
✅ Autocomplete для domain-объектов
```

### Styling: **Tailwind CSS 3**
```
✅ Быстрая разработка
✅ Кастомные цвета под электромонтажную тему
✅ JIT — минимальный bundle
```

### Drag-and-Drop: **@dnd-kit**
```
✅ @dnd-kit/core — DndContext, DragOverlay
✅ @dnd-kit/sortable — SortableContext, useSortable, arrayMove
✅ Перетаскивание устройств между рядами в щитке
```

### State: **Zustand 5**
```
✅ Глобальное состояние расчёта
✅ Передача данных между калькулятором и визуализацией щитка
```

### AI: **DeepSeek API**
```
✅ Стриминг ответов через API Route
```

### Icons: **Lucide React**
```
✅ Иконки для UI
```

---

## 📦 Текущие зависимости

```json
{
  "dependencies": {
    "@dnd-kit/core": "^6.3.1",
    "@dnd-kit/sortable": "^10.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "clsx": "^2.1.1",
    "framer-motion": "^12.40.0",
    "lucide-react": "^1.17.0",
    "next": "16.2.7",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "tailwind-merge": "^3.6.0",
    "zustand": "^5.0.14"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "autoprefixer": "^10.5.0",
    "eslint": "^9",
    "eslint-config-next": "16.2.7",
    "postcss": "^8.5.15",
    "tailwindcss": "^3.4.19",
    "typescript": "^5"
  }
}
```

---

## 🎨 Цветовая палитра (электрическая тема)

### Проводка (цвета ANSI)
```css
--phase:    #e74c3c;  /* Красный — фаза L */
--neutral:  #3498db;  /* Синий — ноль N */
--earth:    #27ae60;  /* Зелёный — земля PE */
--output:   #666;     /* Серый — выходы */
--equip:    #bbb;     /* Светло-серый — оборудование */
```

### UI
```css
--bg:       #1a1a2e;  /* Тёмный фон страницы */
--surface:  #16213e;  /* Поверхности карточек */
--accent:   #e94560;  /* Акцентный цвет */
--text:     #eee;     /* Основной текст */
```

---

## 🔤 Типографика

Стандартная системная (Next.js default). Без кастомных шрифтов для minimial деплоя.
