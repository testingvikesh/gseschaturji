# gseschaturji

GSES Material (AI) Generator — PHP app for cPanel hosting at **gseschaturji.xyz**.

## Auto deploy (GitHub → live server)

Every push to `main` triggers a deploy via GitHub Actions.

### Option A — cPanel webhook (recommended for cPanel)

1. **cPanel → Git Version Control → Create**
   - Clone URL: `https://github.com/testingvikesh/gseschaturji.git`
   - Repository path: e.g. `/home/USERNAME/repositories/gseschaturji`
2. Open **Manage** → **Pull or Deploy** tab → copy the **Deployment URL**
3. Add GitHub secret:
   - `CPANEL_DEPLOY_URL` = the deployment URL from cPanel
4. Edit `.cpanel.yml` if your site root is not `/home/USERNAME/public_html`
5. Push to `main` — GitHub Actions calls the webhook, cPanel pulls from GitHub and runs `.cpanel.yml`

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
