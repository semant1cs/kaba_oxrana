## Discord verification bot

Бот для верификации пользователей по фото для Discord‑сервера.

Пользователь отправляет фото лица, бот локально пытается определить наличие очков и автоматически принимает или отклоняет верификацию.

### Технологии

- Node.js
- discord.js
- Python + OpenCV (локальная детекция)

### Подготовка бота в Discord

1. Зайди в Discord Developer Portal и создай новое приложение.
2. Добавь бота к приложению и скопируй токен бота.
3. На вкладке OAuth2 добавь scope `bot` и `applications.commands`.
4. Выдай боту права как минимум:
   - чтение и отправка сообщений,
   - управление ролями (Manage Roles), если бот должен выдавать роль верификации.
5. Добавь бота на свой сервер по сгенерированной ссылке.

### Локальная установка

1. Установи зависимости Node.js:

```bash
npm install
```

2. Подготовь Python‑окружение для OpenCV:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install opencv-python
```

Можно использовать и глобально установленный Python с opencv-python, если удобнее.

3. Создай файл `.env` по примеру:

```bash
cp .env.example .env
```

И заполни значения:

- `DISCORD_TOKEN` — токен бота.
- `CLIENT_ID` — ID приложения (Application ID).
- `GUILD_ID` — ID сервера.
- `VERIFIED_ROLE_ID` — ID роли, которая будет выдаваться после успешной верификации.
- `VERIFY_CHANNEL_ID` — (опционально) ID канала, где разрешено вызывать `/verify`.

4. Зарегистрируй slash‑команды для сервера:

```bash
npm run deploy-commands
```

После этого в выбранном сервере появятся команды `/help` и `/verify`.

5. Запусти бота:

```bash
npm start
```

### Поведение команд

- `/help` — кратко описывает, как проходит верификация и требования к фото, без раскрытия внутренних критериев.
- `/verify` — принимает фото:
  - пользователь должен прикрепить одно изображение с лицом;
  - бот скачивает фото, отправляет его в Python‑модуль с OpenCV;
  - Python‑скрипт пытается определить наличие очков;
  - при срабатывании критерия отклоняет верификацию;
  - при успешной проверке выдаёт роль `VERIFIED_ROLE_ID`.

Если указана переменная `VERIFY_CHANNEL_ID`, команда `/verify` будет работать только в этом канале.

### Запуск в продакшене

1. Подними Linux‑сервер (VPS) с установленным Node.js LTS и Python 3.
2. Скопируй проект на сервер (git clone или через scp/rsync).
3. Установи зависимости:

```bash
cd discord-verif-bot
npm install
python3 -m venv .venv
source .venv/bin/activate
pip install opencv-python
cp .env.example .env
nano .env
```

4. Зарегистрируй команды (однократно или при изменениях):

```bash
npm run deploy-commands
```

5. Установи PM2 для управления процессом:

```bash
npm install -g pm2
pm2 start index.js --name discord-verif-bot
pm2 save
pm2 startup
```

6. Следи за логами и состоянием:

```bash
pm2 status
pm2 logs discord-verif-bot
```

При обновлении кода достаточно обновить файлы и перезапустить процесс:

```bash
git pull
npm install
pm2 restart discord-verif-bot
```

