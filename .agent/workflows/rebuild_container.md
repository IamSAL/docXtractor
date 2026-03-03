---
description: How to rebuilt a container without deleting everything
---

If you install a new package on your host machine and it causes errors in Docker (e.g., "Architecture mismatch" or "Module not found" for binary dependencies), you do **NOT** need to delete all images and volumes.

## Option 1: Rebuild just the affected service (Recommended)

This rebuilds the specific container, running `pnpm install` fresh inside the Linux environment.

```bash
docker compose up -d --build <service_name>
```

Example for client:

```bash
docker compose up -d --build client
```

## Option 2: Install dependencies inside the container

If you want to keep the current container running but sync a new dependency:

```bash
docker compose exec <service_name> pnpm install
```

Example:

```bash
docker compose exec client pnpm install socket.io-client
```

## Node.js Services (Client, Server)

Your `docker-compose.yml` is configured to map your host folders directly to the container. This means:

1.  **Run `pnpm install` on your host machine** (e.g., inside `./client` or `./server`).
2.  The container sees the changes immediately because `node_modules` is shared.
3.  **Restart via Docker** only if you get binary errors (e.g., "exec format error" or missing bindings).

## Python Services (Workers)

The worker services (`parser-service`, `extraction-service`) are now configured to **automatically install dependencies on startup**.

1.  **Edit `requirements.txt` on your host machine.**
2.  **Restart the container**:
    ```bash
    docker compose restart parser-service
    # OR
    docker compose restart extraction-service
    ```
3.  The container will see the change, run `pip install`, and then start the application.

**Note:** This makes container startup slightly slower (a few seconds) but ensures you never have to rebuild the image just for dependencies.

## Why was this happening?

Your `client` service previously had a configuration that "hid" the `node_modules` folder from the host. We removed this, so now both Client and Server share the same convenient workflow.

For Python, we added a startup script to the `docker-compose.yml` command that syncs your `requirements.txt` every time the container starts.

> [!WARNING]
> If you encounter errors like `exec format error`, it means a binary package (like `esbuild` or `bcrypt`) was installed for macOS but the container needs the Linux version. In that case, use **Option 1** above.
