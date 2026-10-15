import sql from "@/lib/db"
import BuilderClient from "./BuilderClient"

export default async function BuilderPage({
    searchParams
}: {
    searchParams: Promise<{ id?: string }>
}) {
    // 1. On attend de recevoir les paramètres de l'URL
    const { id } = await searchParams;
    let initialData = null;

    // 2. Si on a un ID, on va chercher la note dans Neon
    if (id) {
        try {
            const [note] = await sql`SELECT * FROM "PatchNote" WHERE id = ${id}`
            if (note) {
                initialData = {
                    ...note,
                    // On transforme le texte JSON de Neon en objet pour le formulaire
                    sections: typeof note.content === 'string'
                        ? JSON.parse(note.content)
                        : note.content
                }
            }
        } catch (error) {
            console.error("Erreur de récupération Neon:", error)
        }
    }

    // 3. Récupération des membres depuis la DB (table créée à la volée si besoin)
    let members: { id: number; firstName: string; lastName: string; role: string }[] = []
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS "Member" (
                id SERIAL PRIMARY KEY,
                "firstName" TEXT NOT NULL,
                "lastName" TEXT NOT NULL,
                "role" TEXT NOT NULL DEFAULT '',
                "createdAt" TIMESTAMP DEFAULT NOW()
            )
        `
        members = (await sql`SELECT * FROM "Member" ORDER BY "lastName" ASC`) as any
    } catch (error) {
        console.error("Erreur récupération membres:", error)
    }

    // 4. On envoie les données au composant client
    return <BuilderClient initialData={initialData} members={members} />
}