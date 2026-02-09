"use client"

import { useState } from "react"

import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { PatchNoteSchema, type PatchNoteValues } from "../../lib/schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Trash2, Plus, PlusCircle, Save, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { savePatchNote, deletePatchNote } from "./actions"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Controller } from "react-hook-form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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

export default function BuilderClient({ initialData }: { initialData?: any }) {
    const router = useRouter()
    const [showExitAlert, setShowExitAlert] = useState(false)

    // Gestion du retour avec confirmation si données non sauvegardées
    const handleBack = () => {
        if (form.formState.isDirty) {
            setShowExitAlert(true)
        } else {
            router.back()
        }
    }

    const form = useForm<PatchNoteValues>({
        resolver: zodResolver(PatchNoteSchema) as any,
        defaultValues: initialData ? {
            ...initialData,
            // On récupère l'année, le mois et le jour sans conversion UTC
            date: (() => {
                const d = new Date(initialData.date);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            })() as any
        } : {
            // Date du jour locale au format YYYY-MM-DD
            date: new Date().toLocaleDateString('en-CA'), // Astuce : le format Canadien est YYYY-MM-DD
            intro: "",
            author: "",
            sections: [{ name: "" as any, features: [], fixes: [] }]
        }
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "sections"
    })

    const onSubmit = async (data: PatchNoteValues) => {
        // On envoie les données ET l'ID (si présent) pour faire un UPDATE
        const result = await savePatchNote(data, initialData?.id)
        if (result.success) {
            router.refresh()
            router.back()
        } else {
            alert("Erreur Neon : " + result.error)
        }
    }

    const { isValid, isSubmitting } = form.formState

    return (
        <div className="py-10 pb-60">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={handleBack}><ArrowLeft className="h-4 w-4" />Retour</Button>
                </div>
                <div className="flex items-center gap-2">
                    {initialData && (
                        <Button
                            variant="destructive"
                            type="button"
                            onClick={async () => {
                                if (confirm("Êtes-vous sûr de vouloir supprimer cette note ?")) {
                                    const result = await deletePatchNote(initialData.id)
                                    if (result.success) {
                                        router.replace("/") // Use replace to avoid back navigation to deleted note
                                    } else {
                                        alert("Erreur lors de la suppression : " + result.error)
                                    }
                                }
                            }}
                        >
                            <Trash2 className="h-4 w-4" />
                            Supprimer la note
                        </Button>
                    )}
                    <Button onClick={form.handleSubmit(onSubmit)} disabled={!isValid || isSubmitting}>
                        <Save className="h-4 w-4" />Enregistrer
                    </Button>
                </div>
            </div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">
                    {initialData ? "Modifier la note" : "Nouvelle note"}
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Colonne de gauche : Informations générales */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader><CardTitle>Informations Générales</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 flex flex-col">
                                    <label className="text-sm font-medium">Auteur</label>
                                    <Controller
                                        control={form.control}
                                        name="author"
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Sélectionner l'auteur" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Guillaume DELEUZE">Guillaume DELEUZE</SelectItem>
                                                    <SelectItem value="Guillaume MAUFROID">Guillaume MAUFROID</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                                <div className="space-y-2 flex flex-col">
                                    <label className="text-sm font-medium">Date de MEP</label>
                                    <Controller
                                        control={form.control}
                                        name="date"
                                        render={({ field }) => (
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full justify-start text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {field.value ? (
                                                            format(new Date(field.value), "PPP", { locale: fr })
                                                        ) : (
                                                            <span>Choisir une date</span>
                                                        )}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value ? new Date(field.value) : undefined}
                                                        onSelect={(date) => {
                                                            if (date) {
                                                                // Astuce pour garder la date locale sans le décalage UTC
                                                                const offset = date.getTimezoneOffset()
                                                                const localDate = new Date(date.getTime() - (offset * 60 * 1000))
                                                                field.onChange(localDate.toISOString().split('T')[0])
                                                            }
                                                        }}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        )}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2 flex flex-col">
                                <label className="text-sm font-medium">Introduction</label>
                                <Textarea {...form.register("intro")} className="min-h-[100px]" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Colonne de droite : Logiciels impactés */}
                <div className="space-y-4">
                    <Accordion type="multiple" className="w-full space-y-4" defaultValue={fields.map(field => field.id)}>
                        {fields.map((field, index) => (
                            <AccordionItem key={field.id} value={field.id} className="border rounded-lg bg-white px-4">
                                <AccordionTrigger className="hover:no-underline py-4 font-bold">
                                    {form.watch(`sections.${index}.name`) || <span className="text-muted-foreground italic font-normal">Nouveau logiciel (à sélectionner)</span>}
                                </AccordionTrigger>
                                <AccordionContent className="pt-4 space-y-6">
                                    <Controller
                                        control={form.control}
                                        name={`sections.${index}.name`}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <SelectTrigger className="mb-4 w-full">
                                                    <SelectValue placeholder="Sélectionner le logiciel impacté" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="WebGerest">WebGerest</SelectItem>
                                                    <SelectItem value="WebHoraire">WebHoraire</SelectItem>
                                                    <SelectItem value="WebResto">WebResto</SelectItem>
                                                    <SelectItem value="Tarification – Famille">Tarification – Famille</SelectItem>
                                                    <SelectItem value="Tarification – Gestionnaire">Tarification – Gestionnaire</SelectItem>
                                                    <SelectItem value="Inscription – Gestionnaire">Inscription – Gestionnaire</SelectItem>
                                                    <SelectItem value="Réservation">Réservation</SelectItem>
                                                    <SelectItem value="BO">BO</SelectItem>
                                                    <SelectItem value="CFA">CFA</SelectItem>
                                                    <SelectItem value="Back">Back</SelectItem>
                                                    <SelectItem value="Autre">Autre</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    <ItemList nestName={`sections.${index}.features`} form={form} label="Nouveautés" color="text-green-600" />
                                    <Separator />
                                    <ItemList nestName={`sections.${index}.fixes`} form={form} label="Correctifs" color="text-orange-600" />
                                    <Button variant="destructive" size="lg" className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 mt-4 w-full" onClick={() => remove(index)}>
                                        <Trash2 className="mr-2 h-4 w-4" /> Supprimer ce logiciel
                                    </Button>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>

                    <Button
                        variant="outline"
                        className="w-full py-8 border-dashed border-2 flex flex-col gap-2 h-auto text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5"
                        onClick={() => append({ name: "" as any, features: [], fixes: [] })}
                    >
                        <PlusCircle className="h-6 w-6" />
                        <span className="font-semibold">Ajouter un logiciel impacté</span>
                    </Button>
                </div>
            </div>

            <div className="flex justify-end pt-4 mt-8">
                <Button onClick={form.handleSubmit(onSubmit)} size="lg" disabled={!isValid || isSubmitting}>
                    <Save className="h-4 w-4" />Enregistrer
                </Button>
            </div>

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

function ItemList({ nestName, form, label, color }: any) {
    const { fields, append, remove } = useFieldArray({ control: form.control, name: nestName });

    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>, currentIndex: number) => {
        const html = e.clipboardData.getData('text/html');
        const text = e.clipboardData.getData('text/plain');

        // Si pas de HTML ou pas de saut de ligne en texte brut, comportement par défaut (laisser faire sauf si on veut forcer le parsing)
        // Mais si on veut capter le gras même sur une seule ligne, il faut intercepter.
        // On intercepte tout s'il y a du HTML ou des sauts de ligne.
        if (!html && !text.includes('\n')) return;

        e.preventDefault();

        let entries: string[] = [];

        if (html) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const body = doc.body;

            // Fonction récursive pour nettoyer le noeud et ne garder que b/strong
            const cleanNode = (node: Node): string => {
                if (node.nodeType === Node.TEXT_NODE) {
                    return node.textContent || '';
                }
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const el = node as HTMLElement;
                    const tagName = el.tagName.toLowerCase();

                    if (tagName === 'br') return '\n';

                    let content = '';
                    el.childNodes.forEach(child => {
                        content += cleanNode(child);
                    });

                    if (tagName === 'b' || tagName === 'strong') {
                        return `<b>${content}</b>`;
                    }
                    if (tagName === 'li' || tagName === 'div' || tagName === 'p') {
                        // On ajoute un saut de ligne après les blocs pour separer ensuite
                        return content + '\n';
                    }
                    return content;
                }
                return '';
            };

            // Traitement spécifique si c'est une liste
            const lists = body.querySelectorAll('ul, ol');
            if (lists.length > 0) {
                lists.forEach(list => {
                    list.childNodes.forEach(item => {
                        if (item.nodeName === 'LI') {
                            entries.push(cleanNode(item).trim());
                        }
                    })
                });
            } else {
                // Sinon on parse tout le body
                const raw = cleanNode(body);
                entries = raw.split('\n').map(s => s.trim()).filter(s => s !== '');
            }
        } else {
            // Fallback texte brut
            entries = text.split('\n').map(line => line.trim()).filter(line => line !== "");
        }

        if (entries.length === 0) return;

        // Mise à jour de la ligne courante avec la première valeur
        const currentFieldName = `${nestName}.${currentIndex}.text`;
        form.setValue(currentFieldName, entries[0]);

        // Ajout des lignes suivantes
        entries.slice(1).forEach(line => {
            append({ text: line });
        });
    };

    return (
        <div className="space-y-3">
            <h4 className={`font-semibold text-sm flex items-center gap-2 ${color}`}><PlusCircle className="h-4 w-4" /> {label}</h4>
            {fields.map((field, idx) => (
                <div key={field.id} className="flex gap-2 items-start group pl-4">
                    <Textarea
                        {...form.register(`${nestName}.${idx}.text`)}
                        className="min-h-[40px] text-sm bg-slate-50/50"
                        onPaste={(e) => handlePaste(e, idx)}
                    />
                    <Button variant="destructive" className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700" size="icon" onClick={() => remove(idx)}><Trash2 className="h-4 w-4" /></Button>
                </div>
            ))}
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 ml-4" onClick={() => append({ text: "" })}><Plus className="h-4 w-4" />Ajouter une ligne</Button>
        </div>
    );
}