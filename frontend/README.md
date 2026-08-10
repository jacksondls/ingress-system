# Eventos (frontend)

App React para explorar e gerenciar shows e filmes (sessões inclusas). Dados mock em `localStorage` até o backend Python.

## Setup

```bash
cd frontend
npm install
npm run dev
```

Abra a URL do Vite (geralmente `http://localhost:5173`).

## Rotas

- `/` — buscar e filtrar eventos
- `/evento/:id` — detalhe + sessões
- `/admin` — listar / excluir
- `/admin/eventos/novo` — criar
- `/admin/eventos/:id` — editar evento e sessões
