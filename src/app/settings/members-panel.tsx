"use client"

import { useId, useState, useTransition } from "react"
import { toast } from "sonner"
import { addMember, deleteMember, updateMember } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, UserPlus, User, Pencil, Check, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { fullName, type Member } from "@/lib/types"
import { ConfirmDialog } from "@/components/confirm-dialog"

// Composant pour une ligne de membre (vue normale + mode édition inline)
function MemberRow({ m, onDelete, isPending }: {
    m: Member
    onDelete: (m: Member) => void
    isPending: boolean
}) {
    const router = useRouter()
    const [editing, setEditing] = useState(false)
    const [editPending, startEditTransition] = useTransition()
    const [firstName, setFirstName] = useState(m.firstName)
    const [lastName, setLastName] = useState(m.lastName)
    const [role, setRole] = useState(m.role)
    const id = useId()

    const getInitials = (f: string, l: string) => `${f[0] ?? ""}${l[0] ?? ""}`.toUpperCase()

    const handleSave = () => {
        startEditTransition(async () => {
            const result = await updateMember(m.id, firstName, lastName, role)
            if (result.error) {
                toast.error(result.error)
            } else {
                setEditing(false)
                router.refresh()
            }
        })
    }

    const handleCancel = () => {
        setFirstName(m.firstName)
        setLastName(m.lastName)
        setRole(m.role)
        setEditing(false)
    }

    if (editing) {
        return (
            <li className="px-6 py-4 bg-slate-50/70 border-l-6">
                <div className="mb-6">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="space-y-1">
                            <label htmlFor={`${id}-first`} className="text-xs font-medium text-muted-foreground">Prénom</label>
                            <Input
                                id={`${id}-first`}
                                value={firstName}
                                onChange={e => setFirstName(e.target.value)}
                                className="h-8 text-sm"
                                autoFocus
                            />
                        </div>
                        <div className="space-y-1">
                            <label htmlFor={`${id}-last`} className="text-xs font-medium text-muted-foreground">Nom</label>
                            <Input
                                id={`${id}-last`}
                                value={lastName}
                                onChange={e => setLastName(e.target.value)}
                                className="h-8 text-sm"
                            />
                        </div>
                    </div>
                    <div className="space-y-1 mb-3">
                        <label htmlFor={`${id}-role`} className="text-xs font-medium text-muted-foreground">Poste</label>
                        <Input
                            id={`${id}-role`}
                            value={role}
                            onChange={e => setRole(e.target.value)}
                            className="h-8 text-sm"
                            placeholder="ex : Développeur full-stack"
                        />
                    </div>
                </div>
                <div className="flex gap-2 justify-end">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={editPending}
                        tooltip="Annuler les modifications"
                    >
                        <X className="h-3.5 w-3.5" />
                        Annuler
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={editPending}
                        tooltip="Enregistrer les modifications du membre"
                    >
                        <Check className="h-3.5 w-3.5" />
                        {editPending ? "Sauvegarde…" : "Sauvegarder"}
                    </Button>
                </div>
            </li>
        )
    }

    return (
        <li className="flex items-center gap-4 px-6 py-4 group">
            {/* Avatar */}
            <div className="flex-shrink-0 h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-600">
                {getInitials(m.firstName, m.lastName)}
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{m.firstName} {m.lastName}</p>
                {m.role && <p className="text-xs text-muted-foreground truncate">{m.role}</p>}
            </div>
            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    onClick={() => setEditing(true)}
                    disabled={isPending}
                    tooltip="Modifier le membre"
                >
                    <Pencil className="h-3.5 w-3.5" />
                </Button>
                <ConfirmDialog title={`Supprimer ${fullName(m)} ?`} onConfirm={() => onDelete(m)}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                        disabled={isPending}
                        tooltip="Supprimer le membre"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </ConfirmDialog>
            </div>
        </li>
    )
}

export function MembersPanel({ members }: { members: Member[] }) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const form = e.currentTarget // currentTarget n'est plus disponible après un await
        const data = new FormData(form)
        startTransition(async () => {
            const result = await addMember(String(data.get("firstName")), String(data.get("lastName")), String(data.get("role")))
            if (result.error) return void toast.error(result.error)
            form.reset()
            router.refresh()
        })
    }

    const handleDelete = (m: Member) => {
        startTransition(async () => {
            await deleteMember(m.id)
            router.refresh()
        })
    }

    return (
        <div>
            {/* Formulaire d'ajout */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <UserPlus className="h-4 w-4" />
                        Ajouter un membre
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAdd} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label htmlFor="new-member-first" className="text-sm font-medium">Prénom</label>
                                <Input id="new-member-first" name="firstName" required />
                            </div>
                            <div className="space-y-1.5">
                                <label htmlFor="new-member-last" className="text-sm font-medium">Nom</label>
                                <Input id="new-member-last" name="lastName" required />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="new-member-role" className="text-sm font-medium">Poste</label>
                            <Input id="new-member-role" name="role" placeholder="ex : Développeur full-stack" required />
                        </div>
                        <Button type="submit" disabled={isPending} className="w-full" tooltip="Ajouter ce membre à l'équipe">
                            <UserPlus className="mr-2 h-4 w-4" />
                            {isPending ? "Ajout en cours…" : "Ajouter le membre"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Liste des membres */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <User className="h-4 w-4" />
                        Membres de l&apos;équipe
                        <span className="ml-auto text-sm font-normal text-muted-foreground">
                            {members.length} personne{members.length !== 1 ? "s" : ""}
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {members.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-10">
                            Aucun membre pour l&apos;instant. Ajoutez-en un ci-dessus.
                        </p>
                    ) : (
                        <ul className="divide-y">
                            {members.map(m => (
                                <MemberRow
                                    key={m.id}
                                    m={m}
                                    onDelete={handleDelete}
                                    isPending={isPending}
                                />
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
