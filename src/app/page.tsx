import { getNotes, getSoftwares } from "@/lib/data"
import { PatchNoteDashboard } from "@/components/patch-note-dashboard"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const [notes, softwares] = await Promise.all([getNotes(), getSoftwares()])
  return <PatchNoteDashboard notes={notes} softwares={softwares} />
}
