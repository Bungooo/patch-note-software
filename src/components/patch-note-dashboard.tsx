"use client"

import { useState, useMemo } from "react"
import { PatchNoteCard } from "@/components/patch-note-card"
import { PeriodFilter } from "@/components/period-filter"
import { FilterClear } from "@/components/filter-clear"
import type { PatchNote, Software } from "@/lib/types"
import { cn, formatDate, SELECTED_ITEM } from "@/lib/utils"
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

export function PatchNoteDashboard({ notes, softwares }: { notes: PatchNote[]; softwares: Software[] }) {
    const [search, setSearch] = useState("")
    // Aucun logiciel coché = tous les logiciels
    const [selected, setSelected] = useState<string[]>([])
    const [author, setAuthor] = useState<string>("all")
    // "all", une année ("2026") ou un mois ("2026-10") : préfixe de la date AAAA-MM-JJ
    const [period, setPeriod] = useState<string>("all")
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

    const authors = useMemo(() => [...new Set(notes.map(n => n.author))].sort((a, b) => a.localeCompare(b)), [notes])

    // Recherche dans le menu des logiciels, sans tenir compte des accents ni des majuscules
    const [softwareQuery, setSoftwareQuery] = useState("")
    const normalize = (v: string) => v.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()
    const matchingSoftwares = allSoftwares.filter(s => normalize(s.name).includes(normalize(softwareQuery)))

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
            (author === "all" || note.author === author) &&
            (period === "all" || note.date.startsWith(period))
        )
    }, [notes, search, selected, author, period])

    return (
        <div className="py-10">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Patch Notes</h1>
                {/* Boutons d'action */}
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" tooltip="Paramètres : équipe et logiciels" asChild>
                        <Link href="/settings"><Settings className="h-4 w-4" /></Link>
                    </Button>
                    <Button tooltip="Créer une nouvelle patch note" asChild>
                        <Link href="/builder"><Plus className="h-4 w-4" />Créer une note</Link>
                    </Button>
                </div>
            </div>

            {/* Filtres : un filtre actif remplace son chevron par une croix qui le retire */}
            <div className="flex flex-wrap items-end gap-4 py-10">
                <div className="flex flex-col gap-2 items-start">
                    <span className="text-sm font-medium">Recherche</span>
                    <div className="relative">
                        <Input
                            placeholder="Rechercher..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setVisibleCount(10) }}
                            className="w-[200px] pr-8"
                            style={{ backgroundColor: "var(--token-surface-secondary)" }}
                        />
                        {search && <FilterClear label="Effacer la recherche" onClear={() => resetAndSet(setSearch)("")} />}
                    </div>
                </div>

                <div className="flex flex-col gap-2 items-start">
                    <span className="text-sm font-medium">Logiciel</span>
                    <div className="relative">
                        <DropdownMenu onOpenChange={open => !open && setSoftwareQuery("")}>
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
                                    <ChevronDown className={cn("h-4 w-4 opacity-50", selected.length > 0 && "invisible")} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-[240px]">
                                <Input
                                    autoFocus
                                    value={softwareQuery}
                                    onChange={e => setSoftwareQuery(e.target.value)}
                                    onKeyDown={e => {
                                        // Entrée coche le premier résultat, ↓ descend dans la liste, Échap reste géré par le menu
                                        if (e.key === "Enter" && matchingSoftwares[0]) toggleSoftware(matchingSoftwares[0].name)
                                        if (e.key === "ArrowDown") {
                                            e.preventDefault()
                                            const items = e.currentTarget.closest("[role=menu]")?.querySelectorAll<HTMLElement>("[role=menuitemcheckbox]")
                                            items?.[items.length > 1 ? 1 : 0]?.focus()
                                        }
                                        if (e.key !== "Escape") e.stopPropagation()
                                    }}
                                    placeholder="Rechercher un logiciel…"
                                    aria-label="Rechercher un logiciel"
                                    className="h-8 mb-1"
                                />
                                <DropdownMenuCheckboxItem
                                    className={cn("mt-px", SELECTED_ITEM)}
                                    checked={selected.length === 0}
                                    onCheckedChange={() => { setSelected([]); setVisibleCount(10) }}
                                    onSelect={e => e.preventDefault()}
                                >
                                    Tous les logiciels
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuSeparator />
                                {matchingSoftwares.length === 0 && (
                                    <p className="px-2 py-1.5 text-sm text-muted-foreground">Aucun logiciel trouvé</p>
                                )}
                                {matchingSoftwares.map(s => (
                                    <DropdownMenuCheckboxItem
                                        className={cn("mt-px", SELECTED_ITEM)}
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
                        {selected.length > 0 && (
                            <FilterClear label="Retirer le filtre logiciel" onClear={() => { setSelected([]); setVisibleCount(10) }} />
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-2 items-start">
                    <span className="text-sm font-medium">Auteur</span>
                    <div className="relative">
                        <Select value={author} onValueChange={resetAndSet(setAuthor)}>
                            {/* Filtre actif : le chevron (dernier svg) laisse la place à la croix */}
                            <SelectTrigger
                                className={cn("w-[200px]", author !== "all" && "[&>svg:last-child]:invisible")}
                                style={{ backgroundColor: "var(--token-surface-secondary)" }}
                            >
                                <SelectValue placeholder="Auteur" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all" className={SELECTED_ITEM}>Tous les auteurs</SelectItem>
                                {authors.map(a => (
                                    <SelectItem key={a} value={a} className={SELECTED_ITEM}>{a}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {author !== "all" && <FilterClear label="Retirer le filtre auteur" onClear={() => resetAndSet(setAuthor)("all")} />}
                    </div>
                </div>

                <div className="flex flex-col gap-2 items-start">
                    <span className="text-sm font-medium">Période</span>
                    <PeriodFilter dates={notes.map(n => n.date)} value={period} onChange={resetAndSet(setPeriod)} />
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
                        tooltip="Afficher 10 notes de plus"
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
