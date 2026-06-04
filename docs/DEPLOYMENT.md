# Deployment — ElectroPlan
# Развёртывание на сервере

---

## 🖥️ Выбор сервера

### Минимальные требования (старт / тест)
| Параметр | Значение |
|----------|---------|
| CPU | 1 vCPU (1–2 GHz) |
| RAM | 1 GB |
| Диск | 20 GB SSD |
| Сеть | 100 Mbit/s |
| Трафик | 1 TB/мес |

Хватит для: разработки, демо, ~50 уникальных пользователей/день.

### Рекомендуемые требования (продакшн)
| Параметр | Значение |
|----------|---------|
| CPU | 2 vCPU |
| RAM | 2–4 GB |
| Диск | 40 GB SSD |
| Сеть | 200 Mbit/s |
| Трафик | неограниченный |

Хватит для: ~500–2000 уникальных пользователей/день, стриминг DeepSeek API, PDF-генерация.

### Почему именно такие цифры?
- Next.js в production-режиме (standalone build) потребляет ~150–300 MB RAM в idle
- PDF-генерация (@react-pdf/renderer) — пиковые нагрузки по CPU, +100–200 MB RAM на запрос
- DeepSeek API стриминг — нагрузка на сеть, не на CPU (прокси потока)
- Node.js однопоточный — 2 vCPU позволяют одновременно обслуживать несколько запросов через cluster

---

## 🐧 Операционная система

**Рекомендация: Ubuntu 24.04 LTS**

Причины:
- LTS (Long Term Support) — обновления безопасности до 2029
- Огромное сообщество, документация на русском
- Официальная поддержка Node.js, Docker, Nginx от разработчиков
- Минимальная серверная версия (Ubuntu Server) — нет GUI, всё идёт в RAM на сервис

Альтернативы:
- Debian 12 — чуть легче, подходит для 1 GB RAM
- AlmaLinux 9 / Rocky Linux 9 — если нужна RHEL-совместимость

---

## 📦 Что должно быть установлено

### Обязательно

```
Node.js 20 LTS     — среда выполнения Next.js
npm / pnpm         — менеджер пакетов (pnpm быстрее)
Nginx              — reverse proxy (HTTPS, кэш, балансировка)
Certbot            — SSL-сертификат Let's Encrypt (бесплатно)
PM2                — менеджер процессов Node.js (автозапуск, мониторинг)
Git                — получение кода с репозитория
UFW                — файрвол (только порты 80, 443, 22)
```

### Опционально (но рекомендуется)

```
fail2ban           — защита от брутфорса SSH
htop               — мониторинг ресурсов
logrotate          — ротация логов (не забивает диск)
```

---

## 🚀 Схема развёртывания

```
Интернет
    │
    ▼
[Nginx :443 HTTPS]  ← SSL от Let's Encrypt (Certbot)
    │
    │  proxy_pass
    ▼
[Next.js :3000]     ← запущен через PM2
    │
    ├── /api/calculate   → lib/calculations/* (серверный расчёт)
    ├── /api/consultant  → DeepSeek API (стриминг)
    └── /api/export-pdf  → @react-pdf/renderer
```

---

## 📋 Пошаговая установка (Ubuntu 24.04)

### Шаг 1 — Обновление системы

```bash
apt update && apt upgrade -y
apt install -y git curl ufw htop
```

### Шаг 2 — Файрвол

```bash
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw enable
```

### Шаг 3 — Node.js 20 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Проверка
node --version   # v20.x.x
npm --version    # 10.x.x

# Установка pnpm (быстрее npm)
npm install -g pnpm pm2
```

### Шаг 4 — Nginx

```bash
apt install -y nginx
systemctl enable nginx
systemctl start nginx
```

### Шаг 5 — Получение кода

```bash
# Создаём пользователя для приложения (не root!)
adduser --disabled-password --gecos "" electroplan
su - electroplan

# Клонирование репозитория
git clone https://github.com/your-org/electroplan.git /home/electroplan/app
cd /home/electroplan/app

# Установка зависимостей
pnpm install --frozen-lockfile

# Сборка для продакшна
pnpm build
```

### Шаг 6 — Переменные окружения

```bash
# /home/electroplan/app/.env.production
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=https://electroplan.ru
NODE_ENV=production
```

```bash
# Права только для владельца
chmod 600 .env.production
```

### Шаг 7 — PM2 (менеджер процессов)

```bash
# ecosystem.config.js в корне проекта:
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'electroplan',
    script: 'node_modules/.bin/next',
    args: 'start',
    cwd: '/home/electroplan/app',
    instances: 2,          // 2 процесса = используем оба vCPU
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    max_memory_restart: '500M',  // перезапуск если >500MB RAM
    error_file: '/var/log/electroplan/error.log',
    out_file: '/var/log/electroplan/out.log',
  }]
}
EOF

mkdir -p /var/log/electroplan
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup   # автозапуск после перезагрузки сервера
```

### Шаг 8 — Nginx конфигурация

```nginx
# /etc/nginx/sites-available/electroplan

server {
    listen 80;
    server_name electroplan.ru www.electroplan.ru;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name electroplan.ru www.electroplan.ru;

    # SSL (Certbot заполнит автоматически)
    ssl_certificate     /etc/letsencrypt/live/electroplan.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/electroplan.ru/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    # Кэш статики Next.js (JS, CSS, изображения)
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SSE стриминг — отключаем буферизацию!
    location /api/consultant {
        proxy_pass http://127.0.0.1:3000;
        proxy_buffering off;
        proxy_cache off;
        proxy_set_header Connection '';
        proxy_http_version 1.1;
        chunked_transfer_encoding on;
    }

    # Всё остальное
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    # Gzip сжатие
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    gzip_min_length 1000;
}
```

```bash
ln -s /etc/nginx/sites-available/electroplan /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

### Шаг 9 — SSL сертификат

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d electroplan.ru -d www.electroplan.ru

# Автообновление (cron)
echo "0 12 * * * certbot renew --quiet" | crontab -
```

---

## 🔄 CI/CD — автодеплой при пуше в main

```yaml
# .github/workflows/deploy.yml

name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: electroplan
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /home/electroplan/app
            git pull origin main
            pnpm install --frozen-lockfile
            pnpm build
            pm2 reload electroplan --update-env
```

---

## ☁️ Альтернативы VPS — где хостить

### Вариант A: Vercel (рекомендую для старта — бесплатно!)
```
+ Нулевая настройка (push → деплой автоматически)
+ Edge Network (CDN по всему миру)
+ Бесплатный SSL
+ Serverless API Routes → нет проблем с масштабированием
-+ Бесплатный план: лимит на DeepSeek API стриминг (60s timeout)
- Платный план: $20/мес для продакшна
```

```bash
npm install -g vercel
vercel --prod
# Добавить DEEPSEEK_API_KEY в dashboard vercel.com
```

### Вариант B: VPS (полный контроль)
| Хостер | Конфиг | Цена/мес |
|--------|--------|----------|
| Timeweb Cloud | 2 vCPU / 2 GB / 40 GB SSD | ~450 руб |
| Selectel | 2 vCPU / 2 GB / 50 GB SSD | ~600 руб |
| REG.RU VPS | 2 vCPU / 4 GB / 50 GB SSD | ~700 руб |
| Hetzner (EU) | 2 vCPU / 4 GB / 40 GB SSD | ~€5–7 |
| DigitalOcean | 2 vCPU / 2 GB / 60 GB SSD | $18 |

> Для аудитории из России — **Timeweb** или **Selectel**: дата-центры в РФ, низкая задержка.

### Вариант C: Docker (если хочешь изолированность)

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

```bash
docker build -t electroplan .
docker run -d -p 3000:3000 \
  -e DEEPSEEK_API_KEY=sk-xxx \
  --name electroplan \
  electroplan
```

---

## 🔐 Безопасность

```bash
# 1. DEEPSEEK_API_KEY только на сервере, НИКОГДА в клиентском коде
# ✅ /api/consultant/route.ts — серверный route (Edge/Node)
# ❌ Нельзя: process.env.DEEPSEEK_API_KEY в компонентах без 'use server'

# 2. Rate limiting для API routes (защита от спама)
# Добавить в middleware.ts:
# - 10 запросов/мин на /api/consultant (DeepSeek дорогой)
# - 30 запросов/мин на /api/calculate

# 3. .gitignore обязательно содержит:
.env
.env.production
.env.local
DEEPSEEK_API_KEY
```

---

## 📊 Мониторинг

```bash
# Просмотр логов в реальном времени
pm2 logs electroplan

# Статус процессов + RAM/CPU
pm2 monit

# Перезапуск при изменении кода
pm2 reload electroplan

# Nginx логи
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## 💡 Итоговая рекомендация по деплою

| Этап | Где деплоить | Стоимость |
|------|-------------|-----------|
| Разработка / MVP | **Vercel** (free tier) | 0 руб |
| Первые пользователи | **Vercel Pro** или Timeweb 2vCPU/2GB | 450–700 руб/мес |
| Рост >1000 users/день | Timeweb 4vCPU/4GB + Redis для кэша | ~1200 руб/мес |
| Серьёзная нагрузка | Kubernetes / несколько нод | обсуждается |

**Для этого проекта на старте: Vercel** — ноль DevOps, мгновенный деплой,
бесплатный SSL, глобальный CDN. Переход на VPS — когда появится необходимость
в кастомной инфраструктуре или упрётесь в лимиты.
