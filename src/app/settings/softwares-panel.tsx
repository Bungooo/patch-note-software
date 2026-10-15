"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowDown, ArrowUp, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DEFAULT_LOGO } from "@/lib/logos"
import type { Software } from "@/lib/types"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { addSoftware, deleteSoftware, moveSoftware, renameSoftware, setSoftwareLogo } from "./actions"

type Action = () => Promise<{ error?: string }>

// Lance une action serveur, notifie son erreur éventuelle et recharge les données
function useAction() {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const run = (action: Action, onSuccess?: () => void) => {
        startTransition(async () => {
            const result = await action()
            if (result.error) return void toast.error(result.error)
            onSuccess?.()
            router.refresh()
        })
    }
    return { run, isPending }
}

const LOGO_LABELS = {
    plat: { title: "logo à plat", none: "Logo Ianord par défaut" },
    "3d": { title: "logo 3D", none: "Logo Ianord : absent de la page de garde" },
}

// Miniature du logo : un clic ouvre le choix du fichier ; ↺ revient au logo Ianord
function LogoCell({ software, kind }: { software: Software; kind: "3d" | "plat" }) {
    const { run, isPending } = useAction()
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
        <div className="flex items-center gap-1">
            <Button
                variant="outline"
                className="h-11 w-11 p-1"
                disabled={isPending}
                onClick={() => input.current?.click()}
                tooltip={`${logo ? "Remplacer" : "Importer"} le ${labels.title} (SVG, PNG, WebP ou JPEG, 2 Mo max)${logo ? "" : ` · ${labels.none}`}`}
            >
                {/* eslint-disable-next-line @next/next/no-img-element -- aperçu de logos servis depuis la base */}
                <img
                    src={logo?.url ?? DEFAULT_LOGO}
                    alt={logo ? `${labels.title} de ${software.name}` : labels.none}
                    className={logo ? "max-h-8 max-w-8 object-contain" : "max-h-5 max-w-5 object-contain opacity-30"}
                />
            </Button>
            {logo && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    disabled={isPending}
                    tooltip="Revenir au logo Ianord par défaut"
                    onClick={() => run(() => setSoftwareLogo(software.id, kind, null))}
                >
                    <RotateCcw className="h-3.5 w-3.5" />
                </Button>
            )}
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

// Fenêtre d'ajout (sans `software`) ou de renommage d'un logiciel ; `children` est le bouton qui l'ouvre
function SoftwareDialog({ software, children }: { software?: Software; children: React.ReactNode }) {
    const { run, isPending } = useAction()
    const [open, setOpen] = useState(false)

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const name = String(new FormData(e.currentTarget).get("name"))
        run(() => (software ? renameSoftware(software.id, name) : addSoftware(name)), () => setOpen(false))
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{software ? `Renommer ${software.name}` : "Ajouter un logiciel"}</DialogTitle>
                    <DialogDescription>
                        {software
                            ? "Le nouveau nom est aussi appliqué aux notes existantes."
                            : "Sans logo importé, le logo Ianord est utilisé. Seuls les logiciels avec un logo 3D apparaissent sur la page de garde du PDF."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label htmlFor="software-name" className="text-sm font-medium">Nom</label>
                        <Input id="software-name" name="name" defaultValue={software?.name} placeholder="ex : WebPlanning" required autoFocus />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" tooltip="Fermer sans enregistrer" onClick={() => setOpen(false)}>Annuler</Button>
                        <Button type="submit" disabled={isPending} tooltip={software ? "Enregistrer le nouveau nom" : "Ajouter ce logiciel à la liste"}>
                            {isPending ? "Enregistrement…" : software ? "Renommer" : "Ajouter le logiciel"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function SoftwareRow({ software, isFirst, isLast }: { software: Software; isFirst: boolean; isLast: boolean }) {
    const { run, isPending } = useAction()

    return (
        <TableRow>
            <TableCell className="pl-4">
                <div className="flex">
                    <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isPending || isFirst} tooltip="Monter dans la liste"
                        onClick={() => run(() => moveSoftware(software.id, -1))}>
                        <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isPending || isLast} tooltip="Descendre dans la liste"
                        onClick={() => run(() => moveSoftware(software.id, 1))}>
                        <ArrowDown className="h-4 w-4" />
                    </Button>
                </div>
            </TableCell>
            <TableCell className="font-medium">{software.name}</TableCell>
            <TableCell><LogoCell software={software} kind="plat" /></TableCell>
            <TableCell><LogoCell software={software} kind="3d" /></TableCell>
            <TableCell className="pr-6">
                <div className="flex justify-end gap-1">
                    <SoftwareDialog software={software}>
                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isPending} tooltip="Renommer le logiciel">
                            <Pencil className="h-4 w-4" />
                        </Button>
                    </SoftwareDialog>
                    <ConfirmDialog
                        title={`Supprimer ${software.name} ?`}
                        description="Les notes existantes le garderont, avec le logo Ianord."
                        onConfirm={() => run(() => deleteSoftware(software.id))}
                    >
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" disabled={isPending} tooltip="Supprimer le logiciel">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </ConfirmDialog>
                </div>
            </TableCell>
        </TableRow>
    )
}

export function SoftwaresPanel({ softwares }: { softwares: Software[] }) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {softwares.length} logiciel{softwares.length !== 1 ? "s" : ""} · cliquez sur un logo pour le remplacer
                </p>
                <SoftwareDialog>
                    <Button tooltip="Ajouter un logiciel à la liste"><Plus className="h-4 w-4" />Ajouter un logiciel</Button>
                </SoftwareDialog>
            </div>

            <Card className="py-0 overflow-hidden">
                {softwares.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-10">Aucun logiciel pour l&apos;instant.</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-6 w-24">Ordre</TableHead>
                                <TableHead>Logiciel</TableHead>
                                <TableHead>
                                    Logo à plat
                                    <span className="block text-xs font-normal text-muted-foreground">Accueil, en-têtes du PDF</span>
                                </TableHead>
                                <TableHead>
                                    Logo 3D
                                    <span className="block text-xs font-normal text-muted-foreground">Page de garde du PDF</span>
                                </TableHead>
                                <TableHead className="pr-6 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {softwares.map((s, i) => (
                                <SoftwareRow key={s.id} software={s} isFirst={i === 0} isLast={i === softwares.length - 1} />
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Card>
        </div>
    )
}
