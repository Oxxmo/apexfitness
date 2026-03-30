# APEX — Coach IA Personnel
> Application de coaching sportif et nutritionnel avec IA, scan de repas, et suivi de séances.

## Stack Technique
- **Frontend** : HTML/CSS/JS vanilla (fichier unique `index.html`)
- **Backend** : Vercel Serverless Functions (`api/ai-proxy.js`)
- **Base de données** : Supabase (PostgreSQL)
- **IA** : Claude (Anthropic API) via proxy sécurisé
- **Déploiement** : Vercel

---

## 🚀 Installation en 4 étapes

### Étape 1 — Cloner le repo

```bash
git clone https://github.com/TON_USERNAME/apex-coach.git
cd apex-coach
```

### Étape 2 — Configurer Supabase

1. Va sur [supabase.com](https://supabase.com) → Nouveau projet
2. Dans l'éditeur SQL, colle et exécute **tout le contenu** de `supabase-schema.sql`
3. Récupère tes credentials dans **Settings → API** :
   - `Project URL` → ex: `https://xxxxxx.supabase.co`
   - `anon public key` → clé longue commençant par `eyJ...`

### Étape 3 — Mettre à jour `index.html`

Ouvre `index.html` et remplace les deux constantes en haut du script :

```javascript
const SUPABASE_URL = 'https://XXXXXXXX.supabase.co';    // ← ta Project URL
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6...'; // ← ta anon key
```

### Étape 4 — Déployer sur Vercel

**Option A — Via interface Vercel (recommandé)**
1. Push ton code sur GitHub
2. Va sur [vercel.com](https://vercel.com) → Import Project → sélectionne ton repo
3. Dans **Environment Variables**, ajoute :
   - `ANTHROPIC_API_KEY` = `sk-ant-...` (ta clé Anthropic)
4. Clique **Deploy** ✅

**Option B — Via CLI**
```bash
npm i -g vercel
vercel
# Suivre les instructions
vercel env add ANTHROPIC_API_KEY
vercel --prod
```

---

## 📁 Structure du Projet

```
apex-coach/
├── index.html          ← Application complète (frontend)
├── api/
│   └── ai-proxy.js     ← Proxy Anthropic API (sécurisé server-side)
├── vercel.json         ← Config Vercel (timeout 45s pour l'IA)
├── supabase-schema.sql ← Schéma base de données
└── README.md           ← Ce fichier
```

---

## 🗄️ Base de Données Supabase

| Table | Description |
|-------|-------------|
| `profiles` | Profils utilisateurs (pseudo, âge, poids, objectif) |
| `programs` | Programmes hebdomadaires générés par l'IA |
| `session_logs` | Séances complétées avec détail des exercices |
| `meal_scans` | Analyses de repas IA (calories, macros) |
| `chat_history` | Historique du chat avec le coach IA |

> **Note sécurité** : RLS désactivé (auth par pseudo). Pour une version production, activer RLS Supabase avec des policies adaptées.

---

## ✨ Fonctionnalités

- **Profil utilisateur** — Création et connexion par pseudo
- **Programme IA** — Split adapté (2-6 séances/semaine), exercices Basic-Fit
- **Suivi de séance** — Sets/reps/poids, timer de récupération, validation
- **Diète personnalisée** — Macros, règles pratiques, conseils pré/post-séance
- **Scan repas IA** — Photo → calories + macros + score recompo + conseils
- **Coach IA** — Chat contextuel avec historique persistant
- **Historique** — Séances et repas scannés sauvegardés en DB

---

## 🔧 Variables d'environnement

| Variable | Obligatoire | Description |
|----------|-------------|-------------|
| `ANTHROPIC_API_KEY` | ✅ Oui | Clé API Anthropic (server-side, jamais exposée) |

Les credentials Supabase sont dans `index.html` (anon key publique — c'est normal).

---

## 📱 Utilisation

1. Ouvre l'app → entre ton pseudo
2. Si nouveau : complète ton profil (âge, poids, objectif, séances/semaine)
3. Onglet **Semaine** → choisis ton nombre de séances → **Générer**
4. Lance une séance depuis l'accueil ou l'onglet Semaine
5. Pendant la séance : renseigne tes poids/reps, utilise le timer
6. Onglet **Repas** : prends une photo de ton plat → analyse IA instantanée
7. Onglet **Coach** : pose tes questions à tout moment
