import { getMembers, getSoftwares } from "@/lib/data"
import { SettingsClient } from "./settings-client"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
    const [members, softwares] = await Promise.all([getMembers(), getSoftwares()])
    return <SettingsClient members={members} softwares={softwares} />
}
