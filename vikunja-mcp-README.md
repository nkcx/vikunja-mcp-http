# Patched aimbitgmbh/vikunja-mcp Source

The sub-directory `vikunja-mcp' contains the full source from https://github.com/aimbitgmbh/vikunja-mcp
with the following patch applied:

## Patch: Fix /tasks/all endpoint for Vikunja 1.0.0+

In `src/client.ts`, change the endpoint path from `/tasks/all` to `/tasks`.

Vikunja 1.0.0 renamed this endpoint for consistency. Without this fix,
the `tasks_list_all` tool returns:

    Error: Failed to list all tasks: Vikunja API error (400): Invalid model provided: Bad Request

See [upstream issue](https://github.com/aimbitgmbh/vikunja-mcp/issues/1).

## How This Directory Was Created

Run the init script from the repo root:

```bash
./init-vikunja-mcp.sh
```

This clones the upstream repo, removes the nested `.git` directory, applies the sed patch to `src/client.ts`, and moves files into place. See the script for details.
