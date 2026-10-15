# Ianord Patch Notes

Application interne pour rédiger les notes de mise à jour des logiciels Ianord et les exporter en PDF.
Le détail fonctionnel est dans [`docs/cahier-des-charges.md`](docs/cahier-des-charges.md).

## Installation

1. `npm install`
2. Créer `.env.local` à la racine (jamais commité) :
   ```
   DATABASE_URL="postgresql://…"
   ```
   La chaîne se trouve dans la console Neon, bouton **Connect** (version *pooled*).
3. `npm run dev`, puis ouvrir http://localhost:3000

## Base de données

- Schéma : [`db/schema.sql`](db/schema.sql)
- `npm run db:migrate` crée les tables manquantes, ajoute les logiciels de départ et corrige les anciennes notes.
  Une sauvegarde JSON est écrite dans `backups/` avant chaque passage.

## Organisation

- `src/app` : pages (`/`, `/builder`, `/note/[id]`, `/settings`) et route des logos (`/api/logos`)
- `src/components` : composants de l'application ; `src/components/ui` : composants shadcn/ui
- `src/lib` : accès aux données (`data.ts`), types, schéma de validation, logos
- Fichiers et dossiers en kebab-case
