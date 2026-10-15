export type Item = { text: string; annexe?: string }

export type Section = {
    name: string
    features: Item[]
    fixes: Item[]
    tabletVersion?: string
}

export type PatchNote = {
    id: string
    date: string // YYYY-MM-DD
    intro: string
    author: string
    sections: Section[]
}

export type Member = { id: number; firstName: string; lastName: string; role: string }

export type Logo = { url: string; hash: string }

// Logo à null = logo Ianord par défaut
export type Software = { id: number; name: string; logo3d: Logo | null; logoFlat: Logo | null }

export const fullName = (m: Member) => `${m.firstName} ${m.lastName}`
