"use client"

import { useState, useMemo } from "react"
import { PatchNote, PatchNoteCard } from "@/components/PatchNoteCard"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

const MONTHS = [
    { value: "0", label: "Janvier" },
    { value: "1", label: "Février" },
    { value: "2", label: "Mars" },
    { value: "3", label: "Avril" },
    { value: "4", label: "Mai" },
    { value: "5", label: "Juin" },
    { value: "6", label: "Juillet" },
    { value: "7", label: "Août" },
    { value: "8", label: "Septembre" },
    { value: "9", label: "Octobre" },
    { value: "10", label: "Novembre" },
    { value: "11", label: "Décembre" },
]

export function PatchNoteDashboard({ notes }: { notes: PatchNote[] }) {
    const [search, setSearch] = useState("")
    const [software, setSoftware] = useState<string>("all")
    const [month, setMonth] = useState<string>("all")

    // Extract unique software names from notes
    const allSoftwares = useMemo(() => {
        const s = new Set<string>()
        notes.forEach(n => {
            try {
                const sections = typeof n.content === 'string' ? JSON.parse(n.content) : n.content
                if (Array.isArray(sections)) {
                    sections.forEach((sec: any) => {
                        if (sec.name) s.add(sec.name)
                    })
                }
            } catch (e) {
                console.error("Error parsing note content for software filter", e)
            }
        })
        return Array.from(s).sort()
    }, [notes])

    const filteredNotes = useMemo(() => {
        return notes.filter(note => {
            // 1. Search Filter
            const searchLower = search.toLowerCase()
            const matchSearch =
                note.author.toLowerCase().includes(searchLower) ||
                (note.intro || "").toLowerCase().includes(searchLower) ||
                new Date(note.date).toLocaleDateString('fr-FR').includes(searchLower)

            // 2. Software Filter
            let matchSoftware = true
            if (software !== "all") {
                try {
                    const sections = typeof note.content === 'string' ? JSON.parse(note.content) : note.content
                    const noteSoftwares = Array.isArray(sections) ? sections.map((s: any) => s.name) : []
                    matchSoftware = noteSoftwares.includes(software)
                } catch {
                    matchSoftware = false
                }
            }

            // 3. Period Filter
            let matchMonth = true
            if (month !== "all") {
                const noteMonth = new Date(note.date).getMonth().toString()
                matchMonth = noteMonth === month
            }

            return matchSearch && matchSoftware && matchMonth
        })
    }, [notes, search, software, month])

    return (
        <div className="py-10">
            <h1 className="text-3xl font-bold tracking-tight">Patch Notes</h1>

            {/* Actions */}
            <div className="flex py-10 justify-between items-center">
                {/* Filtres */}
                <div className="flex items-end gap-4">
                    <div className="flex flex-col gap-2 items-start">
                        <span className="text-sm font-medium">Recherche</span>
                        <Input
                            placeholder="Rechercher..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-[200px]"
                            style={{ backgroundColor: "var(--token-surface-secondary)" }}
                        />
                    </div>

                    <div className="flex flex-col gap-2 items-start">
                        <span className="text-sm font-medium">Logiciel</span>
                        <Select value={software} onValueChange={setSoftware}>
                            <SelectTrigger className="w-[180px]" style={{ backgroundColor: "var(--token-surface-secondary)" }}>
                                <SelectValue placeholder="Logiciel" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les logiciels</SelectItem>
                                {allSoftwares.map(s => (
                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-2 items-start">
                        <span className="text-sm font-medium">Période</span>
                        <Select value={month} onValueChange={setMonth}>
                            <SelectTrigger className="w-[180px]" style={{ backgroundColor: "var(--token-surface-secondary)" }}>
                                <SelectValue placeholder="Période" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Toute l'année</SelectItem>
                                {MONTHS.map(m => (
                                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Create Button */}
                <Link href="/builder">
                    <Button><Plus className="h-4 w-4" />Créer une note</Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredNotes.map((note) => (
                    <PatchNoteCard key={note.id} note={note} />
                ))}
                {filteredNotes.length === 0 && (
                    <p className="col-span-full text-center text-muted-foreground py-10">
                        Aucune note ne correspond à vos critères.
                    </p>
                )}
            </div>
        </div>
    )
}
