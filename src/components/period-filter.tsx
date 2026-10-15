"use client"

import { useMemo, useState } from "react"
import { CalendarIcon, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn, parseLocalDate } from "@/lib/utils"

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const monthName = (ym: string, month: "long" | "short") =>
    capitalize(parseLocalDate(`${ym}-01`).toLocaleDateString("fr-FR", { month }))

// "all", "2026" ou "2026-10"
function label(value: string) {
    if (value === "all") return "Toutes les périodes"
    if (value.length === 4) return `Année ${value}`
    return `${monthName(value, "long")} ${value.slice(0, 4)}`
}

const plural = (n: number) => `${n} note${n > 1 ? "s" : ""}`

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
                    className={cn("w-[220px] justify-between font-normal", value !== "all" && "border-blue-300 text-blue-700")}
                    style={{ backgroundColor: "var(--token-surface-secondary)" }}
                >
                    <span className="flex items-center gap-2 truncate">
                        <CalendarIcon className="h-4 w-4 opacity-50" />
                        {label(value)}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[280px] p-3">
                <div className="flex items-center justify-between mb-3">
                    <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Année précédente"
                        disabled={year <= minYear} onClick={() => setYear(y => y - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-semibold">{year}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Année suivante"
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
                            <button
                                key={ym}
                                type="button"
                                disabled={count === 0}
                                aria-pressed={active}
                                aria-label={`${label(ym)}, ${plural(count)}`}
                                // Recliquer sur le mois choisi le désélectionne
                                onClick={() => select(active ? "all" : ym)}
                                className={cn(
                                    "flex flex-col items-center rounded-md py-2 text-sm transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                                    active ? "bg-blue-600 text-white" : "hover:bg-blue-50",
                                    count === 0 && "text-slate-300 cursor-not-allowed hover:bg-transparent",
                                )}
                            >
                                <span className={cn(count > 0 && "font-medium")}>{monthName(ym, "short")}</span>
                                <span className={cn("text-[11px]", active ? "text-blue-100" : "text-muted-foreground", count === 0 && "invisible")}>
                                    {count}
                                </span>
                            </button>
                        )
                    })}
                </div>

                <div className="mt-3 pt-3 border-t flex items-center justify-between gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        className={cn("h-8 text-xs", value === String(year) && "bg-blue-600 border-blue-600 text-white hover:bg-blue-700 hover:text-white")}
                        disabled={!counts.get(String(year))}
                        onClick={() => select(String(year))}
                    >
                        Toute l&apos;année {year} · {counts.get(String(year)) ?? 0}
                    </Button>
                    {value !== "all" && (
                        <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => select("all")}>
                            Réinitialiser
                        </Button>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}
