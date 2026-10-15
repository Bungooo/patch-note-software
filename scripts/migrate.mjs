// Met la base à jour : tables (db/schema.sql), logiciels de départ et correction des anciennes notes.
// Idempotent : peut être relancé sans risque. Usage : npm run db:migrate
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import postgres from "postgres"

const sql = postgres(process.env.DATABASE_URL, { ssl: "require", max: 1, onnotice: () => {} })
const file = (path) => readFileSync(new URL(`../${path}`, import.meta.url))

// Sauvegarde avant toute modification (dossier backups/, ignoré par Git)
const backup = {
    PatchNote: await sql`SELECT * FROM "PatchNote"`.catch(() => []),
    Member: await sql`SELECT * FROM "Member"`.catch(() => []),
}
mkdirSync(new URL("../backups", import.meta.url), { recursive: true })
const backupFile = new URL(`../backups/backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`, import.meta.url)
writeFileSync(backupFile, JSON.stringify(backup, null, 1))
console.log(`Sauvegarde : ${backupFile.pathname} (${backup.PatchNote.length} notes)`)

// Logiciels de départ, dans l'ordre du menu. Les autres utilisent le logo Ianord par défaut.
const seedLogo = (slug) => ({ flat: file(`db/seed-logos/${slug}-plat.svg`), d3: file(`db/seed-logos/${slug}-3d.svg`) })
const logos = {
    WebGerest: seedLogo("webgerest"),
    WebHoraire: seedLogo("webhoraire"),
    WebResto: seedLogo("webresto"),
    WebStock: seedLogo("webstock"),
    Tablette: seedLogo("webgerest"),
    Webview: seedLogo("webgerest"),
}
const softwares = [
    "WebGerest", "WebHoraire", "WebResto", "WebStock", "Tarification – Famille", "Tarification – Gestionnaire",
    "Inscription – Gestionnaire", "Inscription – Famille", "Réservation", "BO", "CFA", "Back", "Autre",
    "Socle Admin", "Tablette", "Acces hub", "Webview", "WebPatch",
]

await sql.begin(async (tx) => {
    await tx.unsafe(file("db/schema.sql").toString())

    const [{ count }] = await tx`SELECT count(*)::int FROM "Software"`
    if (count === 0) {
        for (const [position, name] of softwares.entries()) {
            const logo = logos[name]
            const type = logo ? "image/svg+xml" : null
            await tx`
                INSERT INTO "Software" (name, position, "logo3d", "logo3dType", "logoFlat", "logoFlatType")
                VALUES (${name}, ${position}, ${logo?.d3 ?? null}, ${type}, ${logo?.flat ?? null}, ${type})
            `
        }
        console.log(`${softwares.length} logiciels ajoutés`)
    }

    // Anciennes notes : contenu enregistré comme chaîne JSON au lieu d'un tableau
    const fixed = await tx`
        UPDATE "PatchNote" SET content = (content #>> '{}')::jsonb
        WHERE jsonb_typeof(content) = 'string'
    `
    if (fixed.count) console.log(`${fixed.count} notes corrigées`)
})

console.log("Base à jour")
await sql.end()
