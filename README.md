# Plateforme d'observabilité : ELK vs OpenSearch + Prometheus + OpenTelemetry

Projet web avancé (Master 1 SI/SR, UADB), binôme : Ibrahima Sylla / Abdoulaye Dieye.

Ce projet met en place une application distribuée de gestion de commandes, puis la supervise
avec deux architectures d'observabilité comparées dans les mêmes conditions :
logs (ELK ou OpenSearch), métriques (Prometheus + Grafana) et traces distribuées (OpenTelemetry).
Le cahier des charges complet est fourni séparément.

## Architecture applicative

Client / Frontend -> gateway -> orders -> users ou payments (paiement simulé) -> PostgreSQL

Backend : NestJS (monorepo), Prisma 7.10.1, PostgreSQL 16.

## État d'avancement

| Élément | État |
|---|---|
| Base PostgreSQL (Docker Compose) | fait |
| Schéma Prisma (users, orders, payments) + migration | fait |
| Bibliothèque partagée `libs/database` | fait |
| Service `orders` : route /health | fait |
| Services gateway, users, payments | à faire |
| Swagger, validation, format d'erreur unique | à faire |
| Logs JSON, métriques /metrics, traces OpenTelemetry | à faire |
| Piles ELK et OpenSearch, Prometheus, Grafana | à faire |
| Frontend | en cours (autre membre du binôme) |

## Prérequis

- Git
- Node.js 20 ou plus (testé avec 24) et npm
- Docker et Docker Compose

## Démarrage depuis zéro

```bash
# 1. Récupérer le projet
git clone https://github.com/ibrahimasylla-creator/plateforme-observabilite.git
cd plateforme-observabilite
git checkout develop

# 2. Configurer et lancer la base de données
cp .env.example .env
nano .env                      # choisir un mot de passe dans POSTGRES_PASSWORD
docker compose up -d
docker compose ps              # attendre le statut "healthy"

# 3. Configurer le backend
cd backend/orders
cp .env.example .env
nano .env                      # mettre le MÊME mot de passe dans DATABASE_URL

# 4. Installer, générer le client Prisma, créer les tables
npm install
npm run db:generate
npm run db:deploy

# 5. Lancer le service orders
npm run start:dev orders
```

Vérification (dans un autre terminal) :

```bash
curl http://localhost:4002/health
# {"status":"ok","service":"orders","database":"up"}
```

## Configuration : deux fichiers .env distincts

| Fichier | Lu par | Contenu |
|---|---|---|
| `.env` (racine) | Docker Compose | POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, POSTGRES_PORT |
| `backend/orders/.env` | Prisma et NestJS | DATABASE_URL |

Les fichiers `.env` ne sont jamais publiés (voir `.gitignore`). Les modèles `.env.example`
contiennent des valeurs fictives. Le mot de passe doit être identique dans les deux fichiers.
Le dossier `generated/` (client Prisma) n'est pas versionné : il se recrée avec `npm run db:generate`.

## Ports

| Service | Port |
|---|---|
| PostgreSQL (limité à 127.0.0.1) | 5433 |
| gateway | 4000 (prévu) |
| users | 4001 (prévu) |
| orders | 4002 |
| payments | 4003 (prévu) |

## Commandes utiles (dans backend/orders)

| Commande | Rôle |
|---|---|
| `npm run start:dev <service>` | lancer un service (gateway, users, orders, payments) |
| `npm run db:generate` | générer le client Prisma |
| `npm run db:migrate` | créer et appliquer une migration (développement) |
| `npm run db:deploy` | appliquer les migrations existantes |
| `npx prisma studio` | parcourir les données |

## Structure du dépôt

```
backend/orders/   monorepo NestJS (apps/ : gateway, orders, users, payments ; libs/database)
frontend/         interface web
observability/    configurations ELK, OpenSearch et éléments communs (Prometheus, OpenTelemetry)
load-tests/       scripts de génération de charge
docs/             documentation et contrat d'API
```

## Workflow Git

Branches : `main` (stable), `develop` (intégration), `feature/...` (une par tâche).
Les fusions vers `develop` se font par Pull Request.
