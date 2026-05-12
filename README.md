# 🌿 Andrea Health

Diario personale di benessere e nutrizione — con analisi AI, bot Telegram e statistiche dettagliate.

## Funzionalità

- **📔 Diario** — Inserimento libero analizzato da Claude AI (pasti, bagno, note)
- **📊 Statistiche** — Grafici calorie, macronutrienti, bagni con filtri temporali
- **💧 Intestino** — Monitoraggio idratazione e feci con color coding
- **⚖️ Biometriche** — Tracciamento peso, BMI, composizione corporea
- **📱 Telegram Bot** — Logging e report dal telefono
- **🌙/☀️ Dark/Light mode** — Tema persistito per utente

## Stack tecnico

| Layer | Tecnologia |
|---|---|
| Backend | FastAPI + Python 3.12 |
| Frontend | React 18 + Vite + TailwindCSS |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Container | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Proxy | Nginx |

---

## Prerequisiti

- [Docker](https://docs.docker.com/get-docker/) >= 24
- [Docker Compose](https://docs.docker.com/compose/install/) >= 2.20
- Git

---

## Quick Start (sviluppo)

```bash
# 1. Clona il repo
git clone https://github.com/YOUR_USER/andrea-health.git
cd andrea-health

# 2. Configura le variabili d'ambiente
cp .env.example .env
# Modifica .env con i tuoi valori (almeno SECRET_KEY e FERNET_KEY)

# 3. Genera le chiavi di sicurezza
SECRET_KEY=$(openssl rand -hex 32)
FERNET_KEY=$(python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")
# Inseriscile nel file .env

# 4. Avvia
docker compose up -d

# 5. Crea il primo utente
docker compose exec backend python -c "
import asyncio
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.core.security import get_password_hash

async def create():
    async with AsyncSessionLocal() as db:
        user = User(username='andrea', password_hash=get_password_hash('tuapassword'))
        db.add(user); await db.commit()
        print('Utente creato!')

asyncio.run(create())
"

# 6. Apri http://localhost:5173
```

---

## Come ottenere la API Key di Claude

1. Vai su [console.anthropic.com](https://console.anthropic.com)
2. Crea un account o accedi
3. Vai su **API Keys** → **Create Key**
4. Copia la chiave (inizia con `sk-ant-`)
5. Inseriscila nelle **Impostazioni** dell'app (viene salvata cifrata nel DB)

---

## Configurare il Telegram Bot

1. Apri Telegram e cerca `@BotFather`
2. Invia `/newbot` e segui le istruzioni
3. Copia il **Bot Token** (es. `1234567890:ABCdef...`)
4. Per trovare il tuo **Chat ID**:
   - Cerca `@userinfobot` su Telegram e invia `/start`
   - Oppure usa `https://api.telegram.org/bot<TOKEN>/getUpdates`
5. Inserisci Token e Chat ID nelle **Impostazioni** dell'app
6. Clicca **Invia messaggio test** per verificare

### Comandi bot disponibili

| Comando | Descrizione |
|---|---|
| `/start` | Benvenuto e istruzioni |
| `/log <testo>` | Aggiungi voce al diario |
| `/oggi` | Riepilogo giornata corrente |
| `/stats` | Statistiche settimana |
| `/peso <kg> [%grasso]` | Logga peso |

---

## GitHub Actions — Setup CI/CD

Aggiungi questi secrets nel tuo repository (`Settings > Secrets > Actions`):

| Secret | Descrizione |
|---|---|
| `SERVER_HOST` | IP o hostname del server di produzione |
| `SERVER_USER` | Utente SSH del server |
| `SERVER_SSH_KEY` | Chiave SSH privata |
| `TELEGRAM_DEPLOY_BOT_TOKEN` | Token bot per notifiche deploy |
| `TELEGRAM_DEPLOY_CHAT_ID` | Chat ID per notifiche deploy |

Il `GITHUB_TOKEN` per GHCR è fornito automaticamente da GitHub Actions.

---

## Struttura del progetto

```
andrea-health/
├── backend/
│   ├── app/
│   │   ├── api/routes/      # Auth, entries, stats, biometrics, settings, export, telegram
│   │   ├── core/            # Config, security (JWT, Fernet)
│   │   ├── db/              # SQLAlchemy session, base models
│   │   ├── models/          # ORM models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── services/        # Claude AI, Telegram, Export
│   │   ├── tests/           # pytest
│   │   └── main.py
│   ├── alembic/             # Database migrations
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios client, endpoints
│   │   ├── components/      # Layout, UI components
│   │   ├── pages/           # Diary, Stats, Intestino, Biometriche, Settings, Login
│   │   ├── store/           # Zustand (auth, theme)
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Date helpers
│   └── package.json
├── nginx/                   # Nginx configs (dev + prod)
├── .github/workflows/       # CI/CD pipeline
├── Dockerfile.backend
├── Dockerfile.frontend
├── docker-compose.yml       # Development
├── docker-compose.prod.yml  # Production
└── .env.example
```

---

## Comandi utili

```bash
# Logs
docker compose logs -f backend
docker compose logs -f frontend

# Database
docker compose exec db psql -U andrea_health -d andrea_health_db

# Alembic migrations
docker compose exec backend alembic upgrade head
docker compose exec backend alembic revision --autogenerate -m "descrizione"

# Backup DB
docker compose exec db pg_dump -U andrea_health andrea_health_db > backup_$(date +%Y%m%d).sql

# Restore DB
cat backup.sql | docker compose exec -T db psql -U andrea_health andrea_health_db

# Test
docker compose exec backend pytest app/tests/ -v

# Rebuild
docker compose build backend
docker compose up -d backend
```

---

## Produzione (deploy manuale)

```bash
# Sul server
cd /opt/andrea-health
cp .env.example .env  # e configura tutti i valori

docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

---

## Sicurezza

- Password utente hashate con bcrypt
- JWT access token (24h) + refresh token (30 giorni) via httpOnly cookie
- API Key Claude cifrata con Fernet (symmetric encryption)
- Rate limiting login: 5 tentativi / 15 minuti
- CORS configurato per origin specifici
- Headers di sicurezza HTTP via Nginx
- Container non-root
