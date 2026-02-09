"use client" // CETTE LIGNE EST VITALE

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

export function PrintButton() {
    return (
        <Button
            onClick={() => window.print()} // L'interactivité est isolée ici
        >
            <Printer className="h-4 w-4" /> Exporter en PDF
        </Button>
    )
}