#!/bin/bash
set -euo pipefail

# init-vikunja-mcp.sh
#
# Clones the aimbitgmbh/vikunja-mcp repo, applies patches for
# Vikunja 1.0.0+ compatibility, and cleans up for embedding in
# the vikunja-mcp-http repo.
#
# Run from the repo root:
#   ./init-vikunja-mcp.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="${SCRIPT_DIR}/vikunja-mcp"
TEMP_DIR="${SCRIPT_DIR}/vikunja-mcp-temp"
UPSTREAM_REPO="https://github.com/aimbitgmbh/vikunja-mcp.git"

# --- Safety check ---
if [ -d "${TARGET_DIR}/src" ]; then
    echo "ERROR: ${TARGET_DIR}/src already exists."
    echo "Remove vikunja-mcp/ contents first if you want to re-initialize:"
    echo "  rm -rf vikunja-mcp/src vikunja-mcp/dist vikunja-mcp/package.json vikunja-mcp/package-lock.json vikunja-mcp/tsconfig.json vikunja-mcp/docs vikunja-mcp/.env.example vikunja-mcp/.gitignore vikunja-mcp/.npmignore vikunja-mcp/LICENSE"
    exit 1
fi

# --- Clone upstream ---
echo "Cloning upstream: ${UPSTREAM_REPO}"
git clone "${UPSTREAM_REPO}" "${TEMP_DIR}"

# --- Remove nested .git (prevents submodule issues) ---
rm -rf "${TEMP_DIR}/.git"

# --- Apply patches ---
echo "Applying patches..."

# Patch 1: /tasks/all -> /tasks (Vikunja 1.0.0+ endpoint rename)
# See: https://github.com/aimbitgmbh/vikunja-mcp/issues/1
TASKS_FILE="${TEMP_DIR}/src/client.ts"
if grep -q '/tasks/all' "${TASKS_FILE}"; then
    sed -i 's|/tasks/all|/tasks|g' "${TASKS_FILE}"
    echo "  Patched /tasks/all -> /tasks in src/client.ts"
else
    echo "  WARNING: /tasks/all not found in src/client.ts — upstream may have already fixed this."
fi

# --- Move files into place ---
echo "Moving files to ${TARGET_DIR}/"

# Preserve the existing README.md in vikunja-mcp/ (our documentation)
mv "${TEMP_DIR}"/* "${TARGET_DIR}/" 2>/dev/null || true
mv "${TEMP_DIR}"/.[!.]* "${TARGET_DIR}/" 2>/dev/null || true

# --- Clean up ---
rm -rf "${TEMP_DIR}"

# --- Verify ---
echo ""
echo "Done. Verify the patch was applied:"
grep -n "'/tasks'" "${TARGET_DIR}/src/client.ts" || echo "  WARNING: Could not verify patch."
echo ""
echo "Next steps:"
echo "  1. git add vikunja-mcp/"
echo "  2. git commit -m 'Add patched aimbitgmbh/vikunja-mcp source'"
echo "  3. git push"
