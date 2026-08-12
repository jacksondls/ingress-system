# Ingress System

Plataforma de eventos e ingressos (Desafio Elite Dev): organizar eventos (TMDb), comprar por quantidade, pagamento simulado, QR e validação na portaria.

## Pré-requisitos

- Docker Desktop
- Python 3.11+
- Node.js 18+
- Chave gratuita [TMDb API](https://www.themoviedb.org/settings/api) (opcional só para busca de filmes)

## Como rodar

### 1. MySQL

```bash
docker compose up -d
```

MySQL em `localhost:3308`.

### 2. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Edite `backend/.env` e preencha `TMDB_API_KEY` / `TICKETMASTER_API_KEY` conforme for usar as buscas externas.

```bash
python manage.py migrate
python manage.py seed_events
python manage.py runserver
```

API: http://localhost:8000/api/

### 3. Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

App: http://localhost:5173

## Usuários de teste (seed)

| Usuário | Senha | Papel |
|---------|-------|-------|
| organizador | organizador123 | Organizador |
| cliente1 | cliente123 | Cliente |
| cliente2 | cliente123 | Cliente |
| portaria | portaria123 | Portaria |

Há eventos seed com sessões: show em **pista** e filme com **mapa de assentos** (5×8).

## Fluxo de teste sugerido

1. Entrar como **organizador** → Gerenciar → Novo evento → buscar filme no TMDb → salvar → criar sessão.
2. Sair e entrar como **cliente1** → Explorar → Reservar quantidade → Confirmar pagamento → Meus ingressos (QR).
3. Entrar como **portaria** → selecionar evento → colar código ou ler QR → deve retornar `valid`.
4. Validar o mesmo código de novo → `already_used`.
5. No checkout, use **Recusar pagamento** em outro pedido → status `failed`, sem ingressos.

## Endpoints principais

- `POST /api/auth/login/`
- `GET/POST /api/events/` (escrita: organizador)
- `GET /api/tmdb/search/?query=`
- `POST /api/orders/` + `POST /api/orders/{id}/pay/`
- `GET /api/tickets/mine/`
- `GET /api/tickets/share/{token}/`
- `POST /api/gate/validate/`

## Uso de IA

- **Ferramenta:** Cursor (agente) para scaffolding React/Django, CRUD inicial, Docker MySQL e implementação do fluxo de auth/pedidos/QR/portaria.
- **Decisões humanas:** escopo do desafio (quantidade/pista + TMDb primeiro; mapa/Ticketmaster depois), papéis, porta MySQL 3308 por conflito local, remoção de co-autoria Cursor nos commits, prioridade “fluxo ponta a ponta”.
- **Sem IA / revisão:** ajustes de portas, seed de usuários, checagem do README e critérios de validação da portaria.

## Limitações atuais

- Pagamento 100% simulado (botões aprovar/recusar).
- Deploy ainda não publicado.
- Ticketmaster exige `TICKETMASTER_API_KEY` no `.env`.

## Docs extras

- [`backend/README.md`](backend/README.md)
- [`frontend/README.md`](frontend/README.md)
