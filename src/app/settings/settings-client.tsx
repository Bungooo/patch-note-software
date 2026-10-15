"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Member, Software } from "@/lib/types"
import { MembersPanel } from "./members-panel"
import { SoftwaresPanel } from "./softwares-panel"

export function SettingsClient({ members, softwares }: { members: Member[]; softwares: Software[] }) {
    return (
        <div className="py-10 max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="icon" tooltip="Revenir à l'accueil" asChild>
                    <Link href="/"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
                    <p className="text-sm text-muted-foreground mt-1">Gérez l&apos;équipe et les logiciels</p>
                </div>
            </div>

            <Tabs defaultValue="members">
                <TabsList className="mb-6">
                    <TabsTrigger value="members">Collaborateurs</TabsTrigger>
                    <TabsTrigger value="softwares">Logiciels</TabsTrigger>
                </TabsList>
                <TabsContent value="members"><MembersPanel members={members} /></TabsContent>
                <TabsContent value="softwares"><SoftwaresPanel softwares={softwares} /></TabsContent>
            </Tabs>
        </div>
    )
}
