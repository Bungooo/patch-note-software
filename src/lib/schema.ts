import * as z from "zod"

export const ItemSchema = z.object({
    text: z.string().min(1, "Le contenu est requis"),
    annexe: z.string().optional(),
})

export const SoftwareSchema = z.object({
    name: z.string().min(1, "Nom requis"),
    features: z.array(ItemSchema),
    fixes: z.array(ItemSchema),
    tabletVersion: z.string().optional(), // Numéro de version, utilisé uniquement pour la Tablette
})

export const PatchNoteSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date requise"),
    intro: z.string().min(10, "L'introduction est trop courte"),
    author: z.string().min(1, "L'auteur est requis"),
    sections: z.array(SoftwareSchema).min(1, "Au moins un logiciel doit être sélectionné"),
})

export type PatchNoteValues = z.infer<typeof PatchNoteSchema>
