# gseschaturji

GSES Material (AI) Generator — PHP app for cPanel hosting at **gseschaturji.xyz**.

## Auto deploy (GitHub → live server)

Every push to `main` deploys to the production server via GitHub Actions (rsync over SSH).

### 1. One-time server setup

On the live server (cPanel / SSH):

1. Create the site folder (usually `public_html` or your domain root), e.g. `/home/USERNAME/public_html`
2. Copy secrets config (not in git):
   ```bash
   cp config.example.json config.json
   # Edit config.json with DB credentials and API keys
   ```
3. Ensure `public/uploads` exists and is writable:
   ```bash
   mkdir -p public/uploads && chmod 755 public/uploads
   ```
4. Enable **SSH access** in cPanel (if not already enabled)

### 2. Deploy SSH key

On your computer (or the server):

```bash
ssh-keygen -t ed25519 -C "github-deploy-gseschaturji" -f deploy_key -N ""
```

- Add **`deploy_key.pub`** to the server: cPanel → **SSH Access** → **Manage SSH Keys** → Import → Authorize
- Keep **`deploy_key`** (private key) for GitHub Secrets

### 3. GitHub repository secrets

Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret | Example | Description |
|--------|---------|-------------|
| `SSH_HOST` | `gseschaturji.xyz` | Server hostname or IP |
| `SSH_USER` | `cpanel_username` | cPanel / SSH username |
| `SSH_PRIVATE_KEY` | contents of `deploy_key` | Full private key including `BEGIN` / `END` lines |
| `DEPLOY_PATH` | `/home/USERNAME/public_html` | Absolute path to site root on server |
| `SSH_PORT` | `22` | Optional; omit if using port 22 |

Also create a GitHub **environment** named `production` (Settings → Environments) if you want approval gates before deploy.

### 4. First deploy

Merge the deploy workflow, then either:

- Push to `main`, or
- Actions → **Deploy to live server** → **Run workflow**

### What gets deployed

- All project files are synced with `rsync`
- **Not overwritten on server:** `config.json`, `.env`, `public/uploads/`, `node_modules/`
- After sync, `npm ci --omit=dev` runs on the server if Node.js is available

### Manual deploy on server

If you use git on the server instead:

```bash
cd /home/USERNAME/public_html
git pull origin main
bash scripts/deploy-remote.sh
```
