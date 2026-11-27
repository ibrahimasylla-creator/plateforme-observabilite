# Plateforme d'Observabilité Full-Stack : ELK vs OpenSearch + Métriques Prometheus & Tracing OpenTelemetry

> **Projet Web Avancé — Master 2 Systèmes d'Information  (UADB)**  
> **Binôme #6 :** Ibrahima Sylla & Abdoulaye Dieye  
> **Sujet A (Priorité) :** Observabilité full-stack : ELK vs OpenSearch + métriques Prometheus  
> **Sujet B (Complémentaire) :** Gestion du tracing distribué avec OpenTelemetry

---

## Table des matières

1. [Présentation et Objectifs du Projet](#1-présentation-et-objectifs-du-projet)
2. [Architecture Générale & Flux de Données](#2-architecture-générale--flux-de-données)
3. [Stack Technologique](#3-stack-technologique)
4. [Arborescence Complète du Dépôt](#4-arborescence-complète-du-dépôt)
5. [Prérequis Système](#5-prérequis-système)
6. [Installation et Démarrage depuis Zéro (Mode Conteneurisé Docker)](#6-installation-et-démarrage-depuis-zéro-mode-conteneurisé-docker)
7. [Installation et Démarrage depuis Zéro (Mode Développement Local — Backend & Frontend)](#7-installation-et-démarrage-depuis-zéro-mode-développement-local--backend--frontend)
8. [Cartographie des Services, Ports et Contrats API](#8-cartographie-des-services-ports-et-contrats-api)
9. [Catalogue des Scénarios de Test (`ST01` à `ST05`)](#9-catalogue-des-scénarios-de-test-st01-à-st05)
10. [Protocole Comparatif ELK vs OpenSearch](#10-protocole-comparatif-elk-vs-opensearch)
11. [Commandes d'Audit, PostgreSQL et Diagnostic](#11-commandes-daudit-postgresql-et-diagnostic)
12. [Conformité aux Livrables Attendus](#12-conformité-aux-livrables-attendus)

---

## 1. Présentation et Objectifs du Projet

**ObservaLab** est une plateforme complète de gestion de commandes distribuée conçue pour démontrer et évaluer l'observabilité moderne d'une architecture microservices. L'application repose sur **4 microservices NestJS** connectés à une base de données **PostgreSQL 16** réelle, pilotés par une interface web **React / Vite**.

L'ensemble de la plateforme est instrumenté selon les **trois piliers de l'observabilité** corrélés par un identifiant de trace unique (**`TraceID W3C`**) :

* **Traces distribuées (Sujet B) :** Instrumentation OpenTelemetry Node.js exportant les spans via OTLP vers l'**OpenTelemetry Collector** puis **Jaeger** pour visualiser la cascade complète des appels inter-services et isoler les goulets d'étranglement.
* **Métriques applicatives et infrastructure (Sujet A) :** Exposition d'endpoints `/metrics` collectés par **Prometheus** et restitués dans des tableaux de bord **Grafana** (débit RPS, taux d'erreur, latence P50/P95/P99, CPU et mémoire).
* **Centralisation et analyse des logs (Sujet A) :** Comparaison expérimentale, à périmètre matériel et charge identiques, entre la **Suite ELK** (*Elasticsearch, Logstash, Kibana, Filebeat*) et **OpenSearch** (*OpenSearch, OpenSearch Dashboards*).

---

## 2. Architecture Générale & Flux de Données

```text
                       ┌───────────────────────────────────────────────┐
                       │         ObservaLab UI (React / Vite)          │
                       │             http://localhost:5173             │
                       └───────────────────────┬───────────────────────┘
                                               │ HTTP / JSON + W3C TraceContext
                                               ▼
                       ┌───────────────────────────────────────────────┐
                       │           API Gateway (NestJS :4000)          │
                       └───────┬───────────────┬───────────────┬───────┘
                               │               │               │
                 ┌─────────────▼───┐   ┌───────▼───────┐   ┌───▼─────────────┐
                 │  Orders (:4002) │   │ Users (:4001) │   │ Payments (:4003)│
                 └────────┬────────┘   └───────┬───────┘   └────────┬────────┘
                          │                    │                    │
                          └────────────────────┼────────────────────┘
                                               ▼
                                  ┌─────────────────────────┐
                                  │  PostgreSQL 16 (:5433)  │
                                  │   (Volume: pgdata)      │
                                  └─────────────────────────┘

  ═══════════════════════════════ CHAÎNE D'OBSERVABILITÉ ═══════════════════════════════
  [1] TRACES    : OTel SDK Node.js ──► OTel Collector (:4317/:4318) ──► Jaeger UI (:16686)
  [2] MÉTRIQUES : /metrics + cAdvisor ──► Prometheus (:9095) ──────────► Grafana (:3000)
  [3] LOGS JSON : stdout Conteneurs ──► Filebeat / Collector ─────────► ELK (:5601)
                                                                      └► OpenSearch (:5602)
```

### Cycle de vie d'une transaction distribuée (`POST /api/orders`)
1. L'utilisateur soumet une commande depuis **ObservaLab UI** (`:5173`) en choisissant un client réel, un article, une quantité et un scénario de test (`ST01` à `ST04`).
2. L'**API Gateway** (`:4000`) initialise ou propage le contexte de trace W3C (`traceId`) et route la demande vers **Orders** (`:4002`).
3. **Orders** valide l'existence du client auprès de **Users** (`:4001`), déclenche la transaction financière auprès de **Payments** (`:4003`) avec le scénario simulé actif, puis persiste la commande et le paiement dans **PostgreSQL 16**.
4. Chaque service émet simultanément ses **spans OTLP**, ses **compteurs/histogrammes Prometheus** et ses **logs structurés JSON** enrichis du même `traceId`.

---

## 3. Stack Technologique

| Domaine | Technologies & Versions | Rôle dans l'architecture |
|---|---|---|
| **Backend Microservices** | Node.js 20+, TypeScript, NestJS (Monorepo), Swagger | Exposition des API REST (`gateway`, `orders`, `users`, `payments`) |
| **ORM & Base de Données** | Prisma ORM `7.10.1`, PostgreSQL `16` | Modélisation relationnelle, migrations automatisées (`obs-migrate`) et persistance |
| **Frontend Web** | React `18`, Vite, Tailwind CSS, Lucide Icons, Nginx | Interface de test interactif (`ST01`–`ST05`), visualisation temps réel et comparatif |
| **Tracing Distribué** | OpenTelemetry SDK Node.js, OTel Collector, Jaeger | Génération, propagation W3C et visualisation en cascade des traces |
| **Métriques & Alerting** | Prometheus, cAdvisor / Node Exporter, Grafana | Collecte périodique (`/metrics`), stockage séries temporelles et tableaux de bord |
| **Logging — Pile A** | Elasticsearch, Logstash, Kibana, Filebeat | Ingestion, transformation et exploration des logs JSON (architecture historique) |
| **Logging — Pile B** | OpenSearch, OpenSearch Dashboards | Ingestion et exploration des logs JSON (alternative open-source Apache 2.0) |
| **Conteneurisation & Charge** | Docker, Docker Compose v2, k6 | Déploiement reproductible et génération de charge contrôlée |

---

## 4. Arborescence Complète du Dépôt

```text
plateforme-observabilite/
├── backend/
│   └── orders/                      # Monorepo NestJS principal
│       ├── apps/
│       │   ├── gateway/             # Point d'entrée API (:4000), routage, Swagger (/docs)
│       │   ├── orders/              # Gestion des commandes (:4002) et orchestration
│       │   ├── users/               # Gestion des clients (:4001) persistés en base
│       │   └── payments/            # Traitement des paiements (:4003) et injection d'anomalies
│       ├── libs/
│       │   ├── common/              # Middlewares HTTP, corrélation traceId, appels inter-services
│       │   └── database/            # Service Prisma partagé et connexion PostgreSQL
│       ├── prisma/
│       │   ├── schema.prisma        # Modèles User, Order, Payment
│       │   └── migrations/          # Historique des migrations SQL
│       ├── Dockerfile               # Image multi-stage de production des microservices
│       ├── .env.example             # Modèle de configuration DATABASE_URL
│       └── package.json             # Dépendances NestJS, Prisma, OpenTelemetry
├── frontend/
│   ├── src/
│   │   ├── components/              # Composants UI (scénarios, métriques, traces, comparatif)
│   │   ├── services/                # Client API (`apiClient.js`) connecté à la Gateway
│   │   └── App.jsx                  # Application principale ObservaLab
│   ├── Dockerfile                   # Build Vite + serveur Nginx de production
│   ├── nginx.conf                   # Configuration proxy / routage SPA
│   ├── .env.example                 # URL de l'API Gateway (`VITE_API_URL`)
│   └── package.json                 # Dépendances React, Vite, Tailwind CSS
├── observability/
│   ├── common/                      # OpenTelemetry Collector, Prometheus, Grafana (commun)
│   ├── elk/                         # Stack ELK : Elasticsearch, Logstash, Kibana, Filebeat
│   └── opensearch/                  # Stack OpenSearch : OpenSearch & OpenSearch Dashboards
├── load-tests/
│   └── benchmark.js                 # Script de montée en charge reproductible (k6)
├── scripts/
│   ├── dev-up.sh                    # Lancement automatisé de l'environnement
│   └── dev-down.sh                  # Arrêt propre des conteneurs
├── docs/                            # Documentation technique complémentaire
├── docker-compose.yml               # Orchestration applicative (DB, migrations, 4 services, UI)
├── .env.example                     # Variables d'environnement racine (PostgreSQL)
└── README.md                        # Documentation complète du projet
```

---


## 5. Installation et Démarrage depuis Zéro (Mode Conteneurisé Docker)

Cette procédure permet de déployer l'intégralité de l'application (base de données, migrations, backend, frontend) et les briques d'observabilité en quelques commandes.

### Étape 1 : Cloner le dépôt et préparer les fichiers d'environnement

```bash
git clone [https://github.com/ibrahimasylla-creator/plateforme-observabilite.git](https://github.com/ibrahimasylla-creator/plateforme-observabilite.git)
cd plateforme-observabilite

# Copier les modèles de configuration
cp .env.example .env
cp backend/orders/.env.example backend/orders/.env
cp frontend/.env.example frontend/.env
```

> **Note importante sur les mots de passe :** Vérifiez que les identifiants `POSTGRES_USER`, `POSTGRES_PASSWORD` et `POSTGRES_DB` définis dans `.env` (racine) correspondent exactement à l'URL `DATABASE_URL` dans `backend/orders/.env`.

### Étape 2 : Construire et démarrer la stack applicative

```bash
# Construire les images et démarrer PostgreSQL, les migrations, les 4 microservices et le Frontend
docker compose up -d --build

# Vérifier que tous les conteneurs sont "Up" (et obs-postgres "healthy")
docker compose ps
```

Le conteneur `obs-migrate` exécute automatiquement `npx prisma migrate deploy` dès que `obs-postgres` est prêt, puis s'arrête proprement (`Exited (0)`).

### Étape 3 : Démarrer les stacks d'observabilité

```bash
# 1. Démarrer les briques communes (OpenTelemetry Collector, Jaeger, Prometheus, Grafana)
docker compose -f observability/common/docker-compose.yml up -d

# 2. Démarrer la pile OpenSearch (OpenSearch + OpenSearch Dashboards sur le port 5602)
docker compose -f observability/opensearch/docker-compose.yml up -d

# 3. Démarrer la pile ELK (Elasticsearch + Logstash + Kibana + Filebeat sur le port 5601)
docker compose -f observability/elk/docker-compose.yml up -d
```

*(Vous pouvez également utiliser les scripts utilitaires `./scripts/dev-up.sh` pour démarrer et `./scripts/dev-down.sh` pour tout arrêter proprement.)*

### Étape 4 : Vérifier l'état de santé des services

```bash
curl -s http://localhost:4000/api/health
curl -s http://localhost:4001/health
curl -s http://localhost:4002/health
curl -s http://localhost:4003/health
```

Chaque microservice doit répondre avec un statut HTTP `200 OK` (`{"status":"ok",...}`).

---

## 6. Installation et Démarrage depuis Zéro (Mode Développement Local — Backend & Frontend)

Si vous souhaitez exécuter et déboguer le **Backend NestJS** et le **Frontend React** directement sur votre machine hôte (tout en conservant PostgreSQL et l'observabilité dans Docker) :

### A. Démarrer uniquement PostgreSQL et l'observabilité dans Docker

```bash
cd plateforme-observabilite
docker compose up -d postgres
docker compose -f observability/common/docker-compose.yml up -d
docker compose -f observability/opensearch/docker-compose.yml up -d
```

### B. Initialiser et lancer le Backend (4 microservices NestJS)

Ouvrez **4 terminaux** dans le dossier `backend/orders` et exécutez la préparation initiale une seule fois :

```bash
cd backend/orders
cp .env.example .env
# Assurez-vous que DATABASE_URL pointe vers localhost:5433
npm install
npm run db:generate
npm run db:deploy
```

Puis lancez chaque microservice dans son propre terminal :

```bash
# Terminal 1 : Service Users (Port 4001)
npm run start:dev users

# Terminal 2 : Service Orders (Port 4002)
npm run start:dev orders

# Terminal 3 : Service Payments (Port 4003)
npm run start:dev payments

# Terminal 4 : API Gateway (Port 4000)
npm run start:dev gateway
```

### C. Initialiser et lancer le Frontend (React / Vite)

Dans un **5ème terminal**, depuis le dossier `frontend` :

```bash
cd frontend
cp .env.example .env
# Vérifiez que VITE_API_URL=http://localhost:4000/api
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

L'application est immédiatement accessible sur **`http://localhost:5173`** avec rechargement à chaud (*Hot Module Replacement*).

---

## 7. Cartographie des Services, Ports et Contrats API

| Catégorie | Service | Conteneur Docker | Port Hôte | URL / Endpoint d'accès |
|---|---|---|---|---|
| **Application** | Frontend ObservaLab | `obs-frontend` | `5173` | `- d` |
| **Application** | API Gateway | `obs-gateway` | `4000` | `http://localhost:4000/api/docs` · Swagger : `http://localhost:4000/api/docs` |
| **Application** | Microservice Users | `obs-users` | `4001` | `http://localhost:4001/health` · `/metrics` |
| **Application** | Microservice Orders | `obs-orders` | `4002` | `http://localhost:4002/health` · `/metrics` |
| **Application** | Microservice Payments | `obs-payments` | `4003` | `http://localhost:4003/health` · `/metrics` |
| **Base de données** | PostgreSQL 16 | `obs-postgres` | `5433` | `127.0.0.1:5433` (persisté dans `pgdata`) |
| **Traces (Sujet B)** | Jaeger UI | `jaeger` | `16686` | `http://localhost:16686` |
| **Traces (Sujet B)** | OTel Collector | `otel-collector` | `4317` / `4318` | `grpc://localhost:4317` · `http://localhost:4318` |
| **Métriques (Sujet A)** | Prometheus | `prometheus` | `9095` | `http://localhost:9095` (Targets : `/targets`) |
| **Métriques (Sujet A)** | Grafana | `grafana` | `3000` | `http://localhost:3000` (login : `admin` / `admin`) |
| **Logs (Sujet A)** | OpenSearch Dashboards | `opensearch-dashboards` | `5602` | `http://localhost:5602` (Index : `obs-logs-*`) |
| **Logs (Sujet A)** | Kibana (Suite ELK) | `kibana` | `5601` | `http://localhost:5601` (Index : `obs-logs-*`) |

### Endpoints principaux exposés par l'API Gateway (`http://localhost:4000/api`)
* `GET /api/health` — Vérification de disponibilité de la Gateway.
* `GET /api/users` — Liste des clients enregistrés dans PostgreSQL.
* `POST /api/users` — Création d'un nouveau client réel (`firstName`, `lastName`, `email`).
* `GET /api/orders` — Historique des commandes persistées avec leur `traceId`.
* `POST /api/orders` — Création d'une commande distribuée avec exécution d'un scénario (`ST01` à `ST04`).

---

## 8. Catalogue des Scénarios de Test (`ST01` à `ST05`)

L'interface **ObservaLab** permet d'exécuter cinq scénarios contrôlés sur le backend réel afin d'évaluer la capacité de détection, de corrélation et de diagnostic des outils :

| Code | Nom du Scénario | Comportement Technique | Résultat Attendu (Traces, Logs & Métriques) |
|---|---|---|---|
| **ST01** | **Nominal** | Exécution complète sans anomalie : `Gateway → Orders → Users + Payments → PostgreSQL`. | Statut `HTTP 201`, commande et paiement enregistrés en base, trace W3C complète dans Jaeger et log `INFO` dans ELK/OpenSearch. |
| **ST02** | **Erreur 500** | Injection d'une exception applicative interne au niveau du microservice `payments`. | Statut `HTTP 500`, span marqué `error=true` dans Jaeger, log `ERROR` avec stacktrace isolé instantanément via le `traceId`. |
| **ST03** | **Lenteur (+2s)** | Injection d'un délai artificiel de `2000 ms` dans le traitement du paiement. | Dégradation visible sur la chronologie Jaeger (`> 2.1s`), identification immédiate du span lent et élévation du percentile P95/P99 dans Grafana. |
| **ST04** | **Service coupé** | Simulation d'indisponibilité du service de paiement (`HTTP 503 Service Unavailable`). | Propagation propre de l'erreur `503` jusqu'au client et hausse visible du taux d'erreur dans Prometheus. |
| **ST05** | **Montée en charge** | Génération d'une rafale reproductible de requêtes concurrentes (via l'interface web ou `k6`). | Mesure comparative du débit d'ingestion des logs, de la latence d'indexation et de l'empreinte CPU/RAM entre **ELK** et **OpenSearch**. |

---

## 9. Protocole Comparatif ELK vs OpenSearch

Les deux stacks de centralisation de logs reçoivent exactement le même flux JSON structuré (`timestamp`, `level`, `service`, `traceId`, `spanId`, `message`, `durationMs`, `statusCode`) produit par les conteneurs applicatifs :

1. **Critères techniques évalués :**
   * **Empreinte mémoire (RAM) & CPU :** Consommation au repos et sous charge (`ST05`) mesurée via `docker stats` et Prometheus/cAdvisor.
   * **Latence d'indexation (End-to-End Log Latency) :** Délai entre l'émission du log par NestJS et sa disponibilité dans Kibana (`5601`) vs OpenSearch Dashboards (`5602`).
   * **Simplicité d'architecture et licence :** Complexité de déploiement (pipeline complet Filebeat + Logstash + Elasticsearch + Kibana vs OpenSearch + Dashboards) et modèle de licence open-source (SSPL/Elastic vs Apache 2.0).
2. **Exécution du test de charge reproductible (`k6`) :**
   ```bash
   k6 run load-tests/benchmark.js
   ```

---

## 10. Commandes d'Audit, PostgreSQL et Diagnostic

```bash
# 1. Lister tous les conteneurs actifs et leurs ports
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 2. Vérifier les clients persistés dans PostgreSQL
docker exec -it obs-postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT id, first_name, last_name, email, created_at FROM users;"'

# 3. Vérifier les dernières commandes et paiements persistés avec leur TraceID
docker exec -it obs-postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT id, user_id, total_amount, status, trace_id, created_at FROM orders ORDER BY created_at DESC LIMIT 10;"'

# 4. Vérifier les cibles Prometheus actives
curl -s http://localhost:9095/api/v1/targets | grep -o '"health":"[^"]*"'

# 5. Vérifier les services tracés dans Jaeger
curl -s http://localhost:16686/api/services

# 6. Vérifier les index de logs dans OpenSearch
curl -s http://localhost:9200/_cat/indices/obs-logs-*?v
```

---

## 11. Conformité aux Livrables Attendus

| Livrable du Cahier des Charges | Statut | Emplacement / Référence |
|---|---|---|
| **Code source complet sur GitHub** | Livré | `https://github.com/ibrahimasylla-creator/plateforme-observabilite` (branche `main`) |
| **`README.md` de démarrage depuis zéro** | Livré | Présent fichier à la racine du dépôt |
| **Schéma d'architecture & contrat OpenAPI** | Livré | Section 2 ci-dessus + documentation interactive Swagger sur `http://localhost:4000/docs` |
| **Dockerfiles et fichiers Docker Compose** | Livré | `docker-compose.yml`, `backend/orders/Dockerfile`, `frontend/Dockerfile`, `observability/*` |
| **Scripts de tests de charge** | Livré | `load-tests/benchmark.js` (k6) + rafale intégrée `ST05` dans l'UI |
| **Tableaux de bord d'observabilité** | Livré | Grafana (`:3000`), Jaeger (`:16686`), OpenSearch Dashboards (`:5602`), Kibana (`:5601`) |
| **Rapport technique (15 à 25 pages)** | Livré | Document PDF joint au rendu |
| **Démonstration en direct (15 à 20 min)** | Prêt | Parcours complet `ST01` → `ST05` sur `http://localhost:5173` |