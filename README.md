# Bois & Bocage — App Prospection

Dataviz prospection pour le service Bois & Bocage (Cooperl).
200 prospects agriculteurs qualifies, scoring pertinence, suivi campagne.

## Stack

| Couche | Technologie |
|--------|-------------|
| Frontend | React 18 + TypeScript + Vite + Tailwind |
| API | PostgREST (auto-genere par Supabase) |
| Base | PostgreSQL + RLS (Row Level Security) |
| Auth | Supabase Auth (proto) / Keycloak (DSI) |
| Carte | Leaflet + OpenStreetMap |

## Demarrage rapide

### 1. Creer un projet Supabase (gratuit)

1. Aller sur [supabase.com](https://supabase.com), creer un compte et un projet
2. Dans **SQL Editor**, copier-coller le contenu de `supabase/schema.sql` et executer
3. Dans **Table Editor** > `prospects` > **Import data** > selectionner `data/bb_prospects_top200.csv`
4. Recuperer l'URL et la cle `anon` dans **Settings > API**

### 2. Configurer l'app

```bash
cp .env.example .env
```

Remplir `.env` :
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
```

### 3. Lancer

```bash
npm install
npm run dev
```

L'app tourne sur `http://localhost:5173`.

## Ecrans

| # | Ecran | Route | Description |
|---|-------|-------|-------------|
| 1 | Pipeline | `/` | KPIs + tableau triable/filtrable + export CSV |
| 2 | Carte | `/carte` | Leaflet avec marqueurs colores par score |
| 3 | Fiche | `/prospect/:id` | Detail prospect + decomposition score + actions |
| 4 | Suivi | `/suivi` | Progression campagne + jauge objectif 40 |

## Migration vers env DSI (21 fevrier)

Le code est identique. Seules les variables d'environnement changent :

| Variable | Supabase (proto) | DSI |
|----------|-------------------|-----|
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` | URL PostgREST DSI |
| `VITE_SUPABASE_ANON_KEY` | Cle anon Supabase | Token Keycloak/JWT DSI |

Le schema SQL (`supabase/schema.sql`) est compatible PostgreSQL standard.

## Donnees

- **Source** : 9 tables Athena (AS400 Cooperl) consolidees par Dataiku (projet BOIS_BOCAGE)
- **200 prospects** avec SAU, geolocalisation, scoring, coordonnees
- **Rafraichissement** : reimport CSV periodique

## Limites de cette version

| Limite | Explication |
|--------|-------------|
| Donnees figees | CSV snapshot, pas de lien live Dataiku |
| Pas de scoring dynamique | Le score est pre-calcule, pas de recalcul temps reel |
| Pas de workflow | Actions locales, pas de notification ni declenchement |
| Mono-service | Bois & Bocage seul, pas d'integration RSE/GTE-v/Collecte |
