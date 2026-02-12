#!/usr/bin/env node
// ============================================================
// Bois & Bocage — Setup automatique Supabase
// Cree les tables, injecte les donnees de demo, cree l'utilisateur demo
//
// Usage:
//   SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=eyJ... node supabase/setup.mjs
// ============================================================

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Variables requises:')
  console.error('  SUPABASE_URL=https://xxx.supabase.co')
  console.error('  SUPABASE_SERVICE_ROLE_KEY=eyJ...')
  console.error('')
  console.error('Trouvables dans Supabase Dashboard > Settings > API')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const DEMO_EMAIL = 'demo@bois-bocage.fr'
const DEMO_PASSWORD = 'demo-bois-bocage-2024'

async function main() {
  console.log('=== Setup Bois & Bocage ===\n')

  // 1. Creer l'utilisateur demo
  console.log('1. Creation utilisateur demo...')
  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const demoExists = existingUsers?.users?.some(u => u.email === DEMO_EMAIL)

  if (demoExists) {
    console.log('   Utilisateur demo existe deja')
  } else {
    const { error } = await supabase.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true
    })
    if (error) {
      console.error('   Erreur creation user:', error.message)
    } else {
      console.log('   Utilisateur demo cree')
    }
  }

  // 2. Vider les tables
  console.log('\n2. Nettoyage tables...')
  await supabase.from('actions').delete().neq('id', 0)
  await supabase.from('prospects').delete().neq('id', 0)
  console.log('   Tables videes')

  // 3. Charger les prospects depuis seed.sql (parse les VALUES)
  console.log('\n3. Insertion des 200 prospects...')
  const seedSQL = readFileSync(join(__dirname, 'seed.sql'), 'utf8')

  // Parse les prospects depuis le SQL
  const prospects = parseSeedProspects(seedSQL)

  // Insert par batch de 50
  for (let i = 0; i < prospects.length; i += 50) {
    const batch = prospects.slice(i, i + 50)
    const { error } = await supabase.from('prospects').insert(batch)
    if (error) {
      console.error(`   Erreur batch ${i}-${i + batch.length}:`, error.message)
    } else {
      console.log(`   Batch ${i + 1}-${i + batch.length} OK`)
    }
  }

  // 4. Charger les actions
  console.log('\n4. Insertion des actions demo...')
  const actions = parseSeedActions(seedSQL)
  const { error: actError } = await supabase.from('actions').insert(actions)
  if (actError) {
    console.error('   Erreur actions:', actError.message)
  } else {
    console.log(`   ${actions.length} actions inserees`)
  }

  // 5. Verification
  console.log('\n5. Verification...')
  const { count: pCount } = await supabase.from('prospects').select('*', { count: 'exact', head: true })
  const { count: aCount } = await supabase.from('actions').select('*', { count: 'exact', head: true })
  console.log(`   Prospects: ${pCount}`)
  console.log(`   Actions: ${aCount}`)

  console.log('\n=== Setup termine ===')
  console.log(`\nCredentials demo:`)
  console.log(`  Email:    ${DEMO_EMAIL}`)
  console.log(`  Password: ${DEMO_PASSWORD}`)
}

function parseSeedProspects(sql) {
  const prospects = []
  // Match each VALUES row for prospects
  const valuesRegex = /\('(T\d+)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'(\d+)',\s*'([^']*)',\s*(NULL|'[^']*'),\s*'([^']*)',\s*(NULL|'[^']*'),\s*(\d+),\s*'([^']*)',\s*(\d+),\s*(\d+),\s*(\d+),\s*(NULL|'[^']*'),\s*([\d.]+),\s*([\d.-]+),\s*(\d+),\s*(\d+),\s*'([^']*)'\)/g

  let match
  while ((match = valuesRegex.exec(sql)) !== null) {
    prospects.push({
      numero_tiers: match[1],
      civilite: match[2],
      nom: match[3].replace(/''/g, "'"),
      rue: match[4].replace(/''/g, "'"),
      code_postal: match[5],
      ville: match[6],
      departement: match[7],
      zone_geographique: match[8],
      telephone_domicile: match[9] === 'NULL' ? null : match[9].replace(/'/g, ''),
      telephone_elevage: match[10].replace(/'/g, ''),
      adresse_email: match[11] === 'NULL' ? null : match[11].replace(/'/g, ''),
      sau_estimee_ha: parseInt(match[12]),
      source_sau: match[13],
      sau_contrats_ha: parseInt(match[14]),
      sau_tonnages_ha: parseInt(match[15]),
      tonnage_total: parseInt(match[16]),
      certifications: match[17] === 'NULL' ? null : match[17].replace(/'/g, ''),
      latitude: parseFloat(match[18]),
      longitude: parseFloat(match[19]),
      annee_fidelite: parseInt(match[20]),
      score_pertinence: parseInt(match[21]),
      tc_referent: match[22]
    })
  }
  return prospects
}

function parseSeedActions(sql) {
  const actions = []
  // Match the actions INSERT block
  const actionsSection = sql.split('-- Quelques actions de demo')[1]
  if (!actionsSection) return actions

  const actRegex = /\((\d+),\s*'([^']*)',\s*'([^']*)',\s*'([^']*)'\)/g
  let match
  while ((match = actRegex.exec(actionsSection)) !== null) {
    actions.push({
      prospect_id: parseInt(match[1]),
      type: match[2],
      notes: match[3].replace(/''/g, "'"),
      created_by: match[4]
    })
  }
  return actions
}

main().catch(err => {
  console.error('Erreur fatale:', err)
  process.exit(1)
})
