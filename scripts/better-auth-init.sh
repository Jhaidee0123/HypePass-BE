#!/usr/bin/env bash
#
# Initialize Better Auth tables in the HypePass Postgres.
# Prefers a local `psql`. Falls back to `docker exec` against a running
# container (env BA_DOCKER_CONTAINER, defaults to "postgresdb") so macOS
# dev boxes without a local Postgres client still work.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_FILE="${SCRIPT_DIR}/better-auth-init.sql"

# Load .env if present
ENV_FILE="${SCRIPT_DIR}/../.env"
if [[ -f "${ENV_FILE}" ]]; then
    # Only export DB_* keys to avoid tripping on values with spaces/<>.
    while IFS='=' read -r key value; do
        [[ "${key}" =~ ^DB_ ]] && export "${key}"="${value}"
    done < <(grep -E '^DB_[A-Z_]+=' "${ENV_FILE}" || true)
fi

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USERNAME="${DB_USERNAME:-admin}"
DB_PASSWORD="${DB_PASSWORD:-admin}"
DB_NAME="${DB_NAME:-HypePassDB}"
BA_DOCKER_CONTAINER="${BA_DOCKER_CONTAINER:-postgresdb}"

echo "→ Better Auth schema init on ${DB_NAME} @ ${DB_HOST}:${DB_PORT}"

if command -v psql >/dev/null 2>&1; then
    PGPASSWORD="${DB_PASSWORD}" psql \
        -h "${DB_HOST}" -p "${DB_PORT}" \
        -U "${DB_USERNAME}" -d "${DB_NAME}" \
        -f "${SQL_FILE}"
elif command -v docker >/dev/null 2>&1 \
     && docker ps --format '{{.Names}}' | grep -q "^${BA_DOCKER_CONTAINER}$"; then
    echo "  (using docker exec ${BA_DOCKER_CONTAINER})"
    docker exec -i \
        -e PGPASSWORD="${DB_PASSWORD}" \
        "${BA_DOCKER_CONTAINER}" \
        psql -h localhost -U "${DB_USERNAME}" -d "${DB_NAME}" \
        < "${SQL_FILE}"
else
    echo "✗ Neither local psql nor a running Docker container named '${BA_DOCKER_CONTAINER}' found." >&2
    echo "  Install psql (brew install libpq) or set BA_DOCKER_CONTAINER." >&2
    exit 1
fi

echo "✓ Better Auth schema ready."
