"use client"

import { useState, useTransition } from "react"
import { addMember, deleteMember, updateMember } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, UserPlus, User, Pencil, Check, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { fullName, type Member } from "@/lib/types"


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
    const [editError, setEditError] = useState<string | null>(null)

    const getInitials = (f: string, l: string) => `${f[0] ?? ""}${l[0] ?? ""}`.toUpperCase()

    const handleSave = () => {
        setEditError(null)
        startEditTransition(async () => {
            const result = await updateMember(m.id, firstName, lastName, role)
            if (result.error) {
                setEditError(result.error)
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
        setEditError(null)
        setEditing(false)
    }

    if (editing) {
        return (
            <li className="px-6 py-4 bg-slate-50/70 border-l-6">
                <div className="mb-6">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">Prénom</label>
                            <Input
                                value={firstName}
                                onChange={e => setFirstName(e.target.value)}
                                className="h-8 text-sm"
                                autoFocus
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">Nom</label>
                            <Input
                                value={lastName}
                                onChange={e => setLastName(e.target.value)}
                                className="h-8 text-sm"
                            />
                        </div>
                    </div>
                    <div className="space-y-1 mb-3">
                        <label className="text-xs font-medium text-muted-foreground">Poste</label>
                        <Input
                            value={role}
                            onChange={e => setRole(e.target.value)}
                            className="h-8 text-sm"
                            placeholder="ex : Développeur full-stack"
                        />
                    </div>
                </div>
                {editError && <p className="text-xs text-red-500 mb-2">{editError}</p>}
                <div className="flex gap-2 justify-end">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={editPending}
                    >
                        <X className="h-3.5 w-3.5" />
                        Annuler
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={editPending}
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
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    onClick={() => setEditing(true)}
                    disabled={isPending}
                    title="Modifier"
                >
                    <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                    onClick={() => onDelete(m)}
                    disabled={isPending}
                    title="Supprimer"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </Button>
            </div>
        </li>
    )
}

export function MembersPanel({ members }: { members: Member[] }) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const form = e.currentTarget // currentTarget n'est plus disponible après un await
        const data = new FormData(form)
        setError(null)
        startTransition(async () => {
            const result = await addMember(String(data.get("firstName")), String(data.get("lastName")), String(data.get("role")))
            if (result.error) return setError(result.error)
            form.reset()
            router.refresh()
        })
    }

    const handleDelete = (m: Member) => {
        if (!confirm(`Supprimer ${fullName(m)} ?`)) return
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
                                <label className="text-sm font-medium">Prénom</label>
                                <Input name="firstName" required />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Nom</label>
                                <Input name="lastName" required />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Poste</label>
                            <Input name="role" placeholder="ex : Développeur full-stack" required />
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        <Button type="submit" disabled={isPending} className="w-full">
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
