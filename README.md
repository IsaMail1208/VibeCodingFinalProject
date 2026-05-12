# Vibe Chat

Короткое описание: учебный веб-чат с REST API на **FastAPI**, хранением в **SQLite** и простым фронтендом (HTML/CSS/JS). Подходит для финального проекта курса Vibe Coding.

## Возможности

- Регистрация пользователя, список пользователей, поиск по имени или email
- Отправка и получение сообщений (личный чат 1:1), история переписки
- Поиск по тексту в текущей переписке; фильтрация сообщений по отправителю, получателю и паре пользователей через API
- Веб-интерфейс: список пользователей, поле ввода, окно чата, опрос новых сообщений
- Дополнительно: тёмная тема, индикатор «печатает…», поддержка эмодзи в тексте, **Docker**

## Технологии

- Python 3.12+, FastAPI, Uvicorn  
- SQLAlchemy 2, SQLite  
- Pydantic, passlib (bcrypt)  
- Фронтенд: статические файлы без сборщика  
- Тесты: pytest, httpx (TestClient)

## Как запустить локально

```powershell
cd "c:\Users\user\Desktop\Salymbekov University\2 курс\Vibe coding"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Откройте в браузере: `http://127.0.0.1:8000/`

Тесты:

```powershell
pytest -q
```

Docker:

```powershell
docker build -t vibe-chat .
docker run -p 8000:8000 vibe-chat
```

## Ссылка на живой сайт

_Вставьте сюда ссылку после деплоя (Render, Railway, Fly.io и т.д.):_  
**https://your-app.onrender.com** (замените на реальную)

## Ссылка на демо-видео (YouTube)

_После записи 2–3 минут вставьте ссылку:_  
**https://www.youtube.com/watch?v=...**

## Скриншоты

_Добавьте изображения в репозиторий (например, `docs/screenshot.png`) и вставьте ссылки сюда._

## Сдача проекта

- Публичный репозиторий GitHub с полным кодом  
- Письмо на **kyrgyzstanait@gmail.com**, тема: `Vibe Coding Final Project – Ваше ФИО`  
- Соблюдение дедлайна из задания

## API (кратко)

| Метод | Путь | Описание |
|--------|------|-----------|
| GET | `/api/health` | Проверка работы |
| POST | `/api/users` | Регистрация |
| GET | `/api/users?q=` | Список / поиск |
| GET | `/api/users/{id}` | Один пользователь |
| POST | `/api/messages` | Отправить сообщение |
| GET | `/api/messages/conversation/{a}/{b}?search=` | История между двумя пользователями |
| GET | `/api/messages` | Список с параметрами `sender_id`, `receiver_id`, `user_a`+`user_b`, `search` |

Интерактивная документация: `http://127.0.0.1:8000/docs`
