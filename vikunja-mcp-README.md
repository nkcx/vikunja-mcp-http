# Patched aimbitgmbh/vikunja-mcp Source

This subdirectory `vikunja-mcp` should contain the full source from https://github.com/aimbitgmbh/vikunja-mcp
with the following patch applied:

## Patch: Fix /tasks/all endpoint for Vikunja 1.0.0+

In `src/client.ts`, change the endpoint path from `/tasks/all` to `/tasks`.

Vikunja 1.0.0 renamed this endpoint for consistency. Without this fix,
the `tasks_list_all` tool returns:

    Error: Failed to list all tasks: Vikunja API error (400): Invalid model provided: Bad Request

## Setup Instructions

```bash
# From the repo root:
git clone https://github.com/aimbitgmbh/vikunja-mcp.git vikunja-mcp
cd vikunja-mcp

# Apply the fix in src/client.ts:
# Find the line with '/tasks/all' and change it to '/tasks'
# (grep -n "tasks/all" src/client.ts will find it)

# Verify it builds:
npm ci
npm run build
```
