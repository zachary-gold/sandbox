import React from "react"
import { format, startOfWeek, addDays, addWeeks, isSameDay } from "date-fns"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { AssignmentBadge, AssignmentPicker, type AssignmentValue } from "@/components/AssignmentPicker"
import { cn } from "@/lib/utils"
import { type GroupMember } from "@/hooks/useGroup"
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react"

interface WeeklyBoardProps {
    cards: any[]
    backlogItems?: any[]
    members?: GroupMember[]
    onAdd: (date: string, title: string, tags: string[], isRecurring: boolean, assignment?: AssignmentValue, scheduledTime?: string) => Promise<void>
    onToggle?: (id: string, completed: boolean) => Promise<void>
    onDelete?: (id: string) => Promise<void>
    onEdit?: (card: any) => void
    onWeekChange?: (weekStart: Date) => void
    onComplete?: (id: string) => Promise<void>
    onUncomplete?: (id: string) => Promise<void>
}

export const WeeklyBoard: React.FC<WeeklyBoardProps> = ({ cards, backlogItems = [], members = [], onAdd, onToggle, onDelete, onEdit, onWeekChange, onComplete, onUncomplete }) => {
    const [addingToDate, setAddingToDate] = React.useState<string | null>(null)
    const [newTitle, setNewTitle] = React.useState("")
    const [scheduledTime, setScheduledTime] = React.useState("")
    const [isRecurring, setIsRecurring] = React.useState(false)
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [weekOffset, setWeekOffset] = React.useState(0)
    const [assignment, setAssignment] = React.useState<AssignmentValue>({ assignedTo: null, assignedToBoth: false })

    const handleAdd = async (date: string) => {
        if (!newTitle.trim()) return
        setIsSubmitting(true)

        const tags = newTitle.match(/#\w+/g)?.map(t => t.slice(1)) || []
        const cleanTitle = newTitle.replace(/#\w+/g, "").trim()

        await onAdd(date, cleanTitle || newTitle, tags, isRecurring, assignment, scheduledTime || undefined)

        setNewTitle("")
        setScheduledTime("")
        setIsRecurring(false)
        setAssignment({ assignedTo: null, assignedToBoth: false })
        setAddingToDate(null)
        setIsSubmitting(false)
    }

    const today = new Date()
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 })
    const displayedWeekStart = addWeeks(currentWeekStart, weekOffset)
    const days = Array.from({ length: 7 }).map((_, i) => addDays(displayedWeekStart, i))

    const goToPrevWeek = () => {
        const newOffset = weekOffset - 1
        setWeekOffset(newOffset)
        onWeekChange?.(addWeeks(currentWeekStart, newOffset))
    }

    const goToNextWeek = () => {
        const newOffset = weekOffset + 1
        setWeekOffset(newOffset)
        onWeekChange?.(addWeeks(currentWeekStart, newOffset))
    }

    const goToThisWeek = () => {
        setWeekOffset(0)
        onWeekChange?.(currentWeekStart)
    }

    return (
        <div className="space-y-4">
            {/* Week Navigation */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={goToPrevWeek} className="p-2">
                    <ChevronLeft size={20} />
                </Button>
                <div className="flex items-center gap-3">
                    <span className="text-sm font-bold uppercase tracking-widest text-text/60">
                        {format(displayedWeekStart, "MMM d")} — {format(addDays(displayedWeekStart, 6), "MMM d, yyyy")}
                    </span>
                    {weekOffset !== 0 && (
                        <button
                            onClick={goToThisWeek}
                            className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline"
                        >
                            Today
                        </button>
                    )}
                </div>
                <Button variant="ghost" onClick={goToNextWeek} className="p-2">
                    <ChevronRight size={20} />
                </Button>
            </div>

            {/* Week Grid */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4 w-full overflow-x-auto pb-8 min-h-[600px]">
                {days.map((day) => {
                    const isToday = isSameDay(day, today)
                    const dayCards = cards
                        .filter(c => c.date === format(day, "yyyy-MM-dd"))
                        .sort((a, b) => {
                            // Sort by time (timed first, then untimed)
                            if (a.scheduled_time && b.scheduled_time) {
                                return a.scheduled_time.localeCompare(b.scheduled_time)
                            }
                            if (a.scheduled_time) return -1
                            if (b.scheduled_time) return 1

                            // Secondary sort by created_at
                            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                        })

                    return (
                        <div key={day.toString()} className="flex flex-col gap-4 min-w-[200px]">
                            <div className={cn(
                                "text-center p-2 rounded-xl border-2 border-text bg-card shadow-hard-sm sticky top-0 z-10",
                                isToday && "bg-primary text-white"
                            )}>
                                <div className="text-xs font-bold uppercase tracking-wider">{format(day, "EEE")}</div>
                                <div className="text-xl font-black">{format(day, "d")}</div>
                            </div>

                            <div className="flex-1 space-y-4">
                                {dayCards.map(card => (
                                    <Card
                                        key={card.id}
                                        className={cn(
                                            "p-4 space-y-2 cursor-pointer hover:translate-y-[-2px] transition-transform group relative",
                                            card.completed_at && "opacity-50 grayscale"
                                        )}
                                        onClick={() => onEdit?.(card)}
                                    >
                                        {/* Delete button - visible on hover */}
                                        {onDelete && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    onDelete(card.id)
                                                }}
                                                className="absolute top-2 right-2 p-1.5 rounded-lg bg-background/80 border border-text/10 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all z-10"
                                                title="Delete card"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                        <div className="flex items-start justify-between gap-2 pr-6">
                                            <h3 className="font-bold text-sm leading-tight flex-1">
                                                {card.scheduled_time && (
                                                    <span className="inline-block mr-1.5 font-mono text-xs text-primary bg-primary/10 px-1 rounded">
                                                        {new Date(`1970-01-01T${card.scheduled_time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase()}
                                                    </span>
                                                )}
                                                {card.title}
                                            </h3>
                                            <AssignmentBadge
                                                assignedTo={card.assigned_to}
                                                assignedToBoth={card.assigned_to_both}
                                                members={members}
                                            />
                                        </div>
                                        {card.description && (
                                            <p className="text-xs text-text/60 line-clamp-2">{card.description}</p>
                                        )}
                                        {card.tags && card.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {card.tags.map((tag: string) => (
                                                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20">
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Tag Linkage: Show backlog items sharing tags with this card */}
                                        {((card.listable_id && backlogItems.filter(bi => bi.listable_id === card.listable_id && bi.status !== 'done' && bi.item_type === 'note').length > 0) ||
                                            (card.tags.length > 0 && backlogItems.filter(bi => bi.status !== 'done' && bi.tags?.some((t: string) => card.tags.includes(t)) && !bi.listable_id).length > 0)) && (
                                                <div className="mt-3 pt-3 border-t-2 border-dashed border-text/10 space-y-2">
                                                    {/* Match by Listable ID (V3 preferred) */}
                                                    {card.listable_id && backlogItems
                                                        .filter(bi => bi.listable_id === card.listable_id && bi.status !== 'done' && bi.item_type === 'note')
                                                        .map(bi => (
                                                            <div key={bi.id} className="flex items-center gap-2 group/item">
                                                                <input
                                                                    type="checkbox"
                                                                    className="w-3 h-3 rounded accent-primary border-text cursor-pointer"
                                                                    onChange={(e) => {
                                                                        e.stopPropagation(); // Prevent card click
                                                                        onToggle?.(bi.id, true);
                                                                    }}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                />
                                                                <span className="text-xs font-bold text-text/60 group-hover/item:text-text transition-colors">
                                                                    {bi.title}
                                                                </span>
                                                            </div>
                                                        ))
                                                    }

                                                    {/* Match by Tags (Legacy V2 support) */}
                                                    {!card.listable_id && card.tags.length > 0 && backlogItems
                                                        .filter(bi => bi.status !== 'done' && bi.tags?.some((t: string) => card.tags.includes(t)) && !bi.listable_id)
                                                        .map(bi => (
                                                            <div key={bi.id} className="flex items-center gap-2 group/item">
                                                                <input
                                                                    type="checkbox"
                                                                    className="w-3 h-3 rounded accent-primary border-text cursor-pointer"
                                                                    onChange={(e) => {
                                                                        e.stopPropagation();
                                                                        onToggle?.(bi.id, true);
                                                                    }}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                />
                                                                <span className="text-xs font-bold text-text/60 group-hover/item:text-text transition-colors">
                                                                    {bi.title}
                                                                </span>
                                                            </div>
                                                        ))
                                                    }
                                                </div>
                                            )}


                                        {/* Mark Done Button */}
                                        <div className="pt-3 mt-1 flex justify-between items-center border-t border-dashed border-text/10">
                                            <Button
                                                variant="ghost"
                                                className={cn(
                                                    "h-auto py-1 px-2 text-[10px] uppercase font-bold tracking-wider",
                                                    card.completed_at
                                                        ? "bg-text/10 text-text hover:bg-text/20"
                                                        : "bg-primary/10 text-primary hover:bg-primary/20"
                                                )}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    if (card.completed_at) {
                                                        onUncomplete?.(card.id)
                                                    } else {
                                                        onComplete?.(card.id)
                                                    }
                                                }}
                                            >
                                                {card.completed_at ? "Undo" : "Mark Done"}
                                            </Button>
                                        </div>
                                    </Card>
                                ))}

                                {addingToDate === format(day, "yyyy-MM-dd") ? (
                                    <div className="space-y-2">
                                        <div className="flex flex-col gap-2">
                                            <input
                                                autoFocus
                                                placeholder="What's happening? (use #tags)"
                                                value={newTitle}
                                                onChange={(e) => setNewTitle(e.target.value)}
                                                onKeyDown={(e) => e.key === "Enter" && handleAdd(format(day, "yyyy-MM-dd"))}
                                            />
                                            <div className="flex items-center gap-2 px-1">
                                                <input
                                                    type="time"
                                                    value={scheduledTime}
                                                    onChange={(e) => setScheduledTime(e.target.value)}
                                                    className="px-2 py-1 bg-background border border-text/20 rounded text-xs font-bold"
                                                />
                                                <div className="w-[1px] h-4 bg-text/20 mx-1" />
                                                <input
                                                    type="checkbox"
                                                    id={`recurring-${format(day, "yyyy-MM-dd")}`}
                                                    className="w-3 h-3 accent-primary border-text rounded"
                                                    checked={isRecurring}
                                                    onChange={(e) => setIsRecurring(e.target.checked)}
                                                />
                                                <label htmlFor={`recurring-${format(day, "yyyy-MM-dd")}`} className="text-[10px] font-bold uppercase text-text/40">Repeat Weekly</label>
                                            </div>
                                            {/* Assignment picker */}
                                            {members.length > 0 && (
                                                <div className="mt-2">
                                                    <AssignmentPicker
                                                        value={assignment}
                                                        members={members}
                                                        onChange={setAssignment}
                                                        compact
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                className="flex-1 py-1 px-2 text-xs"
                                                onClick={() => handleAdd(format(day, "yyyy-MM-dd"))}
                                                disabled={isSubmitting}
                                            >
                                                {isSubmitting ? "..." : "Add"}
                                            </Button>
                                            <Button
                                                className="py-1 px-2 text-xs"
                                                variant="ghost"
                                                onClick={() => setAddingToDate(null)}
                                            >
                                                ×
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setAddingToDate(format(day, "yyyy-MM-dd"))}
                                        className="w-full py-3 border-2 border-dashed border-text/10 rounded-2xl text-text/30 hover:text-text/60 hover:border-text/30 hover:bg-black/5 transition-all text-sm font-bold"
                                    >
                                        + Add
                                    </button>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div >
    )
}
