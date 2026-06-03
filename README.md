# SupplierHub

SaaS multi-tenant que conecta vendedores Shopee aos seus fornecedores, automatizando o fluxo completo de pedidos.

## Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Pré-requisitos](#pré-requisitos)
4. [Instalação e Execução](#instalação-e-execução)
5. [Variáveis de Ambiente](#variáveis-de-ambiente)
6. [Integração Shopee](#integração-shopee)
7. [Integração Evolution API (WhatsApp)](#integração-evolution-api)
8. [API Reference](#api-reference)
9. [Testes](#testes)
10. [Deploy em Produção](#deploy-em-produção)
11. [Backup e Monitoramento](#backup-e-monitoramento)
12. [Escalabilidade](#escalabilidade)

---

## Visão Geral

```
Cliente compra na Shopee
      ↓
Webhook Shopee → SupplierHub
      ↓
Sistema identifica fornecedor
      ↓
Notifica fornecedor (painel + email + WebSocket)
      ↓
Fornecedor confirma e informa rastreio
      ↓
Sistema envia rastreio para Shopee
      ↓
Seller acompanha tudo em tempo real
```

**Modelo de cobrança:** R$ 2,00 por item vendido, registrado automaticamente.

---

## Arquitetura

```
supplierhub/
├── backend/                    # FastAPI + Python 3.12
│   ├── app/
│   │   ├── auth/              # JWT, OAuth2, tokens
│   │   ├── users/             # CRUD usuários
│   │   ├── sellers/           # Perfil seller
│   │   ├── suppliers/         # CRUD fornecedores
│   │   ├── products/          # CRUD produtos
│   │   ├── orders/            # Pedidos e rastreio
│   │   ├── shopee/            # Integração completa
│   │   ├── billing/           # Cobranças automáticas
│   │   ├── notifications/     # Painel de notificações
│   │   ├── dashboard/         # KPIs e gráficos
│   │   ├── websocket/         # Tempo real
│   │   ├── tasks/             # Celery tasks
│   │   └── common/            # Utilidades compartilhadas
│   └── tests/                 # Pytest com cobertura >70%
│
├── frontend/                   # Angular 20
│   └── src/app/
│       ├── auth/              # Login + Registro
│       ├── dashboard/         # Seller + Admin
│       ├── suppliers/         # CRUD
│       ├── products/          # CRUD
│       ├── orders/            # Lista + Detalhe
│       ├── billing/           # Histórico + Resumo
│       ├── settings/          # Integração Shopee
│       └── shared/            # Services, Guards, Interceptors
│
├── docker-compose.yml          # Orquestração completa
└── .github/workflows/ci.yml   # CI/CD
```

**Stack:**
- Backend: Python 3.12 · FastAPI · Motor (MongoDB async) · Celery · Redis
- Frontend: Angular 20 · Angular Material · Signals · Lazy Loading
- Banco: MongoDB 7.0
- Cache/Filas: Redis 7.2
- WebSocket: nativo FastAPI
- WhatsApp: Evolution API v2

---

## Pré-requisitos

- Docker 24+
- Docker Compose v2+

---

## Instalação e Execução

### 1. Configure variáveis de ambiente

```bash
cp .env.example .env
# Edite .env com suas configurações
```

### 2. Suba todos os serviços

```bash
docker compose up -d
```

### 3. Execute o seed inicial

```bash
docker compose exec backend python seed.py
```

### 4. Acesse

| Serviço | URL |
|---|---|
| Frontend | http://localhost:4200 |
| Backend API | http://localhost:8000 |
| Swagger | http://localhost:8000/docs |
| Evolution API | http://localhost:8080 |

**Credenciais padrão (seed):**
- Admin: `admin@supplierhub.com` / `Admin@123456`
- Demo Seller: `seller@demo.com` / `Seller@123456`

---

## Variáveis de Ambiente

```env
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=sua_senha_segura
MONGO_DB=supplierhub
REDIS_PASSWORD=sua_senha_redis
SECRET_KEY=sua-chave-secreta-muito-longa-e-aleatoria-min-32-chars
SHOPEE_PARTNER_ID=seu_partner_id
SHOPEE_PARTNER_KEY=sua_partner_key
SHOPEE_REDIRECT_URL=https://seudominio.com/settings/shopee/callback
SHOPEE_ENV=sandbox
EVOLUTION_API_URL=http://evolution-api:8080
EVOLUTION_API_KEY=sua_chave_api
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu@email.com
SMTP_PASSWORD=sua_app_password
FRONTEND_URL=https://seudominio.com
ENVIRONMENT=production
```

---

## Integração Shopee

### 1. Credenciais

1. Acesse [Shopee Open Platform](https://open.shopee.com)
2. Crie um app e copie `Partner ID` e `Partner Key`
3. Configure callback: `https://seudominio.com/settings/shopee/callback`

### 2. Webhooks

Configure na Shopee Open Platform:

| Evento | URL |
|---|---|
| order.created | `https://seudominio.com/webhooks/shopee/order-created` |
| order.updated | `https://seudominio.com/webhooks/shopee/order-updated` |
| order.cancelled | `https://seudominio.com/webhooks/shopee/order-cancelled` |

---

## Integração Evolution API

```bash
# Criar instância
curl -X POST http://localhost:8080/instance/create \
  -H "apikey: SUA_KEY" \
  -d '{"instanceName": "supplierhub", "qrcode": true}'

# Conectar (escanear QR Code)
curl http://localhost:8080/instance/connect/supplierhub \
  -H "apikey: SUA_KEY"

# Configurar webhook
curl -X POST http://localhost:8080/webhook/set/supplierhub \
  -H "apikey: SUA_KEY" \
  -d '{"url": "https://seudominio.com/webhooks/whatsapp/message"}'
```

---

## API Reference

Documentação completa: http://localhost:8000/docs

```
POST /api/v1/auth/login
POST /api/v1/auth/register
GET  /api/v1/dashboard/seller
GET  /api/v1/suppliers/
POST /api/v1/suppliers/
GET  /api/v1/orders/
PATCH /api/v1/orders/{id}/tracking
GET  /api/v1/billing/summary
ws://host/ws?token=TOKEN
```

---

## Testes

```bash
# Backend
cd backend && pytest --cov=app

# Frontend
cd frontend && npm test
```

---

## Deploy em Produção

```bash
cp .env.example .env
# Gere SECRET_KEY: openssl rand -hex 32
docker compose up -d --build
docker compose exec backend python seed.py
```

---

## Backup e Monitoramento

```bash
# Backup MongoDB
docker compose exec mongodb mongodump --username admin --password SENHA --archive | gzip > backup.gz

# Health check
curl http://localhost:8000/health

# Logs
docker compose logs -f backend
```

---

## Escalabilidade

- **Celery workers:** `docker compose up -d --scale celery_worker=4`
- **Backend:** adicione réplicas com load balancer externo
- **MongoDB:** configure Replica Set para HA
- **Redis:** configure Sentinel ou Cluster