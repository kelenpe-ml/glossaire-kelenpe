# Glossaire de Drissa

Lexique personnel VitePress — vocabulaire technique (backend, frontend, devops,
transcoding/streaming, édition média) et vocabulaire entrepreneurial/investisseurs
pour Kelenpe (Prodora, Ayena, Kelenpe Ad).

## Développement local

```bash
npm install
npm run docs:dev
```

## Build

```bash
npm run docs:build
npm run docs:preview
```

## Structure

- `docs/business/` — Jargon entrepreneurial & investisseurs
- `docs/backend/` — Backend & architecture
- `docs/frontend/` — Frontend & UI/UX
- `docs/devops/` — DevOps & infra
- `docs/streaming/` — Transcoding & streaming vidéo
- `docs/media/` — Édition média / traitement d'image
- `docs/glossaire.md` — Index alphabétique de tous les termes

## Mise à jour

Ce glossaire est vivant : chaque nouveau terme rencontré est ajouté à la bonne
section, avec définition simple, contexte concret (souvent tiré d'un projet
Kelenpe), termes liés, et formule si un calcul est impliqué.

## Déploiement (Vercel)

Le site est statique (VitePress) mais n'est pas un framework auto-détecté par
Vercel — configurer manuellement dans **Project Settings → Build & Development
Settings** :

- **Framework Preset** : Other
- **Build Command** : `npm run docs:build`
- **Output Directory** : `docs/.vitepress/dist`
- **Install Command** : `npm install` (défaut)

### Protection par mot de passe (gratuite)

Le site est protégé par un `middleware.ts` (Vercel Routing Middleware) qui
demande une authentification HTTP Basic (login/mot de passe) sur toutes les
routes — alternative gratuite à la Password Protection payante de Vercel
(150$/mois, plan Pro).

Dans **Project Settings → Environment Variables**, ajouter :

- `BASIC_AUTH_USER` — le nom d'utilisateur
- `BASIC_AUTH_PASSWORD` — le mot de passe

Sans ces deux variables configurées, le middleware bloque l'accès à tout le
site par sécurité (fail-closed). Penser à désactiver **Vercel Authentication**
dans Deployment Protection si elle était activée, pour ne pas cumuler les deux
protections.
