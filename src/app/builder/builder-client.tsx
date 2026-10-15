"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Controller, useFieldArray, useForm, useWatch, type UseFormReturn } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { ArrowLeft, Calendar as CalendarIcon, Plus, PlusCircle, Save, Trash2 } from "lucide-react"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

const emptySection = { name: "", features: [], fixes: [] }

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
    return `${software} : sélectionner le logiciel`
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
            sections: [emptySection],
        },
    })

    const { fields, append, remove } = useFieldArray({ control: form.control, name: "sections" })
    // On mémorise les sections fermées : toutes sont ouvertes par défaut, y compris celles ajoutées ensuite
    const [closedSections, setClosedSections] = useState<string[]>([])

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
        <div className="py-10 pb-60">
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Colonne de gauche : Informations générales */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader><CardTitle>Informations Générales</CardTitle></CardHeader>
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
                </div>

                {/* Colonne de droite : Logiciels impactés */}
                <div className="space-y-4">
                    <Accordion
                        type="multiple"
                        className="w-full space-y-4"
                        value={fields.map(f => f.id).filter(id => !closedSections.includes(id))}
                        onValueChange={open => setClosedSections(fields.map(f => f.id).filter(id => !open.includes(id)))}
                    >
                        {fields.map((field, index) => {
                            const name = sections?.[index]?.name
                            return (
                                <AccordionItem key={field.id} value={field.id} className="border rounded-lg bg-white px-4">
                                    <AccordionTrigger className="hover:no-underline py-4 font-bold">
                                        {name || <span className="text-muted-foreground italic font-normal">Nouveau logiciel (à sélectionner)</span>}
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-4 space-y-6">
                                        <Controller
                                            control={form.control}
                                            name={`sections.${index}.name`}
                                            render={({ field }) => (
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <SelectTrigger className="mb-4 w-full">
                                                        <SelectValue placeholder="Sélectionner le logiciel impacté" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {withCurrent(softwareNames, field.value).map(s => (
                                                            <SelectItem key={s} value={s}>
                                                                {/* eslint-disable-next-line @next/next/no-img-element -- logos servis depuis la base */}
                                                                <img src={findSoftware(s)?.logoFlat?.url ?? DEFAULT_LOGO} alt="" className="h-4 w-4 object-contain" />
                                                                {s}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {/* Champ version Tablette — visible uniquement si "Tablette" est sélectionné */}
                                        {name === "Tablette" && (
                                            <div className="mb-4 space-y-2">
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
                                        <Button variant="destructive" size="lg" className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 mt-4 w-full" onClick={() => remove(index)}>
                                            <Trash2 className="mr-2 h-4 w-4" /> Supprimer ce logiciel
                                        </Button>
                                    </AccordionContent>
                                </AccordionItem>
                            )
                        })}
                    </Accordion>

                    <Button
                        variant="outline"
                        className="w-full py-8 border-dashed border-2 flex flex-col gap-2 h-auto text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5"
                        onClick={() => append(emptySection)}
                    >
                        <PlusCircle className="h-6 w-6" />
                        <span className="font-semibold">Ajouter un logiciel impacté</span>
                    </Button>
                </div>
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
