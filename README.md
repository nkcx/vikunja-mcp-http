# vikunja-mcp-http

A containerized [Vikunja](https://vikunja.io/) MCP server exposed over HTTP, ready for use with Claude.ai custom integrations or any MCP client that supports Streamable HTTP / SSE transport.

## What This Does

This container packages:

1. **[aimbitgmbh/vikunja-mcp](https://github.com/aimbitgmbh/vikunja-mcp)** — a TypeScript MCP server for Vikunja task management (stdio transport)
2. **[mcp-proxy](https://www.npmjs.com/package/mcp-proxy)** (npm) — a TypeScript bridge that wraps the stdio server and exposes it over Streamable HTTP and SSE

The result is a single container that exposes Vikunja's task management API as a remote MCP server.

## Upstream Patches

The `vikunja-mcp/` directory contains a clone of `aimbitgmbh/vikunja-mcp` with the following patches applied:

- **`/tasks/all` → `/tasks`**: Vikunja 1.0.0+ renamed this endpoint ([changelog](https://vikunja.io/changelog/whats-new-in-vikunja-1.0.0/)). The upstream `tasks_list_all` tool fails with `400: Invalid model provided` without this fix. ([Upstream issue](https://github.com/aimbitgmbh/vikunja-mcp/issues/1))

When upstream merges these fixes, the Dockerfile can be simplified to install `@aimbitgmbh/vikunja-mcp` from npm directly.

## Usage

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VIKUNJA_URL` | Yes | Vikunja API URL, including `/api/v1` (e.g., `https://vikunja.example.com/api/v1`) |
| `VIKUNJA_API_TOKEN` | Yes | API token from Vikunja Settings > API Tokens |
| `VERIFY_SSL` | No | Set to `false` for self-signed certs. Default: `true` |
| `ENABLE_TASK_DELETE` | No | Enable permanent task deletion. Default: `false` |
| `ENABLE_PROJECT_DELETE` | No | Enable permanent project deletion. Default: `false` |
| `ENABLE_LABEL_DELETE` | No | Enable permanent label deletion. Default: `false` |

### Authentication

The MCP server itself runs **authless**. Claude.ai's custom connector only supports OAuth for MCP auth, and implementing a full OAuth 2.1 authorization server is out of scope for this project.

Instead, access is restricted at the reverse proxy layer using **IP allowlisting**. Anthropic publishes stable outbound IP ranges used for MCP tool calls ([docs](https://docs.anthropic.com/en/api/ip-addresses)):

- **IPv4:** `160.79.104.0/21`

The Traefik configuration below restricts access to only Anthropic's IP range, blocking all other traffic. Combined with TLS termination and a non-obvious hostname, this provides reasonable security for personal use.

For production or multi-user deployments, implement the full [MCP OAuth 2.1 authorization spec](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization) instead.

### Docker Run

```bash
docker run -d \
  -p 8080:8080 \
  -e VIKUNJA_URL=https://vikunja.example.com/api/v1 \
  -e VIKUNJA_API_TOKEN=your-token-here \
  ghcr.io/YOURUSER/vikunja-mcp-http:latest
```

### Claude.ai Integration

1. Deploy the container behind Traefik with the IP allowlist middleware (see below).
2. In Claude.ai, go to **Settings → Integrations → Add Custom Integration**.
3. Enter the URL: `https://your-host/mcp` (Streamable HTTP) or `https://your-host/sse` (SSE).

### Docker Compose (with Traefik IP Allowlist)

```yaml
services:
  vikunja-mcp:
    image: ghcr.io/YOURUSER/vikunja-mcp-http:latest
    restart: unless-stopped
    environment:
      - VIKUNJA_URL=https://vikunja.example.com/api/v1
      - VIKUNJA_API_TOKEN=${VIKUNJA_API_TOKEN}
    expose:
      - 8080
    labels:
      - traefik.enable=true
      - traefik.http.routers.vikunja-mcp.rule=Host(`mcp-vikunja.example.com`)
      - traefik.http.routers.vikunja-mcp.entrypoints=websecure
      - traefik.http.routers.vikunja-mcp.tls=true
      - traefik.http.routers.vikunja-mcp.middlewares=mcp-anthropic-only@docker
      - traefik.http.services.vikunja-mcp.loadbalancer.server.port=8080
      # IP allowlist: only Anthropic's outbound MCP range
      - traefik.http.middlewares.mcp-anthropic-only.ipallowlist.sourcerange=160.79.104.0/21
    networks:
      - traefik_proxy

networks:
  traefik_proxy:
    external: true
```

## Initializing / Updating the Upstream Source

The `vikunja-mcp/` directory is a direct copy (not a submodule) of the upstream repo with patches applied. The `init-vikunja-mcp.sh` script handles cloning, patching, and cleanup:

```bash
# First time, or to update to latest upstream:
rm -rf vikunja-mcp/src vikunja-mcp/package.json  # clear old source (keeps README.md)
./init-vikunja-mcp.sh
git add vikunja-mcp/
git commit -m "Update patched aimbitgmbh/vikunja-mcp source"
git push
```

The script will warn you if upstream has already fixed the `/tasks/all` issue, at which point the `vikunja-mcp/` directory can be removed and the Dockerfile simplified to install `@aimbitgmbh/vikunja-mcp` from npm directly.

## License

This repo is MIT licensed. The bundled `vikunja-mcp` server is © [aimbit GmbH](https://aimbit.de), also MIT licensed.
