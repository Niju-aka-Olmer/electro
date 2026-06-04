# Changelog

## [1.0.0] — 2026-06-04

### Замена AI Claude → DeepSeek

Замена AI-консультанта с Anthropic Claude API на DeepSeek API (OpenAI-совместимый).

#### Добавлено
- [deepseek.ts](file:///k:/project/electro/deepseek.ts) — клиент DeepSeek API:
  - Эндпоинт: `https://api.deepseek.com/v1/chat/completions`
  - Модель: `deepseek-chat`
  - Стриминг ответов (ReadableStream)
  - Системный промпт эксперта-электрика (ПУЭ, ГОСТ, СП)
  - `QUICK_PROMPTS` — быстрые запросы для чата
- [prompts.ts](file:///k:/project/electro/prompts.ts) — вынесенный системный промпт

#### Удалено
- [claude.ts](file:///k:/project/electro/claude.ts) — старый клиент Claude API

#### Изменено
Обновлена документация в `docs/`:
- `PROJECT_OVERVIEW.md` — DeepSeek вместо Claude
- `ARCHITECTURE.md` — все упоминания обновлены
- `CURRENT_STATUS.md` — список зависимостей, этапы
- `TECH_STACK.md` — стек AI, зависимости
- `DEPLOYMENT.md` — переменные окружения, конфигурация

#### Переменная окружения (требуется)
```
DEEPSEEK_API_KEY=sk-...
```
