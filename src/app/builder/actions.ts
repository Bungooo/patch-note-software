"use server"

import sql from "@/lib/db"
import { PatchNoteValues } from "@/lib/schema"
import { revalidatePath } from "next/cache"

export async function savePatchNote(data: PatchNoteValues, id?: string) {
  try {
    const isoDate = new Date(data.date).toISOString()
    const jsonContent = JSON.stringify(data.sections)

    if (id) {
      // MODE ÉDITION : On met à jour la note existante
      await sql`
        UPDATE "PatchNote" SET
          date = ${isoDate},
          intro = ${data.intro},
          author = ${data.author},
          content = ${jsonContent}
        WHERE id = ${id}
      `
    } else {
      // MODE CRÉATION : On insère une nouvelle ligne
      await sql`
        INSERT INTO "PatchNote" (id, date, intro, author, content, "createdAt")
        VALUES (${crypto.randomUUID()}, ${isoDate}, ${data.intro}, ${data.author}, ${jsonContent}, NOW())
      `
    }

    revalidatePath("/")
    return { success: true }
  } catch (error: any) {
    console.error("Erreur Neon:", error.message)
    return { success: false, error: error.message }
  }
}

export async function deletePatchNote(id: string) {
  try {
    // Suppression physique dans la table Neon
    await sql`DELETE FROM "PatchNote" WHERE id = ${id}`

    // On rafraîchit la page d'accueil pour faire disparaître la carte
    revalidatePath("/")
    return { success: true }
  } catch (error: any) {
    console.error("Erreur suppression Neon:", error.message)
    return { success: false, error: error.message }
  }
}