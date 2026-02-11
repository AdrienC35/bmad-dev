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
-- Acces restreint aux utilisateurs authentifies uniquement
-- ============================================================

ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;

-- Prospects : lecture seule pour authenticated (pas d'insert/update/delete)
CREATE POLICY "prospects_select_auth" ON prospects
  FOR SELECT TO authenticated USING (true);

-- Actions : lecture et insertion pour authenticated
CREATE POLICY "actions_select_auth" ON actions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "actions_insert_auth" ON actions
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.jwt()->>'email');

REVOKE ALL ON prospects FROM anon;
REVOKE ALL ON actions FROM anon;
