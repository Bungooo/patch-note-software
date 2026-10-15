"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { addMember, deleteMember, updateMember } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, UserPlus, Pencil } from "lucide-react"
import { useRouter } from "next/navigation"
import { fullName, type Member } from "@/lib/types"
import { ConfirmDialog } from "@/components/confirm-dialog"

// Fenêtre d'ajout (sans `member`) ou de modification d'un membre ; `children` est le bouton qui l'ouvre
function MemberDialog({ member, children }: { member?: Member; children: React.ReactNode }) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const data = new FormData(e.currentTarget)
        const [firstName, lastName, role] = ["firstName", "lastName", "role"].map(k => String(data.get(k)))
        startTransition(async () => {
            const result = member
                ? await updateMember(member.id, firstName, lastName, role)
                : await addMember(firstName, lastName, role)
            if (result.error) return void toast.error(result.error)
            setOpen(false)
            router.refresh()
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{member ? `Modifier ${fullName(member)}` : "Ajouter un membre"}</DialogTitle>
                    <DialogDescription>Le nom et le poste apparaissent comme auteur dans les notes et le PDF.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label htmlFor="member-first" className="text-sm font-medium">Prénom</label>
                            <Input id="member-first" name="firstName" defaultValue={member?.firstName} required autoFocus />
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="member-last" className="text-sm font-medium">Nom</label>
                            <Input id="member-last" name="lastName" defaultValue={member?.lastName} required />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label htmlFor="member-role" className="text-sm font-medium">Poste</label>
                        <Input id="member-role" name="role" defaultValue={member?.role} placeholder="ex : Développeur full-stack" required />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" tooltip="Fermer sans enregistrer" onClick={() => setOpen(false)}>Annuler</Button>
                        <Button type="submit" disabled={isPending} tooltip={member ? "Enregistrer les modifications" : "Ajouter ce membre à l'équipe"}>
                            {isPending ? "Enregistrement…" : member ? "Enregistrer" : "Ajouter le membre"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export function MembersPanel({ members }: { members: Member[] }) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const handleDelete = (m: Member) => {
        startTransition(async () => {
            await deleteMember(m.id)
            router.refresh()
        })
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{members.length} personne{members.length !== 1 ? "s" : ""}</p>
                <MemberDialog>
                    <Button tooltip="Ajouter un membre à l'équipe"><UserPlus className="h-4 w-4" />Ajouter un membre</Button>
                </MemberDialog>
            </div>

            <Card className="py-0 overflow-hidden">
                {members.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-10">Aucun membre pour l&apos;instant.</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-6">Membre</TableHead>
                                <TableHead>Poste</TableHead>
                                <TableHead className="pr-6 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {members.map(m => (
                                <TableRow key={m.id}>
                                    <TableCell className="pl-6">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-600">
                                                {`${m.firstName[0] ?? ""}${m.lastName[0] ?? ""}`.toUpperCase()}
                                            </div>
                                            <span className="font-medium">{fullName(m)}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{m.role}</TableCell>
                                    <TableCell className="pr-6">
                                        <div className="flex justify-end gap-1">
                                            <MemberDialog member={m}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isPending} tooltip="Modifier le membre">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            </MemberDialog>
                                            <ConfirmDialog title={`Supprimer ${fullName(m)} ?`} onConfirm={() => handleDelete(m)}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" disabled={isPending} tooltip="Supprimer le membre">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </ConfirmDialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Card>
        </div>
    )
}
