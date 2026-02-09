import * as z from "zod";

export const ItemSchema = z.object({
    text: z.string().min(1, "Le contenu est requis"),
    annexe: z.string().optional(),
});

export const SoftwareSchema = z.object({
    name: z.string().min(1, "Nom requis"), // Utilise string ici pour plus de souplesse au début
    features: z.array(ItemSchema).default([]),
    fixes: z.array(ItemSchema).default([]),
});

export const PatchNoteSchema = z.object({
    date: z.any(), // Utilise z.any() temporairement pour éviter le conflit Date/String de l'input
    intro: z.string().min(10, "L'introduction est trop courte"),
    author: z.string().min(1, "L'auteur est requis"),
    sections: z.array(SoftwareSchema).min(1, "Au moins un logiciel doit être sélectionné"),
});

// CETTE LIGNE EST CRUCIALE
export type PatchNoteValues = z.infer<typeof PatchNoteSchema>;