import sql from "@/lib/db"
import { SettingsClient } from "./SettingsClient"

export default async function SettingsPage() {
    // Création de la table si elle n'existe pas encore
    await sql`
        CREATE TABLE IF NOT EXISTS "Member" (
            id SERIAL PRIMARY KEY,
            "firstName" TEXT NOT NULL,
            "lastName" TEXT NOT NULL,
            "role" TEXT NOT NULL DEFAULT '',
            "createdAt" TIMESTAMP DEFAULT NOW()
        )
    `

    const members = await sql`SELECT * FROM "Member" ORDER BY "lastName" ASC`

    return <SettingsClient members={members as any} />
}
