"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowDown, ArrowUp, Check, Package, Pencil, Plus, RotateCcw, Trash2, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DEFAULT_LOGO } from "@/lib/logos"
import type { Software } from "@/lib/types"
import { addSoftware, deleteSoftware, moveSoftware, renameSoftware, setSoftwareLogo } from "./actions"

type Action = () => Promise<{ error?: string }>

// Lance une action serveur, affiche son erreur éventuelle et recharge les données
function useAction() {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    const run = (action: Action, onSuccess?: () => void) => {
        setError(null)
        startTransition(async () => {
            const result = await action()
            if (result.error) return setError(result.error)
            onSuccess?.()
            router.refresh()
        })
    }
    return { run, isPending, error }
}

const LOGO_LABELS = {
    plat: { title: "Logo à plat", hint: "Accueil et en-tête des sections du PDF", none: "Logo Ianord par défaut" },
    "3d": { title: "Logo 3D", hint: "Page de garde du PDF", none: "Logo Ianord : absent de la page de garde" },
}

function LogoSlot({ software, kind }: { software: Software; kind: "3d" | "plat" }) {
    const { run, isPending, error } = useAction()
    const input = useRef<HTMLInputElement>(null)
    const logo = kind === "3d" ? software.logo3d : software.logoFlat
    const labels = LOGO_LABELS[kind]

    const upload = (file: File | undefined) => {
        if (!file) return
        const data = new FormData()
        data.set("file", file)
        run(() => setSoftwareLogo(software.id, kind, data))
    }

    return (
        <div className="flex-1 min-w-0 rounded-lg border p-3 space-y-2">
            <div>
                <p className="text-xs font-medium">{labels.title}</p>
                <p className="text-[11px] text-muted-foreground">{labels.hint}</p>
            </div>
            <div className="flex items-center gap-3">
                <div className="h-14 w-14 shrink-0 rounded-md bg-slate-50 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element -- aperçu de logos servis depuis la base */}
                    <img
                        src={logo?.url ?? DEFAULT_LOGO}
                        alt=""
                        className={logo ? "max-h-12 max-w-12 object-contain" : "max-h-8 max-w-8 object-contain opacity-40"}
                    />
                </div>
                <div className="flex flex-col items-start gap-1 min-w-0">
                    {!logo && <p className="text-[11px] text-muted-foreground">{labels.none}</p>}
                    <div className="flex flex-wrap gap-1">
                        <Button size="sm" variant="outline" className="h-7 text-xs" disabled={isPending} onClick={() => input.current?.click()}>
                            <Upload className="h-3 w-3" />{logo ? "Remplacer" : "Importer"}
                        </Button>
                        {logo && (
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs"
                                disabled={isPending}
                                title="Revenir au logo Ianord par défaut"
                                onClick={() => run(() => setSoftwareLogo(software.id, kind, null))}
                            >
                                <RotateCcw className="h-3 w-3" />Logo Ianord
                            </Button>
                        )}
                    </div>
                </div>
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <input
                ref={input}
                type="file"
                accept="image/svg+xml,image/png,image/webp,image/jpeg"
                className="hidden"
                onChange={e => {
                    upload(e.target.files?.[0])
                    e.target.value = "" // permet de réimporter le même fichier
                }}
            />
        </div>
    )
}

function SoftwareRow({ software, isFirst, isLast }: { software: Software; isFirst: boolean; isLast: boolean }) {
    const { run, isPending, error } = useAction()
    const [editing, setEditing] = useState(false)
    const [name, setName] = useState(software.name)

    const cancel = () => {
        setName(software.name)
        setEditing(false)
    }

    return (
        <li className="px-6 py-4 space-y-3 group">
            <div className="flex items-center gap-2">
                {editing ? (
                    <>
                        <Input value={name} onChange={e => setName(e.target.value)} className="h-8 text-sm" autoFocus />
                        <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={cancel} disabled={isPending} title="Annuler">
                            <X className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            disabled={isPending}
                            title="Enregistrer"
                            onClick={() => run(() => renameSoftware(software.id, name), () => setEditing(false))}
                        >
                            <Check className="h-3.5 w-3.5" />
                        </Button>
                    </>
                ) : (
                    <>
                        <p className="flex-1 font-medium text-sm">{software.name}</p>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                            <Button size="icon" variant="ghost" className="h-8 w-8" disabled={isPending || isFirst} title="Monter"
                                onClick={() => run(() => moveSoftware(software.id, -1))}>
                                <ArrowUp className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8" disabled={isPending || isLast} title="Descendre"
                                onClick={() => run(() => moveSoftware(software.id, 1))}>
                                <ArrowDown className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-slate-700" disabled={isPending} title="Renommer"
                                onClick={() => setEditing(true)}>
                                <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50" disabled={isPending} title="Supprimer"
                                onClick={() => {
                                    if (confirm(`Supprimer ${software.name} ? Les notes existantes le garderont, avec le logo Ianord.`)) {
                                        run(() => deleteSoftware(software.id))
                                    }
                                }}>
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </>
                )}
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex flex-col sm:flex-row gap-3">
                <LogoSlot software={software} kind="plat" />
                <LogoSlot software={software} kind="3d" />
            </div>
        </li>
    )
}

export function SoftwaresPanel({ softwares }: { softwares: Software[] }) {
    const { run, isPending, error } = useAction()
    const [name, setName] = useState("")

    const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        run(() => addSoftware(name), () => setName(""))
    }

    return (
        <div>
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Plus className="h-4 w-4" />
                        Ajouter un logiciel
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAdd} className="flex gap-2">
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="ex : WebPlanning" required />
                        <Button type="submit" disabled={isPending}>
                            <Plus className="h-4 w-4" />Ajouter
                        </Button>
                    </form>
                    {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
                    <p className="mt-3 text-xs text-muted-foreground">
                        Sans logo importé, le logo Ianord est utilisé. Seuls les logiciels avec un logo 3D apparaissent sur la page de garde du PDF.
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Package className="h-4 w-4" />
                        Logiciels
                        <span className="ml-auto text-sm font-normal text-muted-foreground">
                            {softwares.length} logiciel{softwares.length !== 1 ? "s" : ""}
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {softwares.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-10">
                            Aucun logiciel pour l&apos;instant. Ajoutez-en un ci-dessus.
                        </p>
                    ) : (
                        <ul className="divide-y">
                            {softwares.map((s, i) => (
                                <SoftwareRow key={s.id} software={s} isFirst={i === 0} isLast={i === softwares.length - 1} />
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
