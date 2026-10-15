import sql from "@/lib/db"
import type { Logo, Member, PatchNote, Section, Software } from "@/lib/types"

// Anciennes notes : le contenu était enregistré comme une chaîne JSON dans la colonne jsonb
export function parseSections(content: unknown): Section[] {
    const value = typeof content === "string" ? JSON.parse(content) : content
    if (!Array.isArray(value)) return []
    return value.map((s: Section) => ({ ...s, features: s.features ?? [], fixes: s.fixes ?? [] }))
}

// Date (sans heure) au format YYYY-MM-DD, attendu par le formulaire
export function toDateInput(date: Date) {
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${date.getFullYear()}-${month}-${day}`
}

type NoteRow = { id: string; date: Date; intro: string; author: string; content: unknown }

const toNote = (row: NoteRow): PatchNote => ({
    id: row.id,
    date: toDateInput(row.date),
    intro: row.intro,
    author: row.author,
    sections: parseSections(row.content),
})

export async function getNotes() {
    const rows = await sql<NoteRow[]>`SELECT id, date, intro, author, content FROM "PatchNote" ORDER BY date DESC`
    return rows.map(toNote)
}

export async function getNote(id: string) {
    const [row] = await sql<NoteRow[]>`SELECT id, date, intro, author, content FROM "PatchNote" WHERE id = ${id}`
    return row ? toNote(row) : null
}

export async function getMembers() {
    return sql<Member[]>`SELECT id, "firstName", "lastName", role FROM "Member" ORDER BY "lastName", "firstName"`
}

type SoftwareRow = { id: number; name: string; hash3d: string | null; hashFlat: string | null }

// Les octets des logos ne sont pas chargés ici : ils sont servis par /api/logos/[id]/[kind].
// Le hash sert à la fois de version (cache) et à dédoublonner les logos identiques.
export async function getSoftwares(): Promise<Software[]> {
    const rows = await sql<SoftwareRow[]>`
        SELECT id, name, md5("logo3d") AS hash3d, md5("logoFlat") AS "hashFlat"
        FROM "Software" ORDER BY position, name
    `
    const logo = (id: number, kind: "3d" | "plat", hash: string | null): Logo | null =>
        hash ? { url: `/api/logos/${id}/${kind}?v=${hash.slice(0, 8)}`, hash } : null

    return rows.map(r => ({
        id: r.id,
        name: r.name,
        logo3d: logo(r.id, "3d", r.hash3d),
        logoFlat: logo(r.id, "plat", r.hashFlat),
    }))
}
