import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

// Croix qui remplace le chevron d'un filtre actif ; posée sur le déclencheur
// (dans un parent `relative`) sans en faire partie, pour ne pas ouvrir le menu
export function FilterClear({ label, onClear }: { label: string; onClear: () => void }) {
    return (
        <Button
            variant="ghost"
            size="icon"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground hover:text-foreground"
            aria-label={label}
            title={label}
            onClick={onClear}
        >
            <X className="h-3.5 w-3.5" />
        </Button>
    )
}
