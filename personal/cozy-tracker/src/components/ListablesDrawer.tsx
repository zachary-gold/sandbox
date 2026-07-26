import React, { useState } from "react"
import { X, Plus, Trash2, Tag } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import type { Listable } from "@/hooks/useListables"

const PASTEL_COLORS = [
    "#FFB7B2", // Red
    "#FFDAC1", // Peach
    "#E2F0CB", // Lime
    "#B5EAD7", // Mint
    "#C7CEEA", // Periwinkle
    "#FF9AA2", // Salmon
    "#FFB347", // Orange
    "#A0E7E5", // Aqua
]

interface ListablesDrawerProps {
    isOpen: boolean
    onClose: () => void
    listables: Listable[]
    onAdd: (name: string, color: string) => Promise<any>
    onUpdate: (id: string, updates: { name?: string; color?: string }) => Promise<boolean>
    onDelete: (id: string) => Promise<boolean>
}

export const ListablesDrawer: React.FC<ListablesDrawerProps> = ({
    isOpen,
    onClose,
    listables,
    onAdd,
    onUpdate,
    onDelete
}) => {
    const [newName, setNewName] = useState("")
    const [selectedColor, setSelectedColor] = useState(PASTEL_COLORS[0])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

    if (!isOpen) return null

    const handleAdd = async () => {
        if (!newName.trim()) return
        setIsSubmitting(true)
        await onAdd(newName.trim(), selectedColor)
        setNewName("")
        setIsSubmitting(false)
    }

    const handleUpdate = async (id: string) => {
        if (!newName.trim()) return
        setIsSubmitting(true)
        await onUpdate(id, { name: newName.trim(), color: selectedColor })
        setEditingId(null)
        setNewName("")
        setIsSubmitting(false)
    }

    const startEdit = (l: Listable) => {
        setEditingId(l.id)
        setNewName(l.name)
        setSelectedColor(l.color || PASTEL_COLORS[0])
    }

    const cancelEdit = () => {
        setEditingId(null)
        setNewName("")
        setSelectedColor(PASTEL_COLORS[0])
    }

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-background border-l-2 border-text shadow-hard h-full p-6 overflow-y-auto flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black uppercase tracking-tight italic flex items-center gap-2">
                        <Tag className="text-primary" />
                        Listables
                    </h2>
                    <Button variant="ghost" onClick={onClose} className="p-2">
                        <X size={24} />
                    </Button>
                </div>

                <div className="space-y-6 flex-1">
                    <div className="bg-card border-2 border-text rounded-2xl p-4 space-y-4">
                        <h3 className="font-bold uppercase text-xs tracking-widest text-text/40">
                            {editingId ? "Edit Listable" : "Create New Listable"}
                        </h3>
                        <div className="space-y-4">
                            <input
                                className="w-full p-3 bg-background border-2 border-text/10 rounded-xl font-bold focus:outline-none focus:border-primary"
                                placeholder="Listable name (e.g. Grocery, Home)"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && (editingId ? handleUpdate(editingId) : handleAdd())}
                            />

                            <div className="flex flex-wrap gap-2">
                                {PASTEL_COLORS.map(color => (
                                    <button
                                        key={color}
                                        className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${selectedColor === color ? "border-text scale-110 shadow-sm" : "border-transparent"}`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => setSelectedColor(color)}
                                    />
                                ))}
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    className="flex-1"
                                    onClick={() => editingId ? handleUpdate(editingId) : handleAdd()}
                                    disabled={!newName.trim() || isSubmitting}
                                >
                                    {editingId ? "Update" : "Add Listable"}
                                </Button>
                                {editingId && (
                                    <Button variant="ghost" onClick={cancelEdit}>Cancel</Button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {listables.map(listable => (
                            <Card key={listable.id} className="p-4 flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-4 h-4 rounded-full border border-text/20"
                                        style={{ backgroundColor: listable.color }}
                                    />
                                    <span className="font-bold">{listable.name}</span>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" className="h-8 px-2 text-xs uppercase font-bold" onClick={() => startEdit(listable)}>
                                        Edit
                                    </Button>
                                    <button
                                        className="p-1.5 text-text/40 hover:text-red-500 hover:bg-red-50 rounded"
                                        onClick={() => onDelete(listable.id)}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </Card>
                        ))}

                        {listables.length === 0 && (
                            <div className="text-center py-10 text-text/40 italic">
                                No listables yet. improved notes organization awaits!
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
