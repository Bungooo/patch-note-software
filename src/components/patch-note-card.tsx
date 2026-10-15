import Link from "next/link"
import { Printer, Pencil } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { uniqueLogos } from "@/lib/logos"
import { formatDate } from "@/lib/utils"
import type { PatchNote, Software } from "@/lib/types"

export function PatchNoteCard({ note, softwares }: { note: PatchNote; softwares: Software[] }) {
    // Logos à plat de chaque logiciel ; ceux sans logo sont regroupés derrière un seul logo Ianord
    const logos = uniqueLogos(note.sections.map(s => s.name), softwares, "logoFlat", true)

    return (
        <Card className="flex flex-col h-full">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-xl font-bold">
                        {formatDate(note.date)}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Par {note.author}</p>
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
            <CardContent className="flex-1 py-2">
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {note.intro || "Aucune introduction disponible."}
                </p>
            </CardContent>
            <CardFooter className="flex gap-2">
                <Button variant="outline" className="flex-1" asChild>
                    <Link href={`/builder?id=${note.id}`}><Pencil className="h-4 w-4" />Éditer</Link>
                </Button>
                <Button variant="outline" className="flex-1" asChild>
                    <Link href={`/note/${note.id}`}><Printer className="h-4 w-4" />Imprimer</Link>
                </Button>
            </CardFooter>
        </Card>
    )
}
