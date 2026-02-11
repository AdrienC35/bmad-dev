-- ============================================================
-- Bois & Bocage — Schema PostgreSQL
-- Compatible Supabase (free tier) et PostgreSQL DSI (21 fev)
-- ============================================================

-- Table prospects : les 200 agriculteurs qualifies
CREATE TABLE prospects (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  numero_tiers  TEXT UNIQUE NOT NULL,
  civilite      TEXT,
  nom           TEXT NOT NULL,
  rue           TEXT,
  code_postal   TEXT,
  ville         TEXT,
  departement   TEXT,
  zone_geographique TEXT,
  telephone_domicile TEXT,
  telephone_elevage  TEXT,
  adresse_email TEXT,
  sau_estimee_ha     NUMERIC,
  source_sau         TEXT,
  sau_contrats_ha    NUMERIC,
  sau_tonnages_ha    NUMERIC,
  tonnage_total      NUMERIC,
  certifications     TEXT,
  latitude           NUMERIC,
  longitude          NUMERIC,
  annee_fidelite     NUMERIC,
  score_pertinence   INTEGER,
  tc_referent        TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Table actions : suivi campagne (appele, interesse, refus, recrute)
CREATE TABLE actions (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  prospect_id BIGINT NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('appele', 'interesse', 'refus', 'rappeler', 'recrute')),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  created_by  TEXT
);

-- Index pour les requetes frequentes
CREATE INDEX idx_prospects_score ON prospects(score_pertinence DESC);
CREATE INDEX idx_prospects_dept ON prospects(departement);
CREATE INDEX idx_prospects_zone ON prospects(zone_geographique);
CREATE INDEX idx_actions_prospect ON actions(prospect_id);
CREATE INDEX idx_actions_type ON actions(type);

-- ============================================================
-- Row Level Security (RLS)
-- MODE PROTO : acces ouvert (anon + authenticated)
-- MODE DSI   : remplacer anon par authenticated + roles Keycloak
-- ============================================================

ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;

-- Prospects : lecture pour tous (anon = proto, authenticated = DSI)
CREATE POLICY "prospects_select_anon" ON prospects
  FOR SELECT TO anon USING (true);
CREATE POLICY "prospects_select_auth" ON prospects
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "prospects_insert_anon" ON prospects
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "prospects_insert_auth" ON prospects
  FOR INSERT TO authenticated WITH CHECK (true);

-- Actions : lecture et ecriture pour tous
CREATE POLICY "actions_select_anon" ON actions
  FOR SELECT TO anon USING (true);
CREATE POLICY "actions_select_auth" ON actions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "actions_insert_anon" ON actions
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "actions_insert_auth" ON actions
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "actions_update_anon" ON actions
  FOR UPDATE TO anon USING (true);
CREATE POLICY "actions_update_auth" ON actions
  FOR UPDATE TO authenticated USING (true);
