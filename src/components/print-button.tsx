"use client"

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

export function PrintButton() {
    return (
        <Button tooltip="Ouvrir l'impression pour enregistrer la note en PDF" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Exporter en PDF
        </Button>
    )
}
