# Tech Stack — ElectroPlan

## 🏗️ Выбранный стек и обоснование

### Core Framework: **Next.js 14 (App Router)**
```
✅ SSR/SSG для SEO (электрика — высокочастотные запросы)
✅ API Routes — встроенный бэкенд для DeepSeek API
✅ Server Components — быстрый FCP
✅ File-based routing — чистая структура
```

### Language: **TypeScript**
```
✅ Типизация для электрических расчётов (номиналы, токи — критично)
✅ Autocomplete для сложных domain-объектов
✅ Меньше runtime-ошибок в калькуляторах
```

### Styling: **Tailwind CSS + CSS Variables**
```
✅ Rapid development
✅ Тёмная/светлая тема через CSS vars (no flash)
✅ Кастомная палитра Industrial
✅ JIT — минимальный bundle
```

### UI Components: **shadcn/ui**
```
✅ Headless, полностью кастомизируемые
✅ Доступность (ARIA) из коробки
✅ Радиксовые примитивы — надёжность
✅ Не тащит лишние стили
```

### Animations: **Framer Motion**
```
✅ Плавные переходы между разделами
✅ Анимация схем (SVG path animation)
✅ Stagger-эффекты для списков компонентов щитка
✅ Layout animations для калькулятора
```

### SVG Schemes: **Ручные SVG + React**
```
✅ Полный контроль над схемами
✅ Анимация тока (dash-offset animation)
✅ Интерактивные элементы (hover, клик)
✅ Нет зависимостей типа d3 для простых схем
```

### AI: **DeepSeek API (deepseek-chat)**
```
✅ Понимает технический контекст ПУЭ
✅ Структурированные ответы через JSON mode
✅ Стриминг для консультанта
```

### PDF Export: **@react-pdf/renderer**
```
✅ React-компоненты → PDF
✅ Схемы + таблицы + расчёты в одном документе
```

### Forms: **React Hook Form + Zod**
```
✅ Валидация входных данных калькулятора
✅ Типобезопасные схемы Zod
✅ Минимальные ре-рендеры
```

### State: **Zustand**
```
✅ Глобальный стейт расчёта (передаётся между калькулятором и щитком)
✅ Персистентность (localStorage) — не теряем расчёт при навигации
✅ Минималистичный API
```

---

## 📦 package.json зависимости

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "typescript": "^5.4.0",
    "tailwindcss": "^3.4.0",
    "framer-motion": "^11.0.0",
    "@radix-ui/react-*": "latest",
    "zustand": "^4.5.0",
    "react-hook-form": "^7.51.0",
    "zod": "^3.23.0",
    // AI через DeepSeek API (OpenAI-совместимый, без доп. SDK)
    "@react-pdf/renderer": "^3.4.0",
    "lucide-react": "^0.372.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.3.0"
  }
}
```

---

## 🎨 Цветовая палитра

### Тёмная тема (основная)
```css
--bg-base:        #0A0B0D;  /* Почти чёрный, не #000 */
--bg-surface:     #111318;  /* Карточки, панели */
--bg-elevated:    #1A1D24;  /* Hover, модалки */
--bg-subtle:      #242830;  /* Разделители, подложки */

--amber-400:      #FBBF24;  /* Главный акцент — предупреждение */
--amber-500:      #F59E0B;  /* Кнопки, иконки */
--amber-glow:     rgba(251,191,36,0.15); /* Свечение */

--electric-blue:  #38BDF8;  /* Вторичный акцент — ноль/нейтраль */
--danger-red:     #EF4444;  /* Фаза, опасность */
--earth-green:    #22C55E;  /* Земля (PE) */

--text-primary:   #F1F5F9;
--text-secondary: #94A3B8;
--text-muted:     #475569;

--border:         rgba(255,255,255,0.08);
--border-accent:  rgba(251,191,36,0.3);
```

### Светлая тема
```css
--bg-base:        #F8FAFC;
--bg-surface:     #FFFFFF;
--bg-elevated:    #F1F5F9;
--bg-subtle:      #E2E8F0;

--amber-400:      #D97706;
--electric-blue:  #0284C7;
--danger-red:     #DC2626;
--earth-green:    #16A34A;

--text-primary:   #0F172A;
--text-secondary: #475569;
--text-muted:     #94A3B8;

--border:         rgba(0,0,0,0.08);
```

---

## 🔤 Типографика

```
Display/Hero:    "Rajdhani" — техническая гротескная, геометрическая
Body/UI:         "IBM Plex Sans" — читаемый технический
Monospace/Data:  "IBM Plex Mono" — цифры, коды, номиналы
```
