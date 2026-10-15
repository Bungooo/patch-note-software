"use client"

import { useState, useMemo } from "react"
import { PatchNoteCard } from "@/components/patch-note-card"
import type { PatchNote, Software } from "@/lib/types"
import { formatDate, parseLocalDate } from "@/lib/utils"
import { DEFAULT_LOGO, softwareFinder } from "@/lib/logos"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, ChevronDown, Settings } from "lucide-react"

// Fond en plus de la coche : shadcn ne marque l'élément coché que par une petite coche
const CHECKED = "mt-px data-[state=checked]:bg-blue-50 data-[state=checked]:text-blue-700 data-[state=checked]:font-medium data-[state=checked]:focus:bg-blue-100 data-[state=checked]:focus:text-blue-700"

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

export function PatchNoteDashboard({ notes, softwares }: { notes: PatchNote[]; softwares: Software[] }) {
    const [search, setSearch] = useState("")
    // Aucun logiciel coché = tous les logiciels
    const [selected, setSelected] = useState<string[]>([])
    const [month, setMonth] = useState<string>("all")
    const [visibleCount, setVisibleCount] = useState(10)

    const resetAndSet = (setter: (v: string) => void) => (v: string) => {
        setter(v)
        setVisibleCount(10)
    }

    // Logiciels présents dans au moins une note : ceux avec un logo importé d'abord,
    // puis ceux au logo Ianord, chaque groupe dans l'ordre défini dans les paramètres
    const allSoftwares = useMemo(() => {
        const find = softwareFinder(softwares)
        const names = [...new Set(notes.flatMap(n => n.sections.map(s => s.name)).filter(Boolean))]
        return names
            .map(name => {
                const software = find(name)
                // Logiciel supprimé depuis des paramètres : en dernier
                const rank = software ? softwares.indexOf(software) : softwares.length
                return { name, logo: software?.logoFlat?.url, rank }
            })
            .sort((a, b) => Number(!a.logo) - Number(!b.logo) || a.rank - b.rank || a.name.localeCompare(b.name))
    }, [notes, softwares])

    const toggleSoftware = (name: string) => {
        setSelected(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name])
        setVisibleCount(10)
    }

    const filteredNotes = useMemo(() => {
        const searchLower = search.toLowerCase()
        return notes.filter(note =>
            (note.author.toLowerCase().includes(searchLower) ||
                note.intro.toLowerCase().includes(searchLower) ||
                formatDate(note.date).includes(searchLower)) &&
            (selected.length === 0 || note.sections.some(s => selected.includes(s.name))) &&
            (month === "all" || parseLocalDate(note.date).getMonth().toString() === month)
        )
    }, [notes, search, selected, month])

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
                            onChange={(e) => { setSearch(e.target.value); setVisibleCount(10) }}
                            className="w-[200px]"
                            style={{ backgroundColor: "var(--token-surface-secondary)" }}
                        />
                    </div>

                    <div className="flex flex-col gap-2 items-start">
                        <span className="text-sm font-medium">Logiciel</span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-[240px] justify-between font-normal"
                                    style={{ backgroundColor: "var(--token-surface-secondary)" }}
                                >
                                    <span className="truncate">
                                        {selected.length === 0 ? "Tous les logiciels"
                                            : selected.length === 1 ? selected[0]
                                                : `${selected.length} logiciels`}
                                    </span>
                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-[240px]">
                                <DropdownMenuCheckboxItem
                                    className={CHECKED}
                                    checked={selected.length === 0}
                                    onCheckedChange={() => { setSelected([]); setVisibleCount(10) }}
                                    onSelect={e => e.preventDefault()}
                                >
                                    Tous les logiciels
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuSeparator />
                                {allSoftwares.map(s => (
                                    <DropdownMenuCheckboxItem
                                        className={CHECKED}
                                        key={s.name}
                                        checked={selected.includes(s.name)}
                                        onCheckedChange={() => toggleSoftware(s.name)}
                                        // Garde le menu ouvert pour cocher plusieurs logiciels
                                        onSelect={e => e.preventDefault()}
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element -- logos servis depuis la base */}
                                        <img src={s.logo ?? DEFAULT_LOGO} alt="" className="h-4 w-4 object-contain" />
                                        {s.name}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="flex flex-col gap-2 items-start">
                        <span className="text-sm font-medium">Période</span>
                        <Select value={month} onValueChange={resetAndSet(setMonth)}>
                            <SelectTrigger className="w-[180px]" style={{ backgroundColor: "var(--token-surface-secondary)" }}>
                                <SelectValue placeholder="Période" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Toute l&apos;année</SelectItem>
                                {MONTHS.map(m => (
                                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Boutons d'action */}
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" title="Paramètres" asChild>
                        <Link href="/settings"><Settings className="h-4 w-4" /></Link>
                    </Button>
                    <Button asChild>
                        <Link href="/builder"><Plus className="h-4 w-4" />Créer une note</Link>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredNotes.slice(0, visibleCount).map((note) => (
                    <PatchNoteCard key={note.id} note={note} softwares={softwares} />
                ))}
                {filteredNotes.length === 0 && (
                    <p className="col-span-full text-center text-muted-foreground py-10">
                        Aucune note ne correspond à vos critères.
                    </p>
                )}
            </div>

            {/* Bouton Charger plus */}
            {visibleCount < filteredNotes.length && (
                <div className="flex flex-col items-center gap-2 mt-8">
                    <p className="text-sm text-muted-foreground">
                        {Math.min(visibleCount, filteredNotes.length)} / {filteredNotes.length} notes affichées
                    </p>
                    <Button
                        variant="outline"
                        className="px-8"
                        onClick={() => setVisibleCount(prev => prev + 10)}
                    >
                        <ChevronDown className="h-4 w-4" />
                        Charger plus
                    </Button>
                </div>
            )}
        </div>
    )
}
