"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Printer, Pencil } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export type PatchNote = {
    id: string
    date: string
    author: string
    content: any // JSON type from DB
    intro?: string
}

// Helper for logo mapping
const getLogoPath = (softwareName: string) => {
    // Suppression du filtre "Web" pour tout afficher
    // if (!softwareName.startsWith("Web")) return null

    const map: Record<string, string> = {
        "WebGerest": "/logos/WebGerest.svg",
        "WebHoraire": "/logos/WebHoraire.svg",
        "WebResto": "/logos/WebResto.svg",
        "Tarification – Famille": "/logos/Tarification – Famille.svg",
        "Tarification – Gestionnaire": "/logos/Tarification – Gestionnaire.svg",
        "Inscription – Gestionnaire": "/logos/Inscription – Gestionnaire.svg",
        "Réservation": "/logos/Réservation.svg", // Attention à l'accent
        "BO": "/logos/BO.svg",
        "CFA": "/logos/CFA.svg",
        "Back": "/logos/Back.svg",
        "Autre": "/logos/Autre.svg"
    }
    // Match exact ou partiel si nécessaire (ici dictionnaire exact)
    return map[softwareName] || null
}

export function PatchNoteCard({ note }: { note: PatchNote }) {
    // Intro est une colonne directe en BDD, pas dans le JSON content
    const intro = note.intro || ""

    const router = useRouter()

    const handlePrint = () => {
        // Open the print view in the same tab
        router.push(`/note/${note.id}`)
    }

    // Extract unique software names for logos
    const sections = typeof note.content === 'string' ? JSON.parse(note.content) : note.content
    const softwareNames = Array.from(new Set(sections.map((s: any) => s.name))) as string[]

    return (
        <Card className="flex flex-col h-full">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-xl font-bold">
                        {new Date(note.date).toLocaleDateString('fr-FR')}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Par {note.author}</p>
                </div>
                {/* Logique d'affichage des logos : Tout les "Web..." + 1 seul générique pour le reste */}
                {(() => {
                    const logosToDisplay: { name: string, path: string }[] = [];
                    let hasOther = false;

                    softwareNames.forEach(name => {
                        const path = getLogoPath(name);
                        if (!path) return;

                        if (name.toLowerCase().startsWith('web')) {
                            logosToDisplay.push({ name, path });
                        } else {
                            hasOther = true;
                        }
                    });

                    // Si on a des logiciels "Autres", on ajoute une seule fois le logo générique
                    // On prend le logo "Autre" ou n'importe quel logo par défaut
                    if (hasOther) {
                        logosToDisplay.push({ name: "Autres modules", path: "/logos/Autre.svg" });
                    }

                    // Dédoublonnage final par path au cas où
                    const uniqueLogos = logosToDisplay.filter((item, index, self) =>
                        index === self.findIndex((t) => t.path === item.path)
                    );

                    if (uniqueLogos.length === 0) return null;

                    return (
                        <div className="flex flex-wrap gap-2">
                            {uniqueLogos.map((item) => (
                                <div key={item.name} className="relative h-6 w-auto" title={item.name}>
                                    <img src={item.path} alt={item.name} className="h-8 w-auto object-contain" />
                                </div>
                            ))}
                        </div>
                    );
                })()}
            </CardHeader>
            <CardContent className="flex-1 py-2">
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {intro || "Aucune introduction disponible."}
                </p>
            </CardContent>
            <CardFooter className="flex gap-2">
                <Link href={`/builder?id=${note.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                        <Pencil className="h-4 w-4" />
                        Éditer
                    </Button>
                </Link>
                <div className="flex-1">
                    <Button variant="outline" className="w-full" onClick={handlePrint}>
                        <Printer className="h-4 w-4" />
                        Imprimer
                    </Button>
                </div>
            </CardFooter>
        </Card>
    )
}
