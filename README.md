# gseschaturji

GSES Material (AI) Generator — PHP app for cPanel hosting at **gseschaturji.xyz**.

## Auto deploy (GitHub → live server)

Every push to `main` triggers a deploy via GitHub Actions.

### Manual deploy in cPanel (works now)

1. **Git Version Control → Manage → Pull or Deploy**
2. Click **Update from Remote**
3. Click **Deploy HEAD Commit**

> **Note:** Many cPanel versions (including yours) do **not** show a "Deployment URL" on this page. That is normal for pull-based GitHub repos. Deploy still works via the button above.

### Option A — cPanel API (recommended for GitHub auto-deploy)

1. **cPanel → Security → Manage API Tokens → Create**
   - Name: `github-deploy`
   - Copy the token (shown once)
2. Add GitHub Secrets (Settings → Secrets → Actions):

| Secret | Value |
|--------|-------|
| `CPANEL_HOST` | `gseschaturji.xyz` (or server hostname) |
| `CPANEL_USER` | `gsescha` |
| `CPANEL_API_TOKEN` | token from step 1 |
| `DEPLOY_PATH` | `/home/gsescha/public_html` |

3. Push to `main` — GitHub Actions pulls + deploys via cPanel API

### Option B — Server cron (no GitHub setup)

cPanel → **Cron Jobs** → every 5 minutes:

```bash
/bin/bash /home/gsescha/public_html/scripts/cpanel-auto-deploy.sh
```

### Option C — SSH/rsync (fallback)

| Secret | Example |
|--------|---------|
| `SSH_HOST` | `gseschaturji.xyz` |
| `SSH_USER` | `gsescha` |
| `SSH_PRIVATE_KEY` | deploy key private key |
| `DEPLOY_PATH` | `/home/gsescha/public_html` |

### Server setup (one time)

```bash
cp config.example.json config.json   # add DB + API keys
mkdir -p public/uploads && chmod 755 public/uploads
```

### What gets deployed

- Project files sync to the live server
- **Not overwritten:** `config.json`, `.env`, `public/uploads/`, `node_modules/`
