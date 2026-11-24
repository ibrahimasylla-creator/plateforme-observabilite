#!/usr/bin/env bash
# Arrête les 4 services lancés par dev-up.sh.
for pidfile in /tmp/obs-logs/*.pid; do
  [ -f "$pidfile" ] || continue
  kill -- -"$(cat "$pidfile")" 2>/dev/null || true
  rm -f "$pidfile"
done
echo "Services arrêtés."
