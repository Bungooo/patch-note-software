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

    // 3. On envoie les données (ou null) au composant client
    return <BuilderClient initialData={initialData} />
}