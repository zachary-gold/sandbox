import React, { useState, useEffect } from "react"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { AssignmentPicker, type AssignmentValue } from "@/components/AssignmentPicker"
import { type GroupMember } from "@/hooks/useGroup"
import { X, Calendar } from "lucide-react"

type Priority = 'high' | 'normal' | 'low'

interface CardData {
    id: string
    title: string
    description?: string
    tags?: string[]
    date?: string | null
    assigned_to?: string | null
    assigned_to_both?: boolean
    priority?: Priority
    due_date?: string | null
    scheduled_time?: string | null
}

interface CardEditModalProps {
    card: CardData
    members: GroupMember[]
    onSave: (id: string, updates: Partial<CardData>) => Promise<void>
    onClose: () => void
}

export const CardEditModal: React.FC<CardEditModalProps> = ({ card, members, onSave, onClose }) => {
    const [title, setTitle] = useState(card.title)
    const [description, setDescription] = useState(card.description || "")
    const [assignment, setAssignment] = useState<AssignmentValue>({
        assignedTo: card.assigned_to || null,
        assignedToBoth: card.assigned_to_both || false
    })
    const [priority, setPriority] = useState<Priority>(card.priority || 'normal')
    const [dueDate, setDueDate] = useState(card.due_date || "")
    const [scheduledTime, setScheduledTime] = useState(card.scheduled_time || "")
    const [isSaving, setIsSaving] = useState(false)

    const handleSave = async () => {
        if (!title.trim()) return
        setIsSaving(true)

        await onSave(card.id, {
            title: title.trim(),
            description: description.trim() || undefined,
            assigned_to: assignment.assignedTo,
            assigned_to_both: assignment.assignedToBoth,
            priority,
            due_date: dueDate || null,
            scheduled_time: scheduledTime || null
        })

        setIsSaving(false)
        onClose()
    }

    // Close on Escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }
        window.addEventListener("keydown", handleEscape)
        return () => window.removeEventListener("keydown", handleEscape)
    }, [onClose])

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-40"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md bg-card border-2 border-text shadow-hard p-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black uppercase tracking-tight italic">Edit Card</h2>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg hover:bg-text/5 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Title */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text/40">Title</label>
                        <input
                            autoFocus
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full p-3 bg-background border-2 border-text/10 rounded-xl text-sm font-bold focus:outline-none focus:border-primary"
                            placeholder="Card title..."
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text/40">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full p-3 bg-background border-2 border-text/10 rounded-xl text-sm focus:outline-none focus:border-primary resize-none"
                            placeholder="Optional notes..."
                        />
                    </div>

                    {/* Scheduled Time (only for scheduled tasks) */}
                    {card.date && (
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text/40">Time</label>
                            <input
                                type="time"
                                value={scheduledTime}
                                onChange={(e) => setScheduledTime(e.target.value)}
                                className="w-full p-3 bg-background border-2 border-text/10 rounded-xl text-sm font-bold focus:outline-none focus:border-primary"
                            />
                        </div>
                    )}

                    {/* Assignment */}
                    {members.length > 0 && (
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text/40">Assigned To</label>
                            <AssignmentPicker
                                value={assignment}
                                members={members}
                                onChange={setAssignment}
                            />
                        </div>
                    )}

                    {/* Priority (for backlog items) */}
                    {card.date === null && (
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text/40">Priority</label>
                            <div className="flex gap-2">
                                {(['high', 'normal', 'low'] as Priority[]).map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setPriority(p)}
                                        className={`flex-1 py-2 px-3 rounded-xl border-2 text-xs font-bold uppercase transition-all ${priority === p
                                            ? p === 'high' ? "bg-accent/10 border-accent text-accent"
                                                : p === 'low' ? "bg-text/5 border-text/30 text-text/60"
                                                    : "bg-primary/10 border-primary text-primary"
                                            : "bg-transparent border-text/10 text-text/40 hover:border-text/30"
                                            }`}
                                    >
                                        {p === 'high' && '🔥 '}
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Due Date (for backlog items) */}
                    {card.date === null && (
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text/40">Due Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-text/30" size={16} />
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-background border-2 border-text/10 rounded-xl text-sm focus:outline-none focus:border-primary"
                                />
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                        <Button
                            className="flex-1"
                            onClick={handleSave}
                            disabled={isSaving || !title.trim()}
                        >
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                    </div>
                </Card>
            </div>
        </>
    )
}
