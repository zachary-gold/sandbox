import { useState } from "react"
import type { Pen } from "@/hooks/usePens"
import "./QuickAddSheet.css"

const DAYS = [
    { key: 'mon', label: 'M' },
    { key: 'tue', label: 'T' },
    { key: 'wed', label: 'W' },
    { key: 'thu', label: 'Th' },
    { key: 'fri', label: 'F' },
    { key: 'sat', label: 'Sa' },
    { key: 'sun', label: 'Su' },
]

interface QuickAddSheetProps {
    pens: Pen[]
    onAdd: (title: string, penId: string | null, dueDate: string | null, recurrence: string | null) => void
    onClose: () => void
}

export function QuickAddSheet({ pens, onAdd, onClose }: QuickAddSheetProps) {
    const [title, setTitle] = useState("")
    const [selectedPenId, setSelectedPenId] = useState<string | null>(null)
    const [dueDate, setDueDate] = useState("")
    const [recurrenceType, setRecurrenceType] = useState<'none' | 'daily' | 'weekly'>('none')
    const [selectedDays, setSelectedDays] = useState<string[]>([])

    const toggleDay = (day: string) => {
        setSelectedDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        )
    }

    const buildRecurrenceRule = (): string | null => {
        if (recurrenceType === 'none') return null
        if (recurrenceType === 'daily') return 'daily'
        if (recurrenceType === 'weekly' && selectedDays.length > 0) {
            return `weekly:${selectedDays.join(',')}`
        }
        return null
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (title.trim()) {
            onAdd(title.trim(), selectedPenId, dueDate || null, buildRecurrenceRule())
        }
    }

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose()
        }
    }

    return (
        <div className="quick-add-overlay" onClick={handleBackdropClick}>
            <div className="quick-add-sheet">
                <div className="sheet-handle" />

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        className="quick-add-input"
                        placeholder="What needs doing?"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        autoFocus
                    />

                    <div className="pen-picker">
                        <button
                            type="button"
                            className={`pen-chip ${!selectedPenId ? 'selected' : ''}`}
                            onClick={() => setSelectedPenId(null)}
                        >
                            📝 None
                        </button>
                        {pens.map(pen => (
                            <button
                                key={pen.id}
                                type="button"
                                className={`pen-chip ${selectedPenId === pen.id ? 'selected' : ''}`}
                                onClick={() => setSelectedPenId(pen.id)}
                            >
                                {pen.emoji} {pen.name}
                            </button>
                        ))}
                    </div>

                    <div className="due-date-row">
                        <label htmlFor="due-date">Due date (optional)</label>
                        <input
                            type="date"
                            id="due-date"
                            className="due-date-input"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                        />
                    </div>

                    {/* Recurrence Picker */}
                    <div className="recurrence-section">
                        <label>Repeat</label>
                        <div className="recurrence-options">
                            <button
                                type="button"
                                className={`recurrence-chip ${recurrenceType === 'none' ? 'selected' : ''}`}
                                onClick={() => setRecurrenceType('none')}
                            >
                                Never
                            </button>
                            <button
                                type="button"
                                className={`recurrence-chip ${recurrenceType === 'daily' ? 'selected' : ''}`}
                                onClick={() => setRecurrenceType('daily')}
                            >
                                Daily
                            </button>
                            <button
                                type="button"
                                className={`recurrence-chip ${recurrenceType === 'weekly' ? 'selected' : ''}`}
                                onClick={() => setRecurrenceType('weekly')}
                            >
                                Weekly
                            </button>
                        </div>

                        {recurrenceType === 'weekly' && (
                            <div className="day-picker">
                                {DAYS.map(day => (
                                    <button
                                        key={day.key}
                                        type="button"
                                        className={`day-chip ${selectedDays.includes(day.key) ? 'selected' : ''}`}
                                        onClick={() => toggleDay(day.key)}
                                    >
                                        {day.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="quick-add-actions">
                        <button type="button" className="cancel-button" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="add-submit-button"
                            disabled={!title.trim()}
                        >
                            Add to Pen
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
