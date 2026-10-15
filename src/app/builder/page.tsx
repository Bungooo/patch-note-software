import { notFound } from "next/navigation"
import { getMembers, getNote, getSoftwares } from "@/lib/data"
import BuilderClient from "./builder-client"

export default async function BuilderPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
    const { id } = await searchParams

    const [note, members, softwares] = await Promise.all([
        id ? getNote(id) : null,
        getMembers(),
        getSoftwares(),
    ])
    if (id && !note) notFound()

    return <BuilderClient note={note} members={members} softwares={softwares} />
}
