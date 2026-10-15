"use server"

import sql, { transaction } from "@/lib/db"
import { revalidatePath } from "next/cache"

type Result = { error?: string }

// Les collaborateurs et logiciels apparaissent partout (accueil, builder, PDF)
const refresh = () => revalidatePath("/", "layout")

const isUniqueViolation = (e: unknown) => (e as { code?: string }).code === "23505"

// --- Collaborateurs ---

export async function addMember(firstName: string, lastName: string, role: string): Promise<Result> {
    if (!firstName.trim() || !lastName.trim()) return { error: "Prénom et nom requis" }
    await sql`
        INSERT INTO "Member" ("firstName", "lastName", role)
        VALUES (${firstName.trim()}, ${lastName.trim().toUpperCase()}, ${role.trim()})
    `
    refresh()
    return {}
}

// Les notes enregistrent l'auteur par son nom complet : on le met à jour dans ses notes
export async function updateMember(id: number, firstName: string, lastName: string, role: string): Promise<Result> {
    if (!firstName.trim() || !lastName.trim()) return { error: "Prénom et nom requis" }
    await transaction(async tx => {
        const [old] = await tx<{ name: string }[]>`SELECT "firstName" || ' ' || "lastName" AS name FROM "Member" WHERE id = ${id}`
        const [updated] = await tx<{ name: string }[]>`
            UPDATE "Member"
            SET "firstName" = ${firstName.trim()}, "lastName" = ${lastName.trim().toUpperCase()}, role = ${role.trim()}
            WHERE id = ${id}
            RETURNING "firstName" || ' ' || "lastName" AS name
        `
        if (old && updated && old.name !== updated.name) {
            await tx`UPDATE "PatchNote" SET author = ${updated.name} WHERE author = ${old.name}`
        }
    })
    refresh()
    return {}
}

export async function deleteMember(id: number): Promise<Result> {
    await sql`DELETE FROM "Member" WHERE id = ${id}`
    refresh()
    return {}
}

// --- Logiciels ---

const LOGO_TYPES = ["image/svg+xml", "image/png", "image/webp", "image/jpeg"]
const LOGO_MAX_BYTES = 2 * 1024 * 1024

export async function addSoftware(name: string): Promise<Result> {
    if (!name.trim()) return { error: "Nom requis" }
    try {
        await sql`
            INSERT INTO "Software" (name, position)
            VALUES (${name.trim()}, (SELECT COALESCE(MAX(position) + 1, 0) FROM "Software"))
        `
    } catch (e) {
        if (isUniqueViolation(e)) return { error: "Ce logiciel existe déjà" }
        throw e
    }
    refresh()
    return {}
}

// Renomme aussi le logiciel dans les notes existantes, pour qu'elles gardent leur logo
export async function renameSoftware(id: number, name: string): Promise<Result> {
    const newName = name.trim()
    if (!newName) return { error: "Nom requis" }
    try {
        await transaction(async tx => {
            const [old] = await tx<{ name: string }[]>`SELECT name FROM "Software" WHERE id = ${id}`
            if (!old || old.name === newName) return
            await tx`UPDATE "Software" SET name = ${newName} WHERE id = ${id}`
            await tx`
                UPDATE "PatchNote" SET content = (
                    SELECT jsonb_agg(
                        CASE WHEN section->>'name' = ${old.name}
                             THEN jsonb_set(section, '{name}', to_jsonb(${newName}::text))
                             ELSE section END
                        ORDER BY i)
                    FROM jsonb_array_elements(content) WITH ORDINALITY AS t(section, i)
                )
                WHERE jsonb_typeof(content) = 'array'
                  AND content @> ${sql.json([{ name: old.name }])}
            `
        })
    } catch (e) {
        if (isUniqueViolation(e)) return { error: "Ce logiciel existe déjà" }
        throw e
    }
    refresh()
    return {}
}

export async function deleteSoftware(id: number): Promise<Result> {
    await sql`DELETE FROM "Software" WHERE id = ${id}`
    refresh()
    return {}
}

export async function moveSoftware(id: number, direction: -1 | 1): Promise<Result> {
    await transaction(async tx => {
        const rows = await tx<{ id: number }[]>`SELECT id FROM "Software" ORDER BY position, name`
        const from = rows.findIndex(r => r.id === id)
        const to = from + direction
        if (from < 0 || to < 0 || to >= rows.length) return
        ;[rows[from], rows[to]] = [rows[to], rows[from]]
        // Renumérote toute la liste : les positions restent continues
        for (const [position, row] of rows.entries()) {
            await tx`UPDATE "Software" SET position = ${position} WHERE id = ${row.id}`
        }
    })
    refresh()
    return {}
}

// Sans fichier : retour au logo Ianord par défaut
export async function setSoftwareLogo(id: number, kind: "3d" | "plat", formData: FormData | null): Promise<Result> {
    let data: Buffer | null = null
    let type: string | null = null

    const file = formData?.get("file")
    if (file instanceof File) {
        if (!LOGO_TYPES.includes(file.type)) return { error: "Format accepté : SVG, PNG, WebP ou JPEG" }
        if (file.size > LOGO_MAX_BYTES) return { error: "Fichier trop lourd (2 Mo maximum)" }
        data = Buffer.from(await file.arrayBuffer())
        type = file.type
    }

    if (kind === "3d") {
        await sql`UPDATE "Software" SET "logo3d" = ${data}, "logo3dType" = ${type} WHERE id = ${id}`
    } else {
        await sql`UPDATE "Software" SET "logoFlat" = ${data}, "logoFlatType" = ${type} WHERE id = ${id}`
    }
    refresh()
    return {}
}
