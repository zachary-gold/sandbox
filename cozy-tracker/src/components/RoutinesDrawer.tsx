import React, { useState } from "react"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { AssignmentPicker, AssignmentBadge, type AssignmentValue } from "@/components/AssignmentPicker"
import { type GroupMember } from "@/hooks/useGroup"
import { X, Plus, Edit2, Trash2, Pause, Play, Clock } from "lucide-react"

interface Routine {
    id: string
    title: string
    description?: string
    recurrence_rule?: string
    time_of_day?: string
    routine_start_date?: string
    routine_end_date?: string
    is_active: boolean
    assigned_to?: string | null
    assigned_to_both?: boolean
    tags?: string[]
}

interface RoutinesDrawerProps {
    isOpen: boolean
    onClose: () => void
    routines: Routine[]
    members: GroupMember[]
    groupId?: string
    onAdd: (routine: Omit<Routine, 'id'>) => Promise<void>
    onUpdate: (id: string, updates: Partial<Routine>) => Promise<void>
    onDelete: (id: string) => Promise<void>
}

const DAYS = [
    { code: 'MO', label: 'M' },
    { code: 'TU', label: 'T' },
    { code: 'WE', label: 'W' },
    { code: 'TH', label: 'T' },
    { code: 'FR', label: 'F' },
    { code: 'SA', label: 'S' },
    { code: 'SU', label: 'S' },
]

function parseDaysFromRule(rule?: string): string[] {
    if (!rule) return []
    const match = rule.match(/BYDAY=([A-Z,]+)/)
    return match ? match[1].split(',') : []
}

function formatDaysDisplay(rule?: string): string {
    const days = parseDaysFromRule(rule)
    if (days.length === 7) return 'Every day'
    if (days.length === 5 && !days.includes('SA') && !days.includes('SU')) return 'Weekdays'
    if (days.length === 2 && days.includes('SA') && days.includes('SU')) return 'Weekends'
    return days.map(d => DAYS.find(day => day.code === d)?.label || d).join(' ')
}

export const RoutinesDrawer: React.FC<RoutinesDrawerProps> = ({
    isOpen,
    onClose,
    routines,
    members,
    groupId,
    onAdd,
    onUpdate,
    onDelete
}) => {
    const [isAdding, setIsAdding] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-40">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />

            {/* Drawer */}
            <div className="absolute top-0 left-0 right-0 bg-card border-b-2 border-text shadow-hard max-h-[70vh] overflow-hidden flex flex-col animate-in slide-in-from-top duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b-2 border-text/10">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🔄</span>
                        <h2 className="text-xl font-black uppercase tracking-tight italic">Routines</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-text/5 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Add New Button */}
                    {!isAdding && (
                        <Button
                            variant="secondary"
                            className="w-full py-3"
                            onClick={() => setIsAdding(true)}
                        >
                            <Plus size={16} /> Add New Routine
                        </Button>
                    )}

                    {/* Add Form */}
                    {isAdding && (
                        <RoutineForm
                            members={members}
                            onSave={async (routine) => {
                                await onAdd(routine)
                                setIsAdding(false)
                            }}
                            onCancel={() => setIsAdding(false)}
                        />
                    )}

                    {/* Routine List */}
                    {routines.map(routine => (
                        editingId === routine.id ? (
                            <RoutineForm
                                key={routine.id}
                                routine={routine}
                                members={members}
                                onSave={async (updates) => {
                                    await onUpdate(routine.id, updates)
                                    setEditingId(null)
                                }}
                                onCancel={() => setEditingId(null)}
                            />
                        ) : (
                            <RoutineCard
                                key={routine.id}
                                routine={routine}
                                members={members}
                                onEdit={() => setEditingId(routine.id)}
                                onTogglePause={() => onUpdate(routine.id, { is_active: !routine.is_active })}
                                onDelete={() => onDelete(routine.id)}
                            />
                        )
                    ))}

                    {routines.length === 0 && !isAdding && (
                        <div className="text-center py-8 text-text/40">
                            <p className="font-bold">No routines yet</p>
                            <p className="text-sm">Add recurring tasks that repeat on specific days</p>
                        </div>
                    )}

                    {routines.length === 0 && !isAdding && (
                        <div className="text-center py-8 text-text/40">
                            <p className="font-bold">No routines yet</p>
                            <p className="text-sm">Add recurring tasks that repeat on specific days</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// Individual routine card display
const RoutineCard: React.FC<{
    routine: Routine
    members: GroupMember[]
    onEdit: () => void
    onTogglePause: () => void
    onDelete: () => void
}> = ({ routine, members, onEdit, onTogglePause, onDelete }) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    return (
        <Card className={`p-4 space-y-2 ${!routine.is_active ? 'opacity-50' : ''}`}>
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                    <h3 className="font-bold text-sm">
                        {routine.title}
                        {!routine.is_active && <span className="text-text/40 ml-2">(paused)</span>}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-text/60">
                        <span className="font-bold">{formatDaysDisplay(routine.recurrence_rule)}</span>
                        {routine.time_of_day && (
                            <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    <Clock size={10} />
                                    {routine.time_of_day}
                                </span>
                            </>
                        )}
                    </div>
                </div>
                <AssignmentBadge
                    assignedTo={routine.assigned_to || null}
                    assignedToBoth={routine.assigned_to_both || false}
                    members={members}
                />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-text/10">
                <button
                    onClick={onEdit}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-text/60 hover:text-text transition-colors"
                >
                    <Edit2 size={12} /> Edit
                </button>
                <button
                    onClick={onTogglePause}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-text/60 hover:text-text transition-colors"
                >
                    {routine.is_active ? <Pause size={12} /> : <Play size={12} />}
                    {routine.is_active ? 'Pause' : 'Resume'}
                </button>
                {showDeleteConfirm ? (
                    <>
                        <span className="text-xs text-red-500 font-bold">Delete?</span>
                        <button
                            onClick={() => { onDelete(); setShowDeleteConfirm(false) }}
                            className="px-2 py-1 text-xs font-bold text-red-500 hover:bg-red-50 rounded"
                        >
                            Yes
                        </button>
                        <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className="px-2 py-1 text-xs font-bold text-text/60 hover:text-text"
                        >
                            No
                        </button>
                    </>
                ) : (
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-text/60 hover:text-red-500 transition-colors"
                    >
                        <Trash2 size={12} /> Delete
                    </button>
                )}
            </div>
        </Card>
    )
}

// Add/Edit form for routines
const RoutineForm: React.FC<{
    routine?: Routine
    members: GroupMember[]
    onSave: (routine: Omit<Routine, 'id'>) => Promise<void>
    onCancel: () => void
}> = ({ routine, members, onSave, onCancel }) => {
    const [title, setTitle] = useState(routine?.title || '')
    const [selectedDays, setSelectedDays] = useState<string[]>(() => parseDaysFromRule(routine?.recurrence_rule))
    const [timeOfDay, setTimeOfDay] = useState(routine?.time_of_day || '')
    const [assignment, setAssignment] = useState<AssignmentValue>({
        assignedTo: routine?.assigned_to || null,
        assignedToBoth: routine?.assigned_to_both || false
    })
    const [isSaving, setIsSaving] = useState(false)

    const toggleDay = (code: string) => {
        setSelectedDays(prev =>
            prev.includes(code)
                ? prev.filter(d => d !== code)
                : [...prev, code]
        )
    }

    const handleSave = async () => {
        if (!title.trim() || selectedDays.length === 0) return
        setIsSaving(true)

        await onSave({
            title: title.trim(),
            recurrence_rule: `FREQ=WEEKLY;BYDAY=${selectedDays.join(',')}`,
            time_of_day: timeOfDay || undefined,
            is_active: routine?.is_active ?? true,
            assigned_to: assignment.assignedTo,
            assigned_to_both: assignment.assignedToBoth,
            is_recurring_template: true
        } as any)

        setIsSaving(false)
    }

    return (
        <Card className="p-4 space-y-4 border-primary/30 bg-primary/5">
            {/* Title */}
            <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Routine name..."
                className="w-full p-3 bg-background border-2 border-text/10 rounded-xl text-sm font-bold focus:outline-none focus:border-primary"
            />

            {/* Day Picker */}
            <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-text/40">Repeat On</label>
                <div className="flex gap-1">
                    {DAYS.map((day) => (
                        <button
                            key={day.code}
                            onClick={() => toggleDay(day.code)}
                            className={`w-8 h-8 rounded-lg border-2 text-xs font-bold transition-all ${selectedDays.includes(day.code)
                                ? 'bg-primary text-white border-primary'
                                : 'bg-background border-text/20 text-text/60 hover:border-text/40'
                                }`}
                        >
                            {day.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Time */}
            <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-text/40">Time (optional)</label>
                <input
                    type="time"
                    value={timeOfDay}
                    onChange={(e) => setTimeOfDay(e.target.value)}
                    className="w-full p-2 bg-background border-2 border-text/10 rounded-xl text-sm focus:outline-none focus:border-primary"
                />
            </div>

            {/* Assignment */}
            {members.length > 0 && (
                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text/40">Assign To</label>
                    <AssignmentPicker
                        value={assignment}
                        members={members}
                        onChange={setAssignment}
                    />
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
                <Button
                    className="flex-1"
                    onClick={handleSave}
                    disabled={isSaving || !title.trim() || selectedDays.length === 0}
                >
                    {isSaving ? 'Saving...' : routine ? 'Save Changes' : 'Create Routine'}
                </Button>
                <Button variant="ghost" onClick={onCancel}>
                    Cancel
                </Button>
            </div>
        </Card>
    )
}
