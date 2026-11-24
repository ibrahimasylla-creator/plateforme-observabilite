#!/usr/bin/env bash
# Lance les 4 services du backend en arrière-plan (logs dans /tmp/obs-logs/).
set -e
cd "$(dirname "$0")/../backend/orders"
mkdir -p /tmp/obs-logs
for svc in users payments orders gateway; do
  setsid npm run start:dev "$svc" > "/tmp/obs-logs/$svc.log" 2>&1 &
  echo $! > "/tmp/obs-logs/$svc.pid"
done
echo "Démarrage en cours (compter 20 à 60 s). Attente des services..."
for port in 4001 4003 4002 4000; do
  ok=0
  for _ in $(seq 1 90); do
    if curl -s -o /dev/null "http://localhost:$port/api/docs-json"; then
      ok=1
      break
    fi
    sleep 1
  done
  if [ "$ok" = 1 ]; then
    echo "  port $port : prêt"
  else
    echo "  port $port : NE RÉPOND PAS (voir /tmp/obs-logs/)"
  fi
done
echo "Terminé. Logs : /tmp/obs-logs/<service>.log"
