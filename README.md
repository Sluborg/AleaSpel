# AleaSpel

Alea is making a mobile game: a gymnastics world with your own avatar, house, gym and minigames.

**Play:** https://sluborg.github.io/AleaSpel/

On the phone, open the link in Chrome and choose "Add to Home screen" to install it as an app.
The installed app updates itself when a new version is deployed.

## Develop

```bash
npm install
npm run dev      # dev server, reachable on the LAN (--host)
npm run build    # typecheck + production build to dist/
npm run lint
npm run format
```

Every push to `main` builds and deploys to GitHub Pages (`.github/workflows/deploy.yml`).
See [CLAUDE.md](CLAUDE.md) for conventions.
