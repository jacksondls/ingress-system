# Ingress System

Plataforma de eventos e ingressos (Desafio Elite Dev): organizar eventos (TMDb / Ticketmaster), comprar por quantidade ou mapa de assentos, pagamento simulado, QR e validação na portaria.

## Pré-requisitos

- Docker Desktop
- Python 3.11+
- Node.js 18+
- Chave gratuita [TMDb API](https://www.themoviedb.org/settings/api) (opcional, busca de filmes)
- Chave [Ticketmaster](https://developer.ticketmaster.com/) (opcional, busca de shows)

## Como rodar

### 1. MySQL

```bash
docker compose up -d
```

MySQL em `localhost:3308` (3306/3307 já estavam ocupadas neste ambiente).

### 2. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Edite `backend/.env` e preencha `TMDB_API_KEY` / `TICKETMASTER_API_KEY` conforme for usar as buscas externas. **Não** versione o `.env`.

```bash
python manage.py migrate
python manage.py seed_events
python manage.py runserver
```

API: http://localhost:8000/api/

O `migrate` inclui o campo `state` (UF) nos eventos. O seed cria um show (pista) e um filme (mapa 5×8) em **SP**.

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

## Fluxo de teste sugerido

1. Entrar como **organizador** → Gerenciar → Novo evento (estado + TMDb ou Ticketmaster) → salvar → criar sessão (pista ou mapa de assentos).
2. Sair e entrar como **cliente1** → na navbar, estado **SP** → Explorar (hero + pôsteres) → evento → reservar quantidade ou assentos → Confirmar pagamento → Meus ingressos (QR).
3. Entrar como **portaria** → selecionar evento → colar código ou ler QR → `valid`.
4. Validar o mesmo código de novo → `already_used`.
5. No checkout, **Recusar pagamento** em outro pedido → `failed`, sem ingressos.
6. Trocar o estado na navbar para outro UF → lista vazia até cadastrar evento naquele estado.

## Endpoints principais

- `POST /api/auth/login/`
- `GET/POST /api/events/` (escrita: organizador; `GET ?query=&type=&state=`)
- `GET /api/tmdb/search/?query=`
- `GET /api/ticketmaster/search/?query=`
- `GET /api/sessions/{id}/seats/`
- `POST /api/orders/` (`quantity` ou `seatIds`) + `POST /api/orders/{id}/pay/`
- `GET /api/tickets/mine/`
- `GET /api/tickets/share/{token}/`
- `POST /api/gate/validate/`

## Uso de IA

- **Ferramenta:** Cursor (agente).

### Decisões minhas

- Fluxo ponta a ponta primeiro (quantidade/pista + TMDb); mapa de assentos e Ticketmaster depois.
- Visual inspirado no Cinemark (hero do lançamento, pôsteres horizontais, cores preto/branco/vermelho), login no estilo AdminLTE e busca Enhanced Search.
- Hover nos pôsteres com descrição, horários e vagas.
- Filtro por estado (UF) na navbar, ao lado de Explorar.
- Porta MySQL **3308** e usuários/senhas do seed.

### Com Cursor (implementação)

Scaffolding React/Django, CRUD, Docker MySQL, JWT, pedidos, QR, portaria, TMDb, Ticketmaster, mapa de assentos, CSS/UI e o filtro por UF.

**Dificuldades:**

- Portas MySQL 3306 e 3307 ocupadas no Windows; o banco local ficou em **3308**.
- Filtro por estado: o evento só tinha `venue` (texto livre); foi preciso campo **UF** (`state`), migration e o select na navbar.

### Revisão minha (sem a IA gerar)

Seed de usuários, escolha das portas, critérios da portaria (`valid` / `already_used` / etc.) e o texto deste README.

## Limitações atuais

- Pagamento 100% simulado (botões aprovar/recusar).
- Deploy ainda não publicado.
- Ticketmaster exige `TICKETMASTER_API_KEY` no `.env`.
- Eventos seed só em SP; outros estados só aparecem depois de cadastro.

## Docs extras

- [`backend/README.md`](backend/README.md)
- [`frontend/README.md`](frontend/README.md)
