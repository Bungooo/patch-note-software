import type { Logo, Software } from "@/lib/types"

export const DEFAULT_LOGO = "/logo-defaut.svg"

// Associe le nom d'un logiciel (tel qu'enregistré dans une note) à sa fiche, sans tenir compte de la casse
export function softwareFinder(softwares: Software[]) {
    const byName = new Map(softwares.map(s => [s.name.trim().toLowerCase(), s]))
    return (name: string) => byName.get(name.trim().toLowerCase())
}

// Logos des logiciels d'une note, sans doublon (Tablette et WebGerest partagent le même logo par exemple).
// Les logiciels sans logo importé sont regroupés derrière un seul logo Ianord si `withDefault` est vrai.
export function uniqueLogos(
    names: string[],
    softwares: Software[],
    kind: "logo3d" | "logoFlat",
    withDefault: boolean,
) {
    const find = softwareFinder(softwares)
    const logos = new Map<string, { name: string; url: string }>()
    let hasDefault = false

    for (const name of names) {
        const logo: Logo | null | undefined = find(name)?.[kind]
        if (logo) {
            if (!logos.has(logo.hash)) logos.set(logo.hash, { name, url: logo.url })
        } else {
            hasDefault = true
        }
    }

    const result = [...logos.values()]
    if (withDefault && hasDefault) result.push({ name: "Autres modules", url: DEFAULT_LOGO })
    return result
}
