import { useState, useMemo } from 'react'
import { FileText, Send, Check, Eye, X, ChevronRight } from 'lucide-react'
import type { Action, ActionType, ProspectWithStatus } from '../types'
import { ACTION_LABELS, ACTION_COLORS } from '../types'

interface Props {
  prospect: ProspectWithStatus
  actions: Action[]
  onSendDoc: (type: ActionType, notes: string) => Promise<void>
  disabled: boolean
}

const DOC_SENSIBILISATION_TAG = '[DOC] Plaquette de sensibilisation'
const DOC_ENGAGEMENT_TAG = '[DOC] Dossier d\'engagement'

const STEPS = [
  { key: 'contact', label: 'Prise de contact', statuts: ['appele', 'interesse', 'rappeler', 'recrute'] as string[] },
  { key: 'sensibilisation', label: 'Plaquette envoyee', tag: DOC_SENSIBILISATION_TAG },
  { key: 'interet', label: 'Interet confirme', statuts: ['interesse', 'recrute'] as string[] },
  { key: 'engagement', label: 'Dossier envoye', tag: DOC_ENGAGEMENT_TAG },
  { key: 'recrute', label: 'Recrutement', statuts: ['recrute'] as string[] },
]

export default function SalesJourney({ prospect, actions, onSendDoc, disabled }: Props) {
  const [showDoc, setShowDoc] = useState<'sensibilisation' | 'engagement' | null>(null)
  const [sending, setSending] = useState(false)

  const prospectActions = useMemo(
    () => actions.filter(a => a.prospect_id === prospect.id),
    [actions, prospect.id]
  )

  const hasSensibilisation = prospectActions.some(a => a.notes?.includes(DOC_SENSIBILISATION_TAG))
  const hasEngagement = prospectActions.some(a => a.notes?.includes(DOC_ENGAGEMENT_TAG))

  const stepStatus = useMemo(() => {
    return STEPS.map(step => {
      if (step.tag) {
        return prospectActions.some(a => a.notes?.includes(step.tag!))
      }
      if (step.statuts) {
        return step.statuts.includes(prospect.statut)
      }
      return false
    })
  }, [prospect.statut, prospectActions])

  const activeStep = stepStatus.lastIndexOf(true)

  async function handleSendDoc(docType: 'sensibilisation' | 'engagement') {
    setSending(true)
    if (docType === 'sensibilisation') {
      await onSendDoc('appele', `${DOC_SENSIBILISATION_TAG} envoyee par email`)
    } else {
      await onSendDoc('interesse', `${DOC_ENGAGEMENT_TAG} envoye par email`)
    }
    setSending(false)
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow p-5 space-y-4">
        <h3 className="font-semibold">Parcours commercial</h3>

        {/* Progress bar */}
        <div className="flex items-center gap-1">
          {STEPS.map((step, i) => (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 ${
                stepStatus[i] ? 'bg-cooperl-600 text-white' : i === activeStep + 1 ? 'bg-cooperl-100 text-cooperl-700 ring-2 ring-cooperl-300' : 'bg-gray-100 text-gray-400'
              }`}>
                {stepStatus[i] ? <Check size={14} /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 ${i <= activeStep ? 'bg-cooperl-400' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-gray-500 px-0.5">
          {STEPS.map(s => <span key={s.key} className="text-center w-14">{s.label}</span>)}
        </div>

        {/* Document cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
          {/* Plaquette sensibilisation */}
          <div className={`border rounded-lg p-4 space-y-3 ${hasSensibilisation ? 'border-cooperl-200 bg-cooperl-50/30' : 'border-gray-200'}`}>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${hasSensibilisation ? 'bg-cooperl-100' : 'bg-gray-100'}`}>
                <FileText size={20} className={hasSensibilisation ? 'text-cooperl-600' : 'text-gray-400'} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">Plaquette de sensibilisation</div>
                <div className="text-xs text-gray-500 mt-0.5">Programme Bois & Bocage, credits carbone, remuneration</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDoc('sensibilisation')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Eye size={12} /> Voir
              </button>
              {hasSensibilisation ? (
                <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-cooperl-700 bg-cooperl-100 rounded-lg">
                  <Check size={12} /> Envoyee
                </span>
              ) : (
                <button
                  disabled={disabled || sending}
                  onClick={() => handleSendDoc('sensibilisation')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-cooperl-600 text-white rounded-lg hover:bg-cooperl-700 transition-colors disabled:opacity-50"
                >
                  <Send size={12} /> Envoyer par email
                </button>
              )}
            </div>
          </div>

          {/* Dossier engagement */}
          <div className={`border rounded-lg p-4 space-y-3 ${hasEngagement ? 'border-cooperl-200 bg-cooperl-50/30' : 'border-gray-200'}`}>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${hasEngagement ? 'bg-cooperl-100' : 'bg-gray-100'}`}>
                <FileText size={20} className={hasEngagement ? 'text-cooperl-600' : 'text-gray-400'} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">Dossier d'engagement</div>
                <div className="text-xs text-gray-500 mt-0.5">Conditions contractuelles, diagnostic 15 ans, obligations</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDoc('engagement')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Eye size={12} /> Voir
              </button>
              {hasEngagement ? (
                <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-cooperl-700 bg-cooperl-100 rounded-lg">
                  <Check size={12} /> Envoye
                </span>
              ) : (
                <button
                  disabled={disabled || sending}
                  onClick={() => handleSendDoc('engagement')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-cooperl-600 text-white rounded-lg hover:bg-cooperl-700 transition-colors disabled:opacity-50"
                >
                  <Send size={12} /> Envoyer par email
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Document viewer modal */}
      {showDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">
                {showDoc === 'sensibilisation' ? 'Plaquette de sensibilisation' : 'Dossier d\'engagement'}
              </h3>
              <button onClick={() => setShowDoc(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-sm text-gray-700">
              {showDoc === 'sensibilisation' ? <DocSensibilisation nom={prospect.nom} /> : <DocEngagement nom={prospect.nom} />}
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button onClick={() => setShowDoc(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">
                Fermer
              </button>
              {((showDoc === 'sensibilisation' && !hasSensibilisation) || (showDoc === 'engagement' && !hasEngagement)) && (
                <button
                  disabled={disabled || sending}
                  onClick={() => { handleSendDoc(showDoc); setShowDoc(null) }}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-cooperl-600 text-white rounded-lg hover:bg-cooperl-700 disabled:opacity-50"
                >
                  <Send size={14} /> Envoyer a {prospect.nom}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function DocSensibilisation({ nom }: { nom: string }) {
  return (
    <>
      <div className="text-center space-y-2 pb-4 border-b">
        <div className="text-xs text-gray-400 uppercase tracking-wider">Document de sensibilisation</div>
        <h2 className="text-xl font-bold text-cooperl-800">Programme Bois & Bocage</h2>
        <p className="text-gray-500">Valorisez vos haies, generez des credits carbone</p>
      </div>
      <div className="space-y-4">
        <Section title="Le programme en bref">
          <p>Le programme Bois & Bocage accompagne les exploitants agricoles dans la gestion durable de leurs haies bocageres. En vous engageant sur un diagnostic de 15 ans, vous beneficiez d'un accompagnement technique et d'une remuneration via les credits carbone.</p>
        </Section>
        <Section title="Vos avantages">
          <ul className="list-disc pl-4 space-y-1">
            <li><strong>Remuneration</strong> — Vente de credits carbone issus de la sequestration par vos haies</li>
            <li><strong>Accompagnement technique</strong> — Diagnostic initial et suivi annuel par un technicien specialise</li>
            <li><strong>Valorisation du bois</strong> — Achat garanti du bois issu de l'entretien des haies</li>
            <li><strong>Certification</strong> — Label reconnu pour vos demarches environnementales (HVE, Bio)</li>
          </ul>
        </Section>
        <Section title="Comment ca marche ?">
          <div className="space-y-2">
            <Step n={1} text="Diagnostic initial de vos haies par un technicien (gratuit)" />
            <Step n={2} text="Plan de gestion sur 15 ans adapte a votre exploitation" />
            <Step n={3} text="Entretien annuel selon le plan — le bois est rachete" />
            <Step n={4} text="Credits carbone generes et vendus chaque annee" />
            <Step n={5} text="Remuneration directe sur votre compte" />
          </div>
        </Section>
        <Section title="Chiffres cles">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-cooperl-50 rounded-lg p-3">
              <div className="text-lg font-bold text-cooperl-700">150-400</div>
              <div className="text-xs text-gray-500">euros/km/an</div>
            </div>
            <div className="bg-cooperl-50 rounded-lg p-3">
              <div className="text-lg font-bold text-cooperl-700">15 ans</div>
              <div className="text-xs text-gray-500">duree engagement</div>
            </div>
            <div className="bg-cooperl-50 rounded-lg p-3">
              <div className="text-lg font-bold text-cooperl-700">0</div>
              <div className="text-xs text-gray-500">euros de frais</div>
            </div>
          </div>
        </Section>
      </div>
      <div className="text-center text-xs text-gray-400 pt-4 border-t">
        Document a destination de {nom} — Programme Bois & Bocage
      </div>
    </>
  )
}

function DocEngagement({ nom }: { nom: string }) {
  return (
    <>
      <div className="text-center space-y-2 pb-4 border-b">
        <div className="text-xs text-gray-400 uppercase tracking-wider">Dossier d'engagement</div>
        <h2 className="text-xl font-bold text-cooperl-800">Conditions contractuelles</h2>
        <p className="text-gray-500">Diagnostic haies et credits carbone — 15 ans</p>
      </div>
      <div className="space-y-4">
        <Section title="Objet du contrat">
          <p>Le present dossier formalise l'engagement de l'exploitant dans le programme Bois & Bocage pour une duree de 15 ans. Il couvre le diagnostic des haies, le plan de gestion, l'entretien, le rachat du bois et la commercialisation des credits carbone.</p>
        </Section>
        <Section title="Engagements de l'exploitant">
          <ul className="list-disc pl-4 space-y-1">
            <li>Maintenir les haies existantes sur la duree du contrat</li>
            <li>Realiser l'entretien selon le plan de gestion valide</li>
            <li>Autoriser l'acces au technicien pour le suivi annuel</li>
            <li>Ne pas arracher de haies sans accord prealable</li>
            <li>Fournir les informations necessaires au calcul des credits carbone</li>
          </ul>
        </Section>
        <Section title="Engagements du programme">
          <ul className="list-disc pl-4 space-y-1">
            <li>Realiser le diagnostic initial dans les 3 mois suivant la signature</li>
            <li>Fournir un plan de gestion personnalise</li>
            <li>Racheter le bois d'entretien au prix convenu</li>
            <li>Commercialiser les credits carbone et reverser la part exploitant</li>
            <li>Assurer un suivi technique annuel</li>
          </ul>
        </Section>
        <Section title="Remuneration">
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between">
              <span>Credits carbone (part exploitant)</span>
              <span className="font-semibold">70%</span>
            </div>
            <div className="flex justify-between">
              <span>Rachat bois d'oeuvre</span>
              <span className="font-semibold">Prix marche</span>
            </div>
            <div className="flex justify-between">
              <span>Rachat bois energie</span>
              <span className="font-semibold">45 euros/tonne</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-semibold text-cooperl-700">
              <span>Estimation annuelle</span>
              <span>150 - 400 euros/km</span>
            </div>
          </div>
        </Section>
        <Section title="Resiliation">
          <p>Le contrat peut etre resilie par l'une ou l'autre des parties avec un preavis de 12 mois. En cas de resiliation anticipee par l'exploitant, les credits carbone deja emis restent acquis. Aucune penalite financiere n'est appliquee.</p>
        </Section>
      </div>
      <div className="text-center text-xs text-gray-400 pt-4 border-t">
        Dossier d'engagement a destination de {nom} — Programme Bois & Bocage
      </div>
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
        <ChevronRight size={14} className="text-cooperl-500" />
        {title}
      </h4>
      <div className="pl-5">{children}</div>
    </div>
  )
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cooperl-100 text-cooperl-700 text-xs font-bold shrink-0">{n}</span>
      <span>{text}</span>
    </div>
  )
}
