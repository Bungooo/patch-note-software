import Link from "next/link"
import { Printer, Pencil } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { uniqueLogos } from "@/lib/logos"
import { formatDate } from "@/lib/utils"
import type { PatchNote, Software } from "@/lib/types"

export function PatchNoteCard({ note, softwares }: { note: PatchNote; softwares: Software[] }) {
    // Logos à plat de chaque logiciel ; ceux sans logo sont regroupés derrière un seul logo Ianord
    const logos = uniqueLogos(note.sections.map(s => s.name), softwares, "logoFlat", true)

    return (
        <Card className="flex flex-col h-full gap-4">
            <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-bold">
                            {formatDate(note.date)}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">Par {note.author}</p>
                    </div>
                    <div className="flex gap-1 -mr-2 -mt-1">
                        <Button variant="ghost" size="icon" className="h-10 w-10" tooltip="Éditer la note" asChild>
                            <Link href={`/builder?id=${note.id}`} aria-label={`Éditer la note du ${formatDate(note.date)}`}>
                                <Pencil className="size-5" />
                            </Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-10 w-10" tooltip="Imprimer la note" asChild>
                            <Link href={`/note/${note.id}`} aria-label={`Imprimer la note du ${formatDate(note.date)}`}>
                                <Printer className="size-5" />
                            </Link>
                        </Button>
                    </div>
                </div>
                {logos.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {logos.map(logo => (
                            // eslint-disable-next-line @next/next/no-img-element -- SVG servis tels quels, sans optimisation
                            <img key={logo.url} src={logo.url} alt={logo.name} title={logo.name} className="h-8 w-auto object-contain" />
                        ))}
                    </div>
                )}
            </CardHeader>
            <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-3">
                    {note.intro || "Aucune introduction disponible."}
                </p>
            </CardContent>
        </Card>
    )
}
