# Bois & Bocage

Outil de prospection commerciale pour un service bois-bocage en cooperative agricole. Permet de qualifier, contacter et suivre les prospects agricoles pour le diagnostic haies et les credits carbone.

**[Demo live](https://adrienc35.github.io/bmad-dev/)**

> **Note** : Les donnees presentees sont **entierement fictives** (noms, adresses, telephones, emails, exploitations). Aucune donnee reelle n'est exposee.

![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-2.49-3FCF8E?logo=supabase&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss&logoColor=white)

## Compte demo

| | |
|---|---|
| **Email** | `demo@bois-bocage.fr` |
| **Mot de passe** | `demo-bois-bocage-2024` |

## Fonctionnalites

- **Pipeline** — Tableau de 200 prospects tries par score de pertinence, avec filtres (departement, zone, certification, score min) et export CSV
- **Carte** — Visualisation geographique des prospects sur carte Leaflet avec clustering et code couleur par score
- **Fiche prospect** — Detail complet (coordonnees, SAU, tonnage, certifications, decomposition du score) avec boutons d'action (appele, interesse, rappeler, refus, recrute)
- **Suivi campagne** — Jauge objectif annuel (40 recrutements), pipeline par statut, historique des dernieres actions
- **Authentification** — Login securise, protection des donnees par Row Level Security

## Stack

| | |
|---|---|
| **Frontend** | React 18 + TypeScript + Vite |
| **UI** | Tailwind CSS + Lucide icons |
| **Carte** | Leaflet + react-leaflet + clustering |
| **Backend** | Supabase (PostgreSQL + Auth + PostgREST) |
| **Deploy** | GitHub Pages (statique) |

## Demarrage rapide

```bash
# 1. Cloner
git clone https://github.com/AdrienC35/bmad-dev.git
cd bmad-dev

# 2. Installer
npm install

# 3. Configurer
cp .env.example .env
# Remplir VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY

# 4. Initialiser la base de donnees (schema + donnees fictives + user demo)
SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=eyJ... node supabase/setup.mjs

# 5. Lancer
npm run dev
```

L'app tourne sur `http://localhost:5173`.

### Alternative : setup manuel

Si vous preferez initialiser Supabase manuellement :

1. Aller dans **Supabase Dashboard > SQL Editor**
2. Coller et executer `supabase/schema.sql` (creation des tables)
3. Coller et executer `supabase/seed.sql` (200 prospects fictifs)
4. Aller dans **Authentication > Users > Add user** : `demo@bois-bocage.fr` / `demo-bois-bocage-2024`

## Scripts

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de dev avec hot reload |
| `npm run build` | Build de production (TypeScript check + Vite) |
| `npm run preview` | Preview du build local |

## Architecture

```
src/
├── main.tsx                    # Point d'entree
├── App.tsx                     # Routeur + garde auth
├── contexts/
│   └── ProspectsContext.tsx     # State global (prospects + actions)
├── hooks/
│   ├── useAuth.ts              # Authentification
│   └── useProspects.ts         # Donnees + CRUD actions
├── components/
│   ├── Login.tsx               # Ecran de connexion
│   ├── Layout.tsx              # Header + navigation
│   ├── Dashboard.tsx           # Pipeline prospects
│   ├── MapView.tsx             # Carte Leaflet
│   ├── ProspectCard.tsx        # Fiche detail prospect
│   ├── CampaignTracker.tsx     # Suivi campagne
│   └── Limitations.tsx         # Limites du prototype
├── lib/
│   └── supabase.ts             # Client Supabase
└── types/
    └── index.ts                # Types + constantes metier

supabase/
├── schema.sql                  # Schema PostgreSQL (tables + RLS)
├── seed.sql                    # 200 prospects fictifs + actions demo
└── setup.mjs                   # Script d'initialisation automatique
```

## Base de donnees

Deux tables PostgreSQL avec Row Level Security :

```
prospects (200 rows, read-only)     actions (append-only)
├── id                              ├── id
├── numero_tiers (unique)           ├── prospect_id → prospects.id
├── nom, adresse, telephones...     ├── type (appele|interesse|refus|rappeler|recrute)
├── sau_estimee_ha, tonnage...      ├── notes
├── score_pertinence (0-100)        ├── created_at
└── tc_referent                     └── created_by (email JWT)
```

Les donnees injectees par `seed.sql` sont **100% fictives** : noms d'exploitations inventes, adresses generees, numeros de telephone aleatoires. Aucune donnee reelle d'agriculteur n'est presente.

## Variables d'environnement

| Variable | Description | Ou la trouver |
|----------|-------------|---------------|
| `VITE_SUPABASE_URL` | URL du projet Supabase | Dashboard > Settings > API |
| `VITE_SUPABASE_ANON_KEY` | Cle publique Supabase (anon) | Dashboard > Settings > API |

## Licence

MIT
