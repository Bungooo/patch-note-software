"use client"

import { useMemo, useState } from "react"
import { CalendarIcon, Check, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FilterClear } from "@/components/filter-clear"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn, parseLocalDate, SELECTED } from "@/lib/utils"

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const monthName = (ym: string, month: "long" | "short") =>
    capitalize(parseLocalDate(`${ym}-01`).toLocaleDateString("fr-FR", { month }))

// "all", "2026" ou "2026-10"
function label(value: string) {
    if (value === "all") return "Toutes les périodes"
    if (value.length === 4) return `Année ${value}`
    return `${monthName(value, "long")} ${value.slice(0, 4)}`
}

const patchs = (n: number) => `${n} patch${n > 1 ? "s" : ""}`

// Sélecteur de période : une grille de mois par année, avec le nombre de notes de chaque mois
// value : "all", une année ("2026") ou un mois ("2026-10"), préfixe des dates AAAA-MM-JJ
export function PeriodFilter({ dates, value, onChange }: {
    dates: string[]
    value: string
    onChange: (value: string) => void
}) {
    const counts = useMemo(() => {
        const map = new Map<string, number>()
        for (const d of dates) for (const key of [d.slice(0, 4), d.slice(0, 7)]) map.set(key, (map.get(key) ?? 0) + 1)
        return map
    }, [dates])

    const years = dates.map(d => Number(d.slice(0, 4)))
    const thisYear = new Date().getFullYear()
    const minYear = Math.min(thisYear, ...years)
    const maxYear = Math.max(thisYear, ...years)

    const [open, setOpen] = useState(false)
    const [year, setYear] = useState(maxYear)

    const select = (v: string) => {
        onChange(v)
        setOpen(false)
    }

    return (
        <div className="relative">
            <Popover
                open={open}
                onOpenChange={o => {
                    // À l'ouverture, se placer sur l'année de la période choisie
                    if (o) setYear(value === "all" ? maxYear : Number(value.slice(0, 4)))
                    setOpen(o)
                }}
            >
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className="w-[220px] justify-between font-normal"
                        style={{ backgroundColor: "var(--token-surface-secondary)" }}
                    >
                        <span className="flex items-center gap-2 truncate">
                            <CalendarIcon className="h-4 w-4 opacity-50" />
                            {label(value)}
                        </span>
                        <ChevronDown className={cn("h-4 w-4 opacity-50", value !== "all" && "invisible")} />
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-[340px] p-3">
                    <div className="flex items-center justify-between mb-3">
                        <Button variant="ghost" size="icon" className="h-7 w-7" tooltip="Année précédente"
                            disabled={year <= minYear} onClick={() => setYear(y => y - 1)}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-semibold">{year}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" tooltip="Année suivante"
                            disabled={year >= maxYear} onClick={() => setYear(y => y + 1)}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-1">
                        {Array.from({ length: 12 }, (_, i) => {
                            const ym = `${year}-${String(i + 1).padStart(2, "0")}`
                            const count = counts.get(ym) ?? 0
                            const active = value === ym
                            return (
                                <Button
                                    key={ym}
                                    variant="ghost"
                                    disabled={count === 0}
                                    aria-pressed={active}
                                    aria-label={`${label(ym)}, ${patchs(count)}`}
                                    // Recliquer sur le mois choisi le désélectionne
                                    onClick={() => select(active ? "all" : ym)}
                                    className={cn("h-auto flex-col gap-0 py-2", active && SELECTED)}
                                >
                                    <span className="flex items-center gap-1">
                                    {active && <Check className="h-3.5 w-3.5" />}
                                    {monthName(ym, "short")}
                                </span>
                                    <span className={cn("text-[11px] font-normal", active ? "text-primary/80" : "text-muted-foreground", count === 0 && "invisible")}>
                                        {patchs(count)}
                                    </span>
                                </Button>
                            )
                        })}
                    </div>

                    <div className="mt-3 pt-3 border-t flex items-center justify-between gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            className={cn("h-8 text-xs", value === String(year) && cn(SELECTED, "border-transparent"))}
                            disabled={!counts.get(String(year))}
                            tooltip={`Afficher toutes les notes de ${year}`}
                            onClick={() => select(String(year))}
                        >
                            {value === String(year) && <Check className="h-3.5 w-3.5" />}
                            Toute l&apos;année {year} · {patchs(counts.get(String(year)) ?? 0)}
                        </Button>
                        {value !== "all" && (
                            <Button size="sm" variant="ghost" className="h-8 text-xs" tooltip="Afficher toutes les périodes" onClick={() => select("all")}>
                                Réinitialiser
                            </Button>
                        )}
                    </div>
                </PopoverContent>
            </Popover>
            {value !== "all" && <FilterClear label="Retirer le filtre période" onClear={() => onChange("all")} />}
        </div>
    )
}
