# Contrat d'API (v0.1) : point d'entrée unique, la gateway

Base URL : http://localhost:4000/api/v1
Swagger  : http://localhost:4000/api/docs
Format   : JSON, identifiants en UUID, dates en ISO 8601, montants en nombres

## Routes

| Méthode | Route | Rôle |
|---|---|---|
| GET | /health | état de la gateway |
| POST | /users | créer un utilisateur de test {name, email} |
| GET | /users | lister les utilisateurs |
| GET | /users/:id | détail d'un utilisateur |
| POST | /orders | créer une commande {userId, label, amount} |
| GET | /orders | lister (filtres ?userId=&status=) |
| GET | /orders/:id | état d'une commande (avec son paiement) |
| POST | /simulate/error | provoque une erreur 500 contrôlée |
| GET | /simulate/delay?ms=1500 | répond après un délai artificiel |

## Statut d'une commande
PENDING, puis PAID ou FAILED.

## En-têtes
- Toute réponse contient X-Trace-Id.
- Le front peut envoyer traceparent et tracestate (W3C Trace Context).
- CORS : l'origine du front est configurable côté backend (variable CORS_ORIGINS).

## Format d'erreur
{ "statusCode": 404, "message": "Order not found", "error": "Not Found", "traceId": "...", "timestamp": "..." }

## Remarques
- Pas d'authentification dans l'application : "consulter ou créer un utilisateur de test" suffit.
- Ce contrat est une v0.1 : toute modification se discute en Pull Request.
