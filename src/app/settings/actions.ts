"use server"

import sql from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function addMember(formData: FormData) {
    const firstName = (formData.get("firstName") as string)?.trim()
    const lastName = (formData.get("lastName") as string)?.trim().toUpperCase()
    const role = (formData.get("role") as string)?.trim()

    if (!firstName || !lastName) return { error: "Prénom et nom requis" }

    await sql`
        INSERT INTO "Member" ("firstName", "lastName", "role")
        VALUES (${firstName}, ${lastName}, ${role || ""})
    `
    revalidatePath("/settings")
    revalidatePath("/builder")
    return { success: true }
}

export async function deleteMember(id: number) {
    await sql`DELETE FROM "Member" WHERE id = ${id}`
    revalidatePath("/settings")
    revalidatePath("/builder")
    return { success: true }
}

export async function updateMember(id: number, firstName: string, lastName: string, role: string) {
    if (!firstName?.trim() || !lastName?.trim()) return { error: "Prénom et nom requis" }
    await sql`
        UPDATE "Member"
        SET "firstName" = ${firstName.trim()}, "lastName" = ${lastName.trim().toUpperCase()}, "role" = ${role?.trim() || ""}
        WHERE id = ${id}
    `
    revalidatePath("/settings")
    revalidatePath("/builder")
    return { success: true }
}

export async function getMembers() {
    const members = await sql`SELECT * FROM "Member" ORDER BY "lastName" ASC`
    return members
}

