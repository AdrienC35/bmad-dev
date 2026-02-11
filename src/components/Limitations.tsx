import { AlertTriangle, Mail, FileText, Upload, Bell, Users, RefreshCw, Database } from 'lucide-react'

const limitations = [
  {
    icon: Mail,
    title: 'Rappels et relances automatiques',
    description:
      "Envoyer un email automatique quand un prospect n'a pas ete contacte depuis 15 jours, ou envoyer un bilan hebdomadaire a l'equipe.",
    impact: "L'equipe doit verifier manuellement qui n'a pas ete relance.",
  },
  {
    icon: FileText,
    title: 'Fiches prospect en PDF',
    description:
      "Generer une fiche imprimable avec toutes les infos d'un prospect pour un rendez-vous terrain.",
    impact: 'Il faut faire un copier-coller manuel ou une capture ecran.',
  },
  {
    icon: Upload,
    title: 'Import et mise a jour des donnees',
    description:
      'Importer un fichier Excel pour mettre a jour les prospects en masse (nouvelles SAU, nouveaux adherents, changements de TC).',
    impact: 'Les mises a jour doivent etre faites une par une dans la base de donnees.',
  },
  {
    icon: Bell,
    title: 'Notifications entre collegues',
    description:
      "Etre prevenu quand un collegue a mis a jour un prospect ou quand un prospect passe au statut \"interesse\".",
    impact: "Il faut ouvrir l'application pour voir les changements.",
  },
  {
    icon: Users,
    title: "Droits d'acces par profil",
    description:
      'Un technicien ne voit que ses prospects, un responsable voit toute sa zone, la direction voit tout et peut exporter.',
    impact: "Aujourd'hui tout le monde voit tout — pas de cloisonnement.",
  },
  {
    icon: RefreshCw,
    title: 'Synchronisation automatique avec le SI Cooperl',
    description:
      "Recuperer automatiquement les donnees a jour depuis le systeme d'information (adherents, tonnages, certifications, SAU).",
    impact: 'Les donnees sont figees au moment du chargement initial.',
  },
  {
    icon: Database,
    title: 'Historique et statistiques avancees',
    description:
      "Generer des rapports de performance par TC, par zone ou par periode. Comparer les campagnes entre elles.",
    impact: "Le suivi se limite aux compteurs en temps reel, pas d'historique.",
  },
]

export default function Limitations() {
  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
        <div>
          <h2 className="font-semibold text-amber-900">
            Fonctionnalites non disponibles sur cette version
          </h2>
          <p className="text-amber-700 text-sm mt-1">
            Cette application est un prototype deploye sur GitHub Pages avec Supabase comme backend.
            Les fonctionnalites ci-dessous necessitent un serveur applicatif dedie.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {limitations.map(({ icon: Icon, title, description, impact }) => (
          <div key={title} className="bg-white border rounded-lg p-4 flex items-start gap-4">
            <div className="bg-gray-100 rounded-lg p-2.5 shrink-0">
              <Icon className="text-gray-500" size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="font-medium text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600 mt-1">{description}</p>
              <p className="text-sm text-red-600 mt-2 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 bg-red-400 rounded-full shrink-0" />
                {impact}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-cooperl-50 border border-cooperl-200 rounded-lg p-4 text-sm text-cooperl-800">
        <p className="font-medium">Avec l'infrastructure cible (serveur applicatif + base de donnees) :</p>
        <p className="mt-1">
          Toutes ces fonctionnalites deviennent realisables. L'application est concue pour migrer
          vers cette architecture sans repartir de zero.
        </p>
      </div>
    </div>
  )
}
