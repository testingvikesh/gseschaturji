# gseschaturji

Static site for [gseschaturji.xyz](https://gseschaturji.xyz), deployed with GitHub Pages from this repository.

## Connect the domain to GitHub

After GitHub Pages is enabled (Settings → Pages → Source: **GitHub Actions**), add these DNS records at your domain registrar for `gseschaturji.xyz`:

| Type | Host | Value |
|------|------|-------|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `testingvikesh.github.io` |

Then in the GitHub repo go to **Settings → Pages → Custom domain**, enter `gseschaturji.xyz`, and save. GitHub will verify DNS and enable HTTPS.

The `CNAME` file in this repo tells GitHub Pages which domain to serve.
