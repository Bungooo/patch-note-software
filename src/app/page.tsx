import sql from "@/lib/db"
import { PatchNoteDashboard } from "@/components/PatchNoteDashboard"

export default async function HubPage() {
  // Récupération serveur de tes notes Ianord
  const notes = await sql`SELECT * FROM "PatchNote" ORDER BY date DESC`

  return (
    <PatchNoteDashboard notes={notes as any} />
  )
}