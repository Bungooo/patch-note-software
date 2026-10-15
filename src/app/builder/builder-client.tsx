"use client"

import { Fragment, useState } from "react"
import { useRouter } from "next/navigation"
import { Controller, useFieldArray, useForm, useWatch, type UseFormReturn } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { ArrowDown, ArrowLeft, ArrowUp, Calendar as CalendarIcon, Check, GripVertical, Plus, PlusCircle, Save, Trash2 } from "lucide-react"
import { PatchNoteSchema, type PatchNoteValues } from "@/lib/schema"
import { fullName, type Member, type PatchNote, type Software } from "@/lib/types"
import { cn, parseLocalDate } from "@/lib/utils"
import { DEFAULT_LOGO, softwareFinder } from "@/lib/logos"
import { savePatchNote, deletePatchNote } from "./actions"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Ajoute la valeur courante si elle n'existe plus dans la liste (membre ou logiciel supprimé depuis)
const withCurrent = (options: string[], current?: string) =>
    current && !options.includes(current) ? [...options, current] : options

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? "s" : ""}`

function StepTitle({ step, children }: { step: number; children: React.ReactNode }) {
    return (
        <CardTitle className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">{step}</span>
            {children}
        </CardTitle>
    )
}

// Traduit une erreur de validation en action à faire, en nommant le logiciel concerné
function describeIssue(path: PropertyKey[], sections: PatchNoteValues["sections"]) {
    const [field, i, list, j] = path
    if (field === "author") return "Choisir l'auteur"
    if (field === "date") return "Choisir la date de MEP"
    if (field === "intro") return "Écrire une introduction (10 caractères minimum)"
    if (typeof i !== "number") return "Ajouter au moins un logiciel"
    const software = sections[i]?.name || `Logiciel n°${i + 1}`
    if (list === "features") return `${software} : remplir ou supprimer la nouveauté n°${Number(j) + 1}`
    if (list === "fixes") return `${software} : remplir ou supprimer le correctif n°${Number(j) + 1}`
    return `${software} : à compléter`
}

export default function BuilderClient({ note, members, softwares }: {
    note: PatchNote | null
    members: Member[]
    softwares: Software[]
}) {
    const router = useRouter()
    const [showExitAlert, setShowExitAlert] = useState(false)

    const form = useForm<PatchNoteValues>({
        resolver: zodResolver(PatchNoteSchema),
        defaultValues: note ?? {
            date: new Date().toLocaleDateString("en-CA"), // format YYYY-MM-DD en heure locale
            intro: "",
            author: "",
            sections: [],
        },
    })

    const { fields, append, remove, move } = useFieldArray({ control: form.control, name: "sections" })
    // On mémorise les sections fermées : toutes sont ouvertes par défaut, y compris celles ajoutées ensuite
    const [closedSections, setClosedSections] = useState<string[]>([])
    // Glisser-déposer des blocs logiciels (les flèches restent pour le clavier)
    const [dragFrom, setDragFrom] = useState<number | null>(null)
    const [dragOver, setDragOver] = useState<number | null>(null)
    const endDrag = () => { setDragFrom(null); setDragOver(null) }

    const handleBack = () => {
        if (form.formState.isDirty) setShowExitAlert(true)
        else router.back()
    }

    const onSubmit = async (data: PatchNoteValues) => {
        const result = await savePatchNote(data, note?.id)
        if (result.success) {
            router.refresh()
            router.back()
        } else {
            toast.error("Erreur lors de l'enregistrement : " + result.error)
        }
    }

    const onDelete = async () => {
        if (!note) return
        const result = await deletePatchNote(note.id)
        if (result.success) router.replace("/") // replace : pas de retour possible vers la note supprimée
        else toast.error("Erreur lors de la suppression : " + result.error)
    }

    const { isSubmitting } = form.formState
    const values = useWatch({ control: form.control }) as PatchNoteValues
    const sections = values.sections ?? []
    // Ce qu'il reste à faire avant de pouvoir enregistrer, affiché au survol du bouton
    const todo = [...new Set(
        (PatchNoteSchema.safeParse(values).error?.issues ?? []).map(issue => describeIssue(issue.path, sections))
    )]
    const authorOptions = withCurrent(members.map(fullName), note?.author)
    const softwareNames = softwares.map(s => s.name)
    // Logiciels proposés, plus ceux d'une ancienne note supprimés depuis des paramètres
    const softwareOptions = [...softwareNames, ...sections.map(s => s.name).filter(n => n && !softwareNames.includes(n))]
    const findSoftware = softwareFinder(softwares)

    const saveButton = (size?: "lg") => {
        const button = (
            <Button onClick={form.handleSubmit(onSubmit)} size={size} disabled={todo.length > 0 || isSubmitting}>
                <Save className="h-4 w-4" />Enregistrer
            </Button>
        )
        if (todo.length === 0) return button
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    {/* Un bouton désactivé ne réagit pas au survol : l'info-bulle est portée par ce conteneur */}
                    <span tabIndex={0} className="inline-flex">{button}</span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                    <p className="font-medium mb-1">Pour enregistrer :</p>
                    <ul className="list-disc pl-4 space-y-0.5">
                        {todo.map(t => <li key={t}>{t}</li>)}
                    </ul>
                </TooltipContent>
            </Tooltip>
        )
    }

    return (
        <div className="mx-auto max-w-3xl py-10 pb-60">
            <div className="flex justify-between items-center mb-8">
                <Button variant="ghost" onClick={handleBack}><ArrowLeft className="h-4 w-4" />Retour</Button>
                <div className="flex items-center gap-2">
                    {note && (
                        <ConfirmDialog title="Supprimer cette note ?" description="Cette action est définitive." onConfirm={onDelete}>
                            <Button variant="destructive">
                                <Trash2 className="h-4 w-4" />
                                Supprimer la note
                            </Button>
                        </ConfirmDialog>
                    )}
                    {saveButton()}
                </div>
            </div>
            <h1 className="mb-8 text-3xl font-bold tracking-tight">
                {note ? "Modifier la note" : "Nouvelle note"}
            </h1>

            <div className="space-y-6">
                <Card>
                    <CardHeader><StepTitle step={1}>Informations</StepTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 flex flex-col">
                                <label htmlFor="author" className="text-sm font-medium">Auteur</label>
                                <Controller
                                    control={form.control}
                                    name="author"
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger id="author" className="w-full">
                                                <SelectValue placeholder="Sélectionner l'auteur" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {authorOptions.map(name => {
                                                    const role = members.find(m => fullName(m) === name)?.role
                                                    return (
                                                        <SelectItem key={name} value={name}>
                                                            <span>{name}</span>
                                                            {role && <span className="ml-2 text-xs text-muted-foreground">{role}</span>}
                                                        </SelectItem>
                                                    )
                                                })}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {members.length === 0 && (
                                    <p className="text-xs text-muted-foreground">Ajoutez des collaborateurs dans les paramètres.</p>
                                )}
                            </div>
                            <div className="space-y-2 flex flex-col">
                                <label htmlFor="date" className="text-sm font-medium">Date de MEP</label>
                                <Controller
                                    control={form.control}
                                    name="date"
                                    render={({ field }) => (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    id="date"
                                                    variant="outline"
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {field.value
                                                        ? format(parseLocalDate(field.value), "PPP", { locale: fr })
                                                        : <span>Choisir une date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value ? parseLocalDate(field.value) : undefined}
                                                    onSelect={(date) => date && field.onChange(format(date, "yyyy-MM-dd"))}
                                                    autoFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                />
                            </div>
                        </div>
                        <div className="space-y-2 flex flex-col">
                            <label htmlFor="intro" className="text-sm font-medium">Introduction</label>
                            <Textarea id="intro" {...form.register("intro")} className="min-h-[100px]" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <StepTitle step={2}>Logiciels concernés</StepTitle>
                        <CardDescription>Cliquez sur les logiciels touchés par cette mise à jour.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {softwareOptions.map(name => {
                            const index = sections.findIndex(s => s.name === name)
                            const section = sections[index]
                            const lines = section ? section.features.length + section.fixes.length : 0
                            const tile = (
                                <button
                                    type="button"
                                    aria-pressed={index !== -1}
                                    // Avec du contenu, le clic ouvre la confirmation (ConfirmDialog) au lieu de retirer directement
                                    onClick={lines ? undefined : () => (index === -1 ? append({ name, features: [], fixes: [] }) : remove(index))}
                                    className={cn(
                                        "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                                        index !== -1 ? "border-primary bg-primary/5 font-medium" : "hover:bg-slate-50"
                                    )}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element -- logos servis depuis la base */}
                                    <img src={findSoftware(name)?.logoFlat?.url ?? DEFAULT_LOGO} alt="" className="h-5 w-5 object-contain" />
                                    <span className="flex-1 truncate">{name}</span>
                                    {index !== -1 && <Check className="h-4 w-4 text-primary" />}
                                </button>
                            )
                            return lines ? (
                                <ConfirmDialog
                                    key={name}
                                    title={`Retirer ${name} ?`}
                                    description={`Ses ${lines} ligne${lines > 1 ? "s" : ""} (nouveautés et correctifs) seront supprimées.`}
                                    onConfirm={() => remove(index)}
                                >
                                    {tile}
                                </ConfirmDialog>
                            ) : <Fragment key={name}>{tile}</Fragment>
                        })}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <StepTitle step={3}>Contenu</StepTitle>
                        <CardDescription>
                            Glissez les logiciels par la poignée ⋮⋮ (ou utilisez les flèches ↑↓) pour régler leur ordre dans le PDF.
                            Astuce : collez une liste (Notion, Word…) dans un champ, chaque ligne devient une entrée. Le gras est conservé.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {fields.length === 0 ? (
                            <p className="py-6 text-center text-sm text-muted-foreground">Sélectionnez au moins un logiciel à l&apos;étape 2.</p>
                        ) : (
                            <Accordion
                                type="multiple"
                                className="w-full space-y-3"
                                value={fields.map(f => f.id).filter(id => !closedSections.includes(id))}
                                onValueChange={open => setClosedSections(fields.map(f => f.id).filter(id => !open.includes(id)))}
                            >
                                {fields.map((field, index) => {
                                    const section = sections[index]
                                    const name = section?.name ?? ""
                                    return (
                                        <AccordionItem
                                            key={field.id}
                                            value={field.id}
                                            className={cn(
                                                "relative border rounded-lg px-4",
                                                dragFrom === index && "opacity-50"
                                            )}
                                            onDragOver={e => {
                                                if (dragFrom === null) return
                                                e.preventDefault()
                                                setDragOver(index)
                                            }}
                                            onDrop={e => {
                                                e.preventDefault()
                                                if (dragFrom !== null && dragFrom !== index) move(dragFrom, index)
                                                endDrag()
                                            }}
                                        >
                                            {/* Ligne d'insertion : au-dessus en remontant, en dessous en descendant */}
                                            {dragFrom !== null && dragOver === index && dragFrom !== index && (
                                                <div
                                                    aria-hidden
                                                    className={cn(
                                                        "pointer-events-none absolute inset-x-0 h-0.5 rounded-full bg-primary",
                                                        dragFrom < index ? "-bottom-[7px]" : "-top-[7px]"
                                                    )}
                                                />
                                            )}
                                            <div className="flex items-center gap-1 [&>h3]:flex-1">
                                                <span
                                                    draggable
                                                    title="Glisser pour déplacer"
                                                    className="-ml-2 cursor-grab p-1 text-muted-foreground active:cursor-grabbing"
                                                    onDragStart={e => {
                                                        setDragFrom(index)
                                                        e.dataTransfer.effectAllowed = "move"
                                                        // On fait glisser tout le bloc, pas seulement la poignée
                                                        const item = e.currentTarget.closest("[data-slot=accordion-item]")
                                                        if (item) e.dataTransfer.setDragImage(item, 16, 16)
                                                    }}
                                                    onDragEnd={endDrag}
                                                >
                                                    <GripVertical className="h-4 w-4" />
                                                </span>
                                                <AccordionTrigger className="hover:no-underline py-4">
                                                    <span className="flex flex-1 items-center gap-2">
                                                        {/* eslint-disable-next-line @next/next/no-img-element -- logos servis depuis la base */}
                                                        <img src={findSoftware(name)?.logoFlat?.url ?? DEFAULT_LOGO} alt="" className="h-5 w-5 object-contain" />
                                                        <span className="font-bold">{name}</span>
                                                        <span className="ml-auto mr-2 text-xs font-normal text-muted-foreground">
                                                            {plural(section?.features.length ?? 0, "nouveauté")} · {plural(section?.fixes.length ?? 0, "correctif")}
                                                        </span>
                                                    </span>
                                                </AccordionTrigger>
                                                {/* L'ordre des blocs est celui du PDF */}
                                                <Button variant="ghost" size="icon" className="h-8 w-8" title="Monter" aria-label={`Monter ${name}`}
                                                    disabled={index === 0} onClick={() => move(index, index - 1)}>
                                                    <ArrowUp className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" title="Descendre" aria-label={`Descendre ${name}`}
                                                    disabled={index === fields.length - 1} onClick={() => move(index, index + 1)}>
                                                    <ArrowDown className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                            <AccordionContent className="pt-2 space-y-6">
                                                {/* Champ version Tablette — visible uniquement si "Tablette" est sélectionné */}
                                                {name === "Tablette" && (
                                                    <div className="space-y-2">
                                                        <label htmlFor={`tablet-version-${index}`} className="text-sm font-medium text-slate-700">
                                                            Numéro de version de la tablette
                                                        </label>
                                                        <Input
                                                            id={`tablet-version-${index}`}
                                                            {...form.register(`sections.${index}.tabletVersion`)}
                                                            placeholder="ex : 2.4.1"
                                                            className="w-full"
                                                        />
                                                    </div>
                                                )}
                                                <ItemList form={form} name={`sections.${index}.features`} label="Nouveautés" color="text-green-600" />
                                                <Separator />
                                                <ItemList form={form} name={`sections.${index}.fixes`} label="Correctifs" color="text-orange-600" />
                                            </AccordionContent>
                                        </AccordionItem>
                                    )
                                })}
                            </Accordion>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end pt-4 mt-8">{saveButton("lg")}</div>

            <AlertDialog open={showExitAlert} onOpenChange={setShowExitAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Voulez-vous vraiment quitter ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Vous avez des modifications non enregistrées. Si vous quittez maintenant, elles seront perdues.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => router.back()} className="bg-slate-700 hover:bg-slate-600">
                            Quitter sans sauvegarder
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

// Découpe un collage (texte ou HTML) en une entrée par ligne / élément de liste, en ne gardant que le gras
function parsePaste(html: string, text: string): string[] {
    const lines = (s: string) => s.split("\n").map(l => l.trim()).filter(Boolean)
    if (!html) return lines(text)

    const cleanNode = (node: Node): string => {
        if (node.nodeType === Node.TEXT_NODE) return node.textContent || ""
        if (node.nodeType !== Node.ELEMENT_NODE) return ""

        const tag = (node as HTMLElement).tagName.toLowerCase()
        if (tag === "br") return "\n"

        const content = Array.from(node.childNodes).map(cleanNode).join("")
        if (tag === "b" || tag === "strong") return `<b>${content}</b>`
        if (tag === "li" || tag === "div" || tag === "p") return content + "\n"
        return content
    }

    const body = new DOMParser().parseFromString(html, "text/html").body
    const items = body.querySelectorAll("ul > li, ol > li")
    if (items.length > 0) return Array.from(items).map(li => cleanNode(li).trim()).filter(Boolean)
    return lines(cleanNode(body))
}

function ItemList({ form, name, label, color }: {
    form: UseFormReturn<PatchNoteValues>
    name: `sections.${number}.features` | `sections.${number}.fixes`
    label: string
    color: string
}) {
    const { fields, append, remove } = useFieldArray({ control: form.control, name })

    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>, index: number) => {
        const html = e.clipboardData.getData("text/html")
        const text = e.clipboardData.getData("text/plain")
        // Collage simple d'une seule ligne de texte brut : comportement natif
        if (!html && !text.includes("\n")) return

        e.preventDefault()
        const [first, ...rest] = parsePaste(html, text)
        if (first === undefined) return

        form.setValue(`${name}.${index}.text`, first, { shouldDirty: true, shouldValidate: true })
        rest.forEach(line => append({ text: line }))
    }

    return (
        <div className="space-y-3">
            <h4 className={cn("font-semibold text-sm flex items-center gap-2", color)}><PlusCircle className="h-4 w-4" /> {label}</h4>
            {fields.map((field, idx) => (
                <div key={field.id} className="flex gap-2 items-start group pl-4">
                    <Textarea
                        {...form.register(`${name}.${idx}.text`)}
                        className="min-h-[40px] text-sm bg-slate-50/50"
                        onPaste={(e) => handlePaste(e, idx)}
                    />
                    <Button variant="destructive" className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700" size="icon" onClick={() => remove(idx)}><Trash2 className="h-4 w-4" /></Button>
                </div>
            ))}
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 ml-4" onClick={() => append({ text: "" })}><Plus className="h-4 w-4" />Ajouter une ligne</Button>
        </div>
    )
}
