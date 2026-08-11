# Backend (Django + MySQL)

Ver o [README na raiz](../README.md) para o fluxo completo.

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py seed_events
python manage.py runserver
```

Configure `TMDB_API_KEY` e `MYSQL_PORT` (padrão 3308) no `.env`.
