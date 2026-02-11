# Bois & Bocage -- Application de Prospection Commerciale

## Table des matieres

1. [Presentation du projet](#1-presentation-du-projet)
2. [Architecture](#2-architecture)
3. [Demarrage rapide](#3-demarrage-rapide)
4. [Deploiement](#4-deploiement)
5. [Schema de base de donnees](#5-schema-de-base-de-donnees)
6. [Reference des composants](#6-reference-des-composants)
7. [Guide utilisateur](#7-guide-utilisateur)

---

## 1. Presentation du projet

### Ce que fait l'application

Bois & Bocage est un outil de prospection commerciale pour le service Bois & Bocage de Cooperl. Le service propose un diagnostic haies sur 15 ans, l'achat de bois, la vente de credits carbone et la remuneration des eleveurs. L'application presente 200 prospects agriculteurs qualifies, classes par un score de pertinence, avec un suivi de campagne integre.

Les donnees sont issues de 9 tables AS400 consolidees via Dataiku (projet `BOIS_BOCAGE`), exportees en CSV, puis importees dans PostgreSQL.

### Utilisateurs cibles

- **Anne** : prospection telephonique, basee a Nantes. Utilisatrice principale.
- **Equipe commerciale** : consultation des fiches prospects, suivi de progression.
- **Sponsor metier** : Daniel Loretriff (Directeur Achat/Collecte/Efficience Vegetale).

L'objectif annuel est de **40 recrutements** d'agriculteurs.

### Stack technique

| Couche | Technologie | Version |
|--------|-------------|---------|
| Frontend | React + TypeScript | 18.3.1 / 5.6.3 |
| Bundler | Vite | 6.0.3 |
| Styles | Tailwind CSS | 3.4.15 |
| Icones | lucide-react | 0.460.0 |
| Cartographie | Leaflet + react-leaflet | 1.9.4 / 4.2.1 |
| Routage | react-router-dom | 6.28.0 |
| Backend / API | Supabase (PostgREST) | supabase-js 2.49.1 |
| Base de donnees | PostgreSQL (via Supabase) | - |
| Auth | Supabase Auth (proto) / Keycloak (cible DSI) | - |

---

## 2. Architecture

### Vue d'ensemble

```
Anne (navigateur)
    |
    v
Supabase Auth (simule Keycloak SSO)
    |
    v
Frontend React SPA (Vite, Tailwind, Leaflet)
    |
    v
Supabase PostgREST (API REST auto-generee)
    |
    v
PostgreSQL (200 prospects + suivi campagne)
    |
    v
Export CSV si besoin
```

L'application est une SPA (Single Page Application) purement statique. Il n'y a pas de serveur Express, pas de backend custom, pas de Docker. Le frontend communique directement avec PostgreSQL via l'API PostgREST generee automatiquement par Supabase.

### Structure du projet

```
bois-bocage-app/
|-- index.html                  # Point d'entree HTML (charge Leaflet CSS)
|-- package.json                # Dependances et scripts npm
|-- vite.config.ts              # Configuration Vite (plugin React)
|-- tsconfig.json               # Configuration TypeScript (ES2020, strict)
|-- tailwind.config.js          # Tailwind avec palette "cooperl" custom
|-- postcss.config.js           # PostCSS (tailwindcss + autoprefixer)
|-- .env.example                # Template variables d'environnement
|-- .gitignore                  # Exclut node_modules, dist, .env, data/
|-- supabase/
|   `-- schema.sql              # DDL PostgreSQL (tables, index, RLS)
`-- src/
    |-- main.tsx                # Bootstrap React (StrictMode + BrowserRouter)
    |-- App.tsx                 # Routeur principal + garde d'authentification
    |-- index.css               # Tailwind directives + style Leaflet
    |-- vite-env.d.ts           # Types Vite
    |-- types/
    |   `-- index.ts            # Interfaces TypeScript + constantes metier
    |-- lib/
    |   `-- supabase.ts         # Client Supabase (URL + anon key depuis env)
    |-- hooks/
    |   |-- useAuth.ts          # Hook authentification (session, signIn, signOut)
    |   `-- useProspects.ts     # Hook donnees (fetch prospects + actions, CRUD)
    `-- components/
        |-- Login.tsx           # Ecran de connexion (email/password)
        |-- Layout.tsx          # Barre d'en-tete + navigation par onglets
        |-- Dashboard.tsx       # Pipeline : KPIs + tableau + filtres + export CSV
        |-- MapView.tsx         # Carte Leaflet avec marqueurs colores
        |-- ProspectCard.tsx    # Fiche detail prospect + actions + score
        `-- CampaignTracker.tsx # Suivi campagne : jauge objectif + pipeline + historique
```

### Frontend

Le frontend est organise en 3 couches :

- **Types** (`src/types/index.ts`) : interfaces `Prospect`, `Action`, `ProspectWithStatus`, type union `ActionType`, constantes `ACTION_LABELS` et `ACTION_COLORS`, fonction utilitaire `decomposeScore`.
- **Hooks** (`src/hooks/`) : logique metier et acces donnees isoles dans des hooks React custom.
- **Composants** (`src/components/`) : composants d'affichage recevant les donnees en props.

Le routage est gere par `react-router-dom` v6 avec 4 routes :

| Route | Composant | Description |
|-------|-----------|-------------|
| `/` | `Dashboard` | Pipeline prospects (defaut) |
| `/carte` | `MapView` | Vue cartographique |
| `/prospect/:id` | `ProspectCard` | Fiche detail d'un prospect |
| `/suivi` | `CampaignTracker` | Suivi de campagne |
| `*` | Redirect vers `/` | Fallback |

### Backend (Supabase)

Supabase fournit trois services utilises :

1. **PostgreSQL** : stockage des tables `prospects` et `actions`.
2. **PostgREST** : API REST auto-generee depuis le schema PostgreSQL. Le frontend fait des requetes `SELECT`, `INSERT`, `UPDATE` via `@supabase/supabase-js`.
3. **Auth** : authentification email/password. Simule le SSO Keycloak que fournira la DSI en production.

### Flux d'authentification

1. L'utilisateur arrive sur l'app.
2. `useAuth` verifie s'il existe une session Supabase active (`getSession`).
3. Si non authentifie : affichage du composant `Login`.
4. L'utilisateur saisit email + mot de passe.
5. `signInWithPassword` envoie les credentials a Supabase Auth.
6. Supabase retourne un JWT. Le client le stocke en session.
7. Toutes les requetes PostgREST incluent ce JWT dans le header `Authorization`.
8. Les policies RLS autorisent l'acces aux roles `anon` (proto) et `authenticated`.

En cible DSI, Keycloak remplacera Supabase Auth. Le JWT sera emis par Keycloak et les policies RLS seront restreintes au role `authenticated` avec filtrage par role (TC, responsable, admin).

### Flux de donnees

```
CSV Dataiku (bb_prospects_top200.csv)
    |
    v  (import manuel dans Supabase Table Editor)
PostgreSQL table "prospects" (200 lignes)
    |
    v  (PostgREST auto-genere)
useProspects hook (fetch parallele prospects + actions)
    |
    v  (enrichissement : calcul statut depuis derniere action)
ProspectWithStatus[] (prospects avec statut derive)
    |
    v  (props)
Dashboard / MapView / ProspectCard / CampaignTracker
```

---

## 3. Demarrage rapide

### Prerequisites

- **Node.js** 18 ou superieur
- **npm** (inclus avec Node.js)
- Un **compte Supabase** gratuit ([supabase.com](https://supabase.com))

### Etape 1 -- Configurer Supabase

1. Creer un projet sur [supabase.com](https://supabase.com).
2. Dans **SQL Editor**, copier-coller le contenu de `supabase/schema.sql` et executer.
3. Creer un utilisateur dans **Authentication > Users > Add user** (ex: `demo@bois-bocage.fr` / mot de passe au choix).
4. Dans **Table Editor > prospects > Import data**, selectionner le fichier CSV `bb_prospects_top200.csv` (genere depuis Dataiku).
5. Recuperer l'URL du projet et la cle `anon` dans **Settings > API**.

### Etape 2 -- Configurer l'application

```bash
cd /root/projects/coop-prospect/bois-bocage-app
cp .env.example .env
```

Editer `.env` avec les valeurs Supabase :

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Etape 3 -- Installer et lancer

```bash
npm install
npm run dev
```

L'application est accessible sur `http://localhost:5173`.

### Etape 4 -- Build de production

```bash
npm run build
```

Le resultat est dans le dossier `dist/`. C'est un site statique pur (HTML + JS + CSS) deployable sur n'importe quel hebergement statique.

### Scripts npm disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de dev Vite avec hot reload (port 5173) |
| `npm run build` | Build TypeScript + Vite pour production (sortie dans `dist/`) |
| `npm run preview` | Previsualisation du build de production |

---

## 4. Deploiement

### Deploiement actuel -- GitHub Pages

L'app est actuellement deployable en tant que SPA statique sur GitHub Pages :

1. `npm run build` produit un dossier `dist/`.
2. Le contenu de `dist/` est pousse sur la branche `gh-pages` ou deploye via GitHub Actions.
3. Les variables d'environnement `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` doivent etre definies au moment du build (elles sont injectees dans le bundle JS).

### Deploiement cible -- Environnement DSI (21 fevrier 2026)

L'environnement de prototypage DSI (confirme par Aurelien LE BRETON, reunion du 6 fevrier 2026) fournira :

| Composant | Disponibilite | Role |
|-----------|---------------|------|
| **Keycloak** | V1 (21 fev) | SSO entreprise (Google Cooperl). Gestion des roles (TC, responsable, admin). |
| **PostgreSQL** | V1 (21 fev) | Base de donnees. RLS pour filtrer les donnees par utilisateur. |
| **Git** | V1 (21 fev) | Depot de code. Potentiellement deploiement automatique via git push. |
| **Token Exchange** | V2 (mars) | Portier API externes (Claude, Dataiku). Jetons limites par app. |
| **API Gateway** | V2 (mars) | Point d'entree unique. Auth, quotas, logs. |

Ce qui ne sera **pas** disponible : Docker, LLM local (Ollama), n8n, MCP Dataiku.

### Migration Supabase vers DSI

La migration est concue pour etre minimale. Le schema SQL (`supabase/schema.sql`) est du PostgreSQL standard. Les seuls changements sont les variables d'environnement :

| Variable | Supabase (proto) | DSI (cible) |
|----------|-------------------|-------------|
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` | URL PostgREST DSI |
| `VITE_SUPABASE_ANON_KEY` | Cle anon Supabase | Token JWT Keycloak |

Le client `@supabase/supabase-js` est compatible avec tout endpoint PostgREST standard, car PostgREST est le meme composant que Supabase utilise en interne. Si la DSI ne fournit pas PostgREST, deux alternatives :

1. **Remplacer `supabase-js` par `fetch` direct** vers un endpoint API custom (Edge Functions Deno si disponible).
2. **Deployer PostgREST standalone** (binaire statique, pas de Docker requis) devant PostgreSQL.

Pour les policies RLS, le passage en DSI necessite :
- Supprimer les policies `anon` (mode proto).
- Conserver et renforcer les policies `authenticated`.
- Ajouter un filtrage par role Keycloak si necessaire (ex: un TC ne voit que sa zone).

---

## 5. Schema de base de donnees

### Tables

#### `prospects` -- Les 200 agriculteurs qualifies

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | `BIGINT` | PK, auto-increment | Identifiant technique |
| `numero_tiers` | `TEXT` | UNIQUE, NOT NULL | Identifiant metier (AS400) |
| `civilite` | `TEXT` | nullable | M. / Mme / GAEC / EARL / etc. |
| `nom` | `TEXT` | NOT NULL | Nom de l'exploitation |
| `rue` | `TEXT` | nullable | Adresse postale |
| `code_postal` | `TEXT` | nullable | Code postal |
| `ville` | `TEXT` | nullable | Ville |
| `departement` | `TEXT` | nullable | Numero de departement |
| `zone_geographique` | `TEXT` | nullable | Zone commerciale (A-Z) |
| `telephone_domicile` | `TEXT` | nullable | Telephone domicile |
| `telephone_elevage` | `TEXT` | nullable | Telephone elevage |
| `adresse_email` | `TEXT` | nullable | Adresse email |
| `sau_estimee_ha` | `NUMERIC` | nullable | Surface Agricole Utile estimee (hectares) |
| `source_sau` | `TEXT` | nullable | Methode d'estimation : "contrats" ou "tonnages" |
| `sau_contrats_ha` | `NUMERIC` | nullable | SAU via declarations contrats |
| `sau_tonnages_ha` | `NUMERIC` | nullable | SAU via calcul tonnages/rendement |
| `tonnage_total` | `NUMERIC` | nullable | Tonnage cereales livre |
| `certifications` | `TEXT` | nullable | Codes certifications (HVE, Bio, CEC) |
| `latitude` | `NUMERIC` | nullable | Latitude GPS |
| `longitude` | `NUMERIC` | nullable | Longitude GPS |
| `annee_fidelite` | `NUMERIC` | nullable | Anciennete de cooperation (en annees) |
| `score_pertinence` | `INTEGER` | NOT NULL (implicite) | Score de pertinence 0-100 |
| `tc_referent` | `TEXT` | nullable | Technicien commercial referent |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | Date de creation de l'enregistrement |

#### `actions` -- Suivi de campagne

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | `BIGINT` | PK, auto-increment | Identifiant technique |
| `prospect_id` | `BIGINT` | FK -> prospects(id), ON DELETE CASCADE, NOT NULL | Prospect associe |
| `type` | `TEXT` | NOT NULL, CHECK IN ('appele','interesse','refus','rappeler','recrute') | Type d'action |
| `notes` | `TEXT` | nullable | Notes libres |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | Date de l'action |
| `created_by` | `TEXT` | nullable | Email de l'utilisateur ayant cree l'action |

### Index

| Nom | Table | Colonnes | Justification |
|-----|-------|----------|---------------|
| `idx_prospects_score` | prospects | `score_pertinence DESC` | Tri par defaut du Dashboard |
| `idx_prospects_dept` | prospects | `departement` | Filtre par departement |
| `idx_prospects_zone` | prospects | `zone_geographique` | Filtre par zone commerciale |
| `idx_actions_prospect` | actions | `prospect_id` | Jointure prospect -> actions |
| `idx_actions_type` | actions | `type` | Filtrage par type d'action |

### Policies RLS (Row Level Security)

Les deux tables ont RLS active. En mode prototype, les policies sont ouvertes (acces `anon` + `authenticated`).

| Policy | Table | Operation | Role | Condition |
|--------|-------|-----------|------|-----------|
| `prospects_select_anon` | prospects | SELECT | anon | `true` |
| `prospects_select_auth` | prospects | SELECT | authenticated | `true` |
| `prospects_insert_anon` | prospects | INSERT | anon | `true` |
| `prospects_insert_auth` | prospects | INSERT | authenticated | `true` |
| `actions_select_anon` | actions | SELECT | anon | `true` |
| `actions_select_auth` | actions | SELECT | authenticated | `true` |
| `actions_insert_anon` | actions | INSERT | anon | `true` |
| `actions_insert_auth` | actions | INSERT | authenticated | `true` |
| `actions_update_anon` | actions | UPDATE | anon | `true` |
| `actions_update_auth` | actions | UPDATE | authenticated | `true` |

En migration DSI, les policies `anon` seront supprimees et les policies `authenticated` seront renforcees avec des conditions sur les roles Keycloak.

### Scoring de pertinence

Le score est pre-calcule dans Dataiku et importe avec le CSV. La formule est la suivante :

| Critere | Points | Condition |
|---------|--------|-----------|
| SAU > 0 ha | +30 | Filtre primaire (tout prospect a une SAU) |
| SAU > 50 ha | +20 | Grande exploitation |
| Certifie HVE/Bio | +15 | Sensibilite environnementale |
| Tonnage > 100 t | +10 | Exploitation active en collecte |
| Fidelite >= 3 ans | +10 | Engagement durable |

Le score maximum theorique decompose est de 85 points. Le score reel peut etre superieur en raison de criteres supplementaires (activite recente 2024+, etc.) appliques dans le calcul Dataiku.

---

## 6. Reference des composants

### `App.tsx` -- Routeur principal et garde d'authentification

**Fichier** : `/root/projects/coop-prospect/bois-bocage-app/src/App.tsx`

Composant racine. Utilise le hook `useAuth` pour determiner l'etat d'authentification. Si l'utilisateur n'est pas connecte, affiche `Login`. Sinon, rend `AuthenticatedApp` qui contient le `Layout` et les `Routes`.

Sous-composant interne `AuthenticatedApp` :
- Instancie `useProspects` (donnees partagees entre toutes les routes).
- Passe `prospects`, `actions`, `loading`, `addAction` aux composants enfants via props.
- Transmet `onSignOut` et `userEmail` au `Layout`.

---

### `Login.tsx` -- Ecran de connexion

**Fichier** : `/root/projects/coop-prospect/bois-bocage-app/src/components/Login.tsx`

| Prop | Type | Description |
|------|------|-------------|
| `onLogin` | `(email: string, password: string) => Promise<unknown>` | Fonction de connexion (Supabase Auth) |

**Comportement** :
- Formulaire email/password avec validation HTML native (`required`, `type="email"`).
- Appelle `onLogin` au submit. Si erreur, affiche "Email ou mot de passe incorrect".
- Desactive le bouton pendant la soumission (`submitting`).
- Affiche le logo TreePine et le texte "Bois & Bocage -- Prospection commerciale".
- Footer "Prototype -- Environnement DSI simule".

---

### `Layout.tsx` -- Structure de page et navigation

**Fichier** : `/root/projects/coop-prospect/bois-bocage-app/src/components/Layout.tsx`

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Contenu de la page (route active) |
| `onSignOut` | `() => void` | Fonction de deconnexion |
| `userEmail` | `string?` | Email de l'utilisateur connecte |

**Comportement** :
- Barre d'en-tete verte (classe `bg-cooperl-700`) avec logo TreePine, titre "Bois & Bocage", email utilisateur et bouton deconnexion.
- Navigation par onglets avec 3 liens :
  - `/` : Pipeline (icone LayoutDashboard)
  - `/carte` : Carte (icone Map)
  - `/suivi` : Suivi (icone BarChart3)
- L'onglet actif est souligne en vert (`border-cooperl-600`).
- Le contenu est rendu dans un `<main>` centre avec largeur max 7xl.

---

### `Dashboard.tsx` -- Pipeline de prospection

**Fichier** : `/root/projects/coop-prospect/bois-bocage-app/src/components/Dashboard.tsx`

| Prop | Type | Description |
|------|------|-------------|
| `prospects` | `ProspectWithStatus[]` | Liste des prospects enrichis |
| `loading` | `boolean` | Etat de chargement |

**Comportement** :

*KPIs (4 cartes)* :
- Nombre de prospects filtres.
- SAU totale (somme des `sau_estimee_ha` des prospects filtres).
- Pourcentage de certifies (ont un champ `certifications` non vide et different de "0").
- Score moyen de pertinence.

*Filtres* :
- Recherche texte (nom ou numero_tiers).
- Departement (dropdown peuple dynamiquement).
- Zone geographique (dropdown peuple dynamiquement).
- Checkbox "Certifies" (filtre les prospects certifies).
- Score minimum (0, 50+, 60+, 70+, 80+).
- Bouton export CSV.

*Tableau* :
- Colonnes : Exploitation, Ville, Dept, Zone, SAU (ha), Score, Statut.
- Colonnes triables : Exploitation (nom), Dept, Zone, SAU, Score.
- Clic sur une ligne : navigation vers `/prospect/:id`.
- Badge de score colore : vert >= 70, orange >= 50, rouge < 50.
- Badge de statut colore selon le type d'action.

*Export CSV* :
- Exporte les prospects filtres actuellement affiches.
- Colonnes exportees : numero_tiers, nom, ville, departement, zone, sau_ha, score, statut, telephone.
- Telecharge un fichier `prospects_bois_bocage.csv`.

---

### `MapView.tsx` -- Vue cartographique

**Fichier** : `/root/projects/coop-prospect/bois-bocage-app/src/components/MapView.tsx`

| Prop | Type | Description |
|------|------|-------------|
| `prospects` | `ProspectWithStatus[]` | Liste des prospects enrichis |
| `loading` | `boolean` | Etat de chargement |

**Comportement** :
- Affiche le nombre de prospects geolocalises (ceux qui ont latitude et longitude non nulles).
- Legende de couleurs : vert (70+), orange (50-69), rouge (< 50).
- Carte Leaflet centree sur la Bretagne (lat 48.1, lng -2.8, zoom 7).
- Tiles OpenStreetMap.
- Marqueurs : cercles colores de 12px selon le score de pertinence.
- Popup au clic sur un marqueur : nom, ville, departement, SAU, score, telephones, lien "Voir la fiche".
- Hauteur de la carte : `calc(100vh - 200px)` (plein ecran moins header/nav).

---

### `ProspectCard.tsx` -- Fiche detail d'un prospect

**Fichier** : `/root/projects/coop-prospect/bois-bocage-app/src/components/ProspectCard.tsx`

| Prop | Type | Description |
|------|------|-------------|
| `prospects` | `ProspectWithStatus[]` | Liste complete (recherche par id dans l'URL) |
| `actions` | `Action[]` | Toutes les actions |
| `addAction` | `(prospectId, type, notes?) => Promise` | Fonction d'ajout d'action |

**Comportement** :

*En-tete* :
- Bouton retour (navigation -1).
- Civilite + nom de l'exploitation.
- Numero de tiers et zone geographique.
- Badge de statut actuel.

*Coordonnees* :
- Adresse complete (rue, code postal, ville, departement).
- Telephones (elevage et domicile) avec liens `tel:` cliquables.
- Email avec lien `mailto:` cliquable.

*Donnees exploitation* :
- SAU estimee (en hectares) avec source d'estimation.
- Tonnage total (en tonnes).
- Certifications (Oui/Non).
- Fidelite (en annees).

*Decomposition du score* :
- Liste des 5 criteres de scoring avec points obtenus et maximum.
- Indicateur visuel (coche verte si critere rempli, cercle gris sinon).
- Total calcule sur 85.
- Message d'ecart si le score reel differe du total decompose.

*Actions* :
- 5 boutons d'action : Appele (bleu), Interesse (orange), Rappeler (violet), Refus (rouge), Recrute (vert).
- Clic sur un bouton = insertion d'une nouvelle action en base via `addAction`.
- Historique : liste chronologique des actions passees avec date, type et notes.

---

### `CampaignTracker.tsx` -- Suivi de campagne

**Fichier** : `/root/projects/coop-prospect/bois-bocage-app/src/components/CampaignTracker.tsx`

| Prop | Type | Description |
|------|------|-------------|
| `prospects` | `ProspectWithStatus[]` | Liste des prospects enrichis |
| `actions` | `Action[]` | Toutes les actions |
| `loading` | `boolean` | Etat de chargement |

**Comportement** :

*Jauge objectif annuel* :
- Objectif fixe a 40 recrutements (constante `OBJECTIF`).
- Barre de progression avec gradient cooperl (vert).
- Affiche "X / 40" et le pourcentage.

*Pipeline par statut* :
- Grille de 6 cartes : Recrute, Interesse, Appele, Rappeler, Refus, En attente.
- Chaque carte affiche le compteur et le badge de statut colore.
- Barre de progression horizontale empilee montrant la repartition proportionnelle.

*Actions recentes* :
- Liste des 20 dernieres actions tous prospects confondus.
- Chaque ligne : badge d'action, nom du prospect, date/heure.
- Clic sur une ligne : navigation vers la fiche du prospect.

---

### Hooks

#### `useAuth.ts`

**Fichier** : `/root/projects/coop-prospect/bois-bocage-app/src/hooks/useAuth.ts`

| Retour | Type | Description |
|--------|------|-------------|
| `user` | `User | null` | Utilisateur Supabase connecte |
| `loading` | `boolean` | `true` pendant la verification de session |
| `signIn` | `(email, password) => Promise<error>` | Connexion email/password |
| `signOut` | `() => Promise<void>` | Deconnexion |

Au montage, verifie la session existante via `getSession()` et souscrit aux changements d'etat d'auth via `onAuthStateChange`.

#### `useProspects.ts`

**Fichier** : `/root/projects/coop-prospect/bois-bocage-app/src/hooks/useProspects.ts`

| Retour | Type | Description |
|--------|------|-------------|
| `prospects` | `ProspectWithStatus[]` | Prospects enrichis avec statut derive |
| `actions` | `Action[]` | Toutes les actions triees par date decroissante |
| `loading` | `boolean` | Etat de chargement |
| `refetch` | `() => Promise<void>` | Recharge toutes les donnees |
| `addAction` | `(prospectId, type, notes?) => Promise<error>` | Ajoute une action et recharge |

Au montage, effectue un `fetchAll` qui :
1. Charge en parallele `prospects` (tries par `score_pertinence DESC`) et `actions` (triees par `created_at DESC`).
2. Enrichit chaque prospect avec son `statut` (type de la derniere action, ou `en_attente` s'il n'y a aucune action) et sa `derniere_action`.

---

### Types

**Fichier** : `/root/projects/coop-prospect/bois-bocage-app/src/types/index.ts`

| Export | Nature | Description |
|--------|--------|-------------|
| `Prospect` | interface | 22 champs correspondant aux colonnes de la table `prospects` |
| `ActionType` | type union | `'appele' | 'interesse' | 'refus' | 'rappeler' | 'recrute'` |
| `Action` | interface | 6 champs correspondant aux colonnes de la table `actions` |
| `ProspectWithStatus` | interface | Extends `Prospect` avec `statut` et `derniere_action` |
| `ACTION_LABELS` | Record | Labels francais pour chaque statut (incluant `en_attente`) |
| `ACTION_COLORS` | Record | Classes Tailwind CSS pour chaque statut |
| `ScoreCriterion` | interface | Critere de scoring decompose (label, points, max, met) |
| `decomposeScore` | function | Decompose le score d'un prospect en 5 criteres |

---

## 7. Guide utilisateur

### Connexion

1. Ouvrir l'application dans le navigateur.
2. Saisir l'email et le mot de passe fournis par l'administrateur (ex: `demo@bois-bocage.fr`).
3. Cliquer sur **Se connecter**.
4. En cas d'erreur, verifier les identifiants. Le compte doit avoir ete cree dans Supabase Auth (ou Keycloak en cible DSI).

### Ecran Pipeline (page d'accueil)

C'est la vue principale. Elle affiche la liste des 200 prospects tries par score de pertinence.

**Lire les KPIs** :
- **Prospects** : nombre de prospects affiches (apres filtres).
- **SAU totale** : somme des surfaces agricoles utiles des prospects affiches.
- **Certifies** : pourcentage de prospects ayant une certification HVE, Bio ou CEC.
- **Score moyen** : moyenne des scores de pertinence des prospects affiches.

**Filtrer les prospects** :
- Taper un nom ou un numero de tiers dans la barre de recherche.
- Selectionner un departement dans le menu deroulant.
- Selectionner une zone geographique dans le menu deroulant.
- Cocher "Certifies" pour ne voir que les prospects certifies.
- Selectionner un score minimum (50+, 60+, 70+, 80+).

Les KPIs se mettent a jour automatiquement selon les filtres actifs.

**Trier le tableau** :
- Cliquer sur les en-tetes de colonnes Exploitation, Dept, Zone, SAU ou Score.
- Un premier clic trie en ordre decroissant, un second clic inverse le tri.

**Exporter en CSV** :
- Cliquer sur le bouton vert **CSV** en haut a droite.
- Le fichier `prospects_bois_bocage.csv` est telecharge avec les prospects actuellement filtres.

**Ouvrir une fiche** :
- Cliquer sur n'importe quelle ligne du tableau pour acceder a la fiche detail du prospect.

### Ecran Carte

1. Cliquer sur l'onglet **Carte** dans la navigation.
2. La carte affiche les prospects geolocalises sous forme de marqueurs colores :
   - **Vert** : score >= 70 (prioritaire).
   - **Orange** : score entre 50 et 69.
   - **Rouge** : score < 50.
3. Cliquer sur un marqueur pour ouvrir la popup avec le resume du prospect.
4. Cliquer sur **Voir la fiche** dans la popup pour acceder au detail.
5. Utiliser la molette pour zoomer/dezoomer. Cliquer-glisser pour deplacer la carte.

### Ecran Fiche Prospect

Accessible en cliquant sur un prospect depuis le Pipeline ou la Carte.

**Consulter les informations** :
- Adresse complete, telephones (cliquables pour appeler directement), email.
- Donnees d'exploitation : SAU, tonnage, certifications, anciennete.
- Decomposition du score : chaque critere est liste avec ses points.

**Enregistrer une action** :
- Cliquer sur l'un des 5 boutons d'action :
  - **Appele** : l'agriculteur a ete contacte par telephone.
  - **Interesse** : l'agriculteur a exprime un interet.
  - **Rappeler** : a recontacter ulterieurement.
  - **Refus** : l'agriculteur n'est pas interesse.
  - **Recrute** : l'agriculteur a signe (objectif atteint pour ce prospect).
- L'action est enregistree immediatement en base avec la date et l'heure.
- Le statut du prospect est mis a jour partout dans l'application.

**Consulter l'historique** :
- Sous les boutons d'action, l'historique affiche toutes les actions passees par ordre chronologique inverse.

### Ecran Suivi de campagne

1. Cliquer sur l'onglet **Suivi** dans la navigation.

**Jauge objectif** :
- La barre de progression montre l'avancement vers les 40 recrutements annuels.
- Le compteur affiche "X / 40" et le pourcentage atteint.

**Pipeline** :
- Les 6 cartes montrent la repartition des prospects par statut.
- La barre empilee en bas donne une vue proportionnelle.

**Actions recentes** :
- Les 20 dernieres actions sont listees avec le nom du prospect, le type d'action et la date.
- Cliquer sur une ligne pour acceder a la fiche du prospect concerne.

### Deconnexion

Cliquer sur **Deconnexion** dans la barre d'en-tete (visible sur ecran large) ou sur l'icone de deconnexion (ecran mobile).

---

## Limites de cette version

| Limite | Explication |
|--------|-------------|
| Donnees figees | Import CSV snapshot, pas de lien live vers Dataiku. Rafraichissement par reimport manuel. |
| Scoring pre-calcule | Le score est calcule dans Dataiku, pas de recalcul temps reel dans l'app. |
| Pas de workflow | Les actions sont locales. Pas de notification, pas de declenchement automatique. |
| Mono-service | Application Bois & Bocage uniquement. Pas d'integration avec RSE, GTE-v ou Collecte. |
| Auth prototype | Supabase Auth simule le SSO Keycloak. Pas de roles granulaires. |
| RLS ouverte | En mode proto, `anon` et `authenticated` ont les memes droits. A restreindre en DSI. |

---

## Variables d'environnement

| Variable | Obligatoire | Description |
|----------|-------------|-------------|
| `VITE_SUPABASE_URL` | Oui | URL du projet Supabase (ex: `https://xxxxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Oui | Cle publique anonyme Supabase (commence par `eyJ...`) |

Ces variables sont prefixees `VITE_` pour etre exposees au frontend par Vite. Elles sont injectees dans le bundle au build et sont donc visibles dans le code client. C'est attendu : la cle `anon` est publique et les policies RLS protegent les donnees.
