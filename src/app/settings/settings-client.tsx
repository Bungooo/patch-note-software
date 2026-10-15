"use client"

import Link from "next/link"
import { ArrowLeft, Package, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Member, Software } from "@/lib/types"
import { MembersPanel } from "./members-panel"
import { SoftwaresPanel } from "./softwares-panel"

// Onglet du menu : survol gris clair, onglet actif à la teinte de sélection commune (sans le trait de l'onglet « line »)
const TAB = "h-9 px-3 hover:bg-accent after:hidden data-[state=active]:bg-primary/10! data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:hover:bg-primary/15!"

export function SettingsClient({ members, softwares }: { members: Member[]; softwares: Software[] }) {
    return (
        <div className="py-10">
            {/* -ml-3 : la flèche s'aligne sur le titre et le logo, malgré le padding du bouton */}
            <Button variant="ghost" className="-ml-3 mb-6" tooltip="Revenir à l'accueil" asChild>
                <Link href="/"><ArrowLeft className="h-4 w-4" />Retour</Link>
            </Button>
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
                <p className="text-sm text-muted-foreground mt-1">Gérez l&apos;équipe et les logiciels</p>
            </div>

            {/* Menu vertical à gauche, contenu à droite sur une largeur lisible */}
            <Tabs defaultValue="members" orientation="vertical" className="flex-col md:flex-row gap-8">
                {/* Menu dans une carte de la hauteur de l'écran (moins les marges), fixée pendant le défilement */}
                <div className="w-full md:w-52 shrink-0 self-start rounded-xl border bg-card p-2 md:sticky md:top-6 md:h-[calc(100vh-3rem)]">
                    <p className="px-3 pt-2 pb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Navigation</p>
                    <TabsList variant="line" className="w-full items-stretch p-0">
                        <TabsTrigger value="members" className={TAB}><Users />Collaborateurs</TabsTrigger>
                        <TabsTrigger value="softwares" className={TAB}><Package />Logiciels</TabsTrigger>
                    </TabsList>
                </div>
                <div className="flex-1 min-w-0 max-w-3xl">
                    <TabsContent value="members"><MembersPanel members={members} /></TabsContent>
                    <TabsContent value="softwares"><SoftwaresPanel softwares={softwares} /></TabsContent>
                </div>
            </Tabs>
        </div>
    )
}
