"use server"

import sql from "@/lib/db"
import { PatchNoteSchema, type PatchNoteValues } from "@/lib/schema"
import { revalidatePath } from "next/cache"

type Result = { success: true } | { success: false; error: string }

export async function savePatchNote(data: PatchNoteValues, id?: string): Promise<Result> {
  const parsed = PatchNoteSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }
  const { date, intro, author, sections } = parsed.data

  try {
    if (id) {
      await sql`
        UPDATE "PatchNote"
        SET date = ${date}, intro = ${intro}, author = ${author}, content = ${sql.json(sections)}
        WHERE id = ${id}
      `
    } else {
      await sql`
        INSERT INTO "PatchNote" (id, date, intro, author, content)
        VALUES (${crypto.randomUUID()}, ${date}, ${intro}, ${author}, ${sql.json(sections)})
      `
    }
  } catch (error) {
    console.error("Erreur enregistrement note :", error)
    return { success: false, error: (error as Error).message }
  }

  revalidatePath("/", "layout")
  return { success: true }
}

export async function deletePatchNote(id: string): Promise<Result> {
  try {
    await sql`DELETE FROM "PatchNote" WHERE id = ${id}`
  } catch (error) {
    console.error("Erreur suppression note :", error)
    return { success: false, error: (error as Error).message }
  }

  revalidatePath("/", "layout")
  return { success: true }
}
