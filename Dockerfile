FROM node:22-alpine AS builder

# Build the patched aimbitgmbh vikunja-mcp server
# TODO: When aimbitgmbh fixes the /tasks/all endpoint (see upstream issue),
#       switch to installing @aimbitgmbh/vikunja-mcp from npm directly.
WORKDIR /build
COPY vikunja-mcp/ ./
RUN npm ci && npm run build

# --- Runtime stage ---
FROM node:22-alpine

# Install mcp-proxy globally (pinned version for reproducibility)
RUN npm install -g mcp-proxy@6.4.0

# Copy the built MCP server from the builder stage
COPY --from=builder /build /opt/vikunja-mcp

EXPOSE 8080

# mcp-proxy wraps the stdio-based vikunja-mcp server and exposes it over HTTP.
# Endpoints: /mcp (Streamable HTTP), /sse (SSE)
# Auth is handled externally (e.g., Traefik IP allowlist) — see README.
CMD ["mcp-proxy", "--port", "8080", "--host", "0.0.0.0", "--", "node", "/opt/vikunja-mcp/dist/index.js"]
