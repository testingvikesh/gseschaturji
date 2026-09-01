# gseschaturji

GSES Material (AI) Generator — PHP app for cPanel hosting at **gseschaturji.xyz**.

## Auto deploy (GitHub → live server)

Every push to `main` triggers a deploy via GitHub Actions.

### Option A — cPanel webhook (recommended for cPanel)

Your repo is in `/home/gsescha/public_html` (same as the live site).

1. **cPanel → Git Version Control → Manage** your repo
2. Click **Update from Remote** (pulls latest code including `.cpanel.yml`)
3. Go to **Pull or Deploy** tab — the blue **Deployment URL** appears once deploy is enabled
4. Copy that URL → GitHub → **Settings → Secrets → Actions** → add `CPANEL_DEPLOY_URL`
5. Click **Deploy HEAD Commit** once to test, then every push to `main` auto-deploys

If you still see **"The system cannot deploy"** and no Deployment URL:

cPanel blocks deploy when git has uncommitted changes. Fix on the server:

1. **cPanel → Terminal** (or SSH)
2. Run:
   ```bash
   cd ~/public_html
   bash scripts/cpanel-fix-git.sh
   ```
3. Refresh **Git Version Control → Pull or Deploy** — Deployment URL should appear
4. Click **Deploy HEAD Commit**

### Option B — SSH/rsync (if webhook is not used)

GitHub Secrets (Settings → Secrets → Actions):

| Secret | Example | Description |
|--------|---------|-------------|
| `SSH_HOST` | `gseschaturji.xyz` | Server hostname (try your WHM hostname if domain fails) |
| `SSH_USER` | `cpanel_username` | cPanel username |
| `SSH_PRIVATE_KEY` | full private key | Must match an **authorized** public key on the server |
| `DEPLOY_PATH` | `/home/USERNAME/public_html` | Absolute site root path |
| `SSH_PORT` | `22` | Optional |

**SSH key checklist:**
- Generate: `ssh-keygen -t ed25519 -f deploy_key -N ""`
- cPanel → **SSH Access** → Import `deploy_key.pub` → click **Authorize**
- GitHub secret `SSH_PRIVATE_KEY` = contents of `deploy_key` (with `BEGIN`/`END` lines)
- Verify fingerprint matches: `ssh-keygen -lf deploy_key.pub`

If `CPANEL_DEPLOY_URL` is set, the workflow uses the webhook and skips SSH.

### Server setup (one time)

```bash
cp config.example.json config.json   # add DB + API keys
mkdir -p public/uploads && chmod 755 public/uploads
```

### What gets deployed

- Project files sync to the live server
- **Not overwritten:** `config.json`, `.env`, `public/uploads/`, `node_modules/`
