import sql from "@/lib/db"

type LogoRow = { data: Buffer | null; type: string | null }

// Sert un logo importé. L'URL contient un hash du fichier (?v=…) : la réponse peut donc être mise en cache indéfiniment.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string; kind: string }> }) {
    const { id, kind } = await params
    if (!/^\d+$/.test(id) || (kind !== "3d" && kind !== "plat")) return new Response(null, { status: 404 })

    const [row] = kind === "3d"
        ? await sql<LogoRow[]>`SELECT "logo3d" AS data, "logo3dType" AS type FROM "Software" WHERE id = ${id}`
        : await sql<LogoRow[]>`SELECT "logoFlat" AS data, "logoFlatType" AS type FROM "Software" WHERE id = ${id}`
    if (!row?.data || !row.type) return new Response(null, { status: 404 })

    return new Response(new Uint8Array(row.data), {
        headers: {
            "Content-Type": row.type,
            "Cache-Control": "public, max-age=31536000, immutable",
            // Un SVG importé ouvert directement ne peut exécuter aucun script
            "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; img-src data:",
            "X-Content-Type-Options": "nosniff",
        },
    })
}
