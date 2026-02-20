# API-Barros

Projeto com frontend React (`my-neon-app`) para consulta de CEP + Neon Auth e backend PHP (`api/`) para salvar historico no Neon Postgres.

## Estrutura

- `my-neon-app/`: app React (Vite)
- `api/`: endpoint PHP `GET/POST /api/cep-history.php`
- `database/schema.sql`: script da tabela `cep_history`

## Backend PHP (cPanel/Hostinger)

1. Execute `database/schema.sql` no Neon SQL Editor (Postgres).
2. Publique a pasta `api/` dentro de `public_html/api`.
3. Configure variaveis de ambiente no host:
- `PG_HOST`
- `PG_PORT` (padrao `5432`)
- `PG_DB`
- `PG_USER`
- `PG_PASS`
- `PG_SSLMODE` (padrao `require`)
- `PG_DSN` (opcional, DSN completo Postgres)
- `ALLOWED_ORIGINS` (CSV com origens permitidas, ex.: `https://seudominio.com`)

Opcional:
- usar arquivo privado de config copiando `api/config.sample.php` para fora do `public_html` e setando `PG_CONFIG_FILE`.

## Frontend React

1. Copie `my-neon-app/.env.example` para `my-neon-app/.env`.
2. Ajuste variaveis no `.env`:
- `VITE_NEON_AUTH_URL`
- `VITE_API_BASE_URL` (vazio para mesma origem, ou `https://api.seudominio.com`)
3. Build:

```bash
cd my-neon-app
npm install
npm run build
```

4. Publique o conteudo de `my-neon-app/dist` no diretorio web.
5. Confirme que o dominio esta permitido em Neon Auth > Domains.

## API

### `POST /api/cep-history.php`

Body JSON:

```json
{
  "cep": "12345678",
  "logradouro": "Rua X",
  "bairro": "Centro",
  "cidade": "Sao Paulo",
  "estado": "SP",
  "fonte": "viacep"
}
```

Resposta:

```json
{ "ok": true, "id": 123 }
```

### `GET /api/cep-history.php?limit=10`

Resposta:

```json
{
  "ok": true,
  "items": [
    {
      "id": 123,
      "cep": "12345678",
      "logradouro": "Rua X",
      "bairro": "Centro",
      "cidade": "Sao Paulo",
      "estado": "SP",
      "consultado_em": "2026-02-20 22:10:00"
    }
  ]
}
```
