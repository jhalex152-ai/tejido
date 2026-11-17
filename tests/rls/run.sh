#!/usr/bin/env bash
# Prueba migraciones, semilla, RLS y compuertas en un Postgres temporal.
# Uso: bash tests/rls/run.sh   (requiere binarios de PostgreSQL 14+; corre como postgres si eres root)
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$HERE/../.."
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin | sort -V | tail -1)}"
DATA="${PGDATA_TEST:-/tmp/tejido-pgtest}"; PORT="${PGPORT_TEST:-54329}"
as_pg() { if [ "$(id -u)" = 0 ]; then su postgres -s /bin/bash -c "$*"; else bash -c "$*"; fi; }

rm -rf "$DATA"; mkdir -p "$DATA"; [ "$(id -u)" = 0 ] && chown postgres "$DATA"
as_pg "$PGBIN/initdb -D $DATA -A trust >/dev/null"
as_pg "$PGBIN/pg_ctl -D $DATA -o '-p $PORT -k /tmp' -l $DATA/log -w start >/dev/null"
trap 'as_pg "$PGBIN/pg_ctl -D $DATA -m immediate stop >/dev/null" || true' EXIT
PSQL="psql -h /tmp -p $PORT -U postgres -v ON_ERROR_STOP=1 -q"
as_pg "createdb -h /tmp -p $PORT -U postgres tejido"
run() { cat "$1" | as_pg "$PSQL -d tejido -f -"; }
run "$HERE/stub.sql"
for f in "$ROOT"/supabase/migrations/*.sql; do echo "→ $(basename "$f")"; run "$f"; done
echo "→ seed.sql (dos veces: debe ser idempotente)"; run "$ROOT/supabase/seed.sql" >/dev/null; run "$ROOT/supabase/seed.sql" >/dev/null
echo "→ test.sql"; run "$HERE/test.sql"
