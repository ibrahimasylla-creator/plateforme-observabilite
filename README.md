# Plateforme d'Observabilite Distribuee - ELK vs OpenSearch

> **Projet Web Avance - Master 1 SI / SR (UADB)**
> **Binome :** Ibrahima Sylla & Abdoulaye Dieye

Application microservices de gestion de commandes instrumentee de bout en bout (logs, metriques, traces W3C) comparant **Suite ELK** et **OpenSearch**, couplees a **Prometheus**, **Grafana** et **Jaeger**.

## 1. Architecture

Frontend (:5173) -> Gateway (:4000) -> Orders (:4002) / Users (:4001) / Payments (:4003) -> PostgreSQL (:5433)
- Traces : OTel Collector -> Jaeger (:16686)
- Metriques : Prometheus (:9095) -> Grafana (:3000)
- Logs : Filebeat / Collector -> ELK (:5601) | OpenSearch (:5602)

## 2. Stack Technique & Structure

- **Backend** : Node.js 20+, NestJS Monorepo (`backend/orders/`), Prisma 7.10.1, PostgreSQL 16
- **Frontend** : React 18, Vite, Tailwind CSS (`frontend/`)
- **Observabilite** : `observability/common/`, `observability/elk/`, `observability/opensearch/`
- **Tests & Scripts** : `load-tests/benchmark.js` (k6), `scripts/dev-up.sh`, `scripts/dev-down.sh`

## 3. Demarrage Rapide

```bash
cp .env.example .env && cp backend/orders/.env.example backend/orders/.env
docker compose up -d --build
docker compose -f observability/common/docker-compose.yml up -d
docker compose -f observability/opensearch/docker-compose.yml up -d ```

## 4. Ports & Scenarios (ST01-ST05)

- **UI** : `http://localhost:5173` | **API Gateway** : `http://localhost:4000/api`
- **Jaeger** : `http://localhost:16686` | **Prometheus** : `http://localhost:9095` | **Grafana** : `http://localhost:3000`
- **OpenSearch** : `http://localhost:5602` | **Kibana (ELK)** : `http://localhost:5601`
- **Scenarios** : `ST01` Nominal (201) · `ST02` Erreur 500 · `ST03` Lenteur (+2s) · `ST04` Service coupe (503) · `ST05` Charge k6
