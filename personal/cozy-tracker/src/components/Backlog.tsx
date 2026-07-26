import React from "react"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Plus, Calendar, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

type Priority = 'high' | 'normal' | 'low'
type SortBy = 'date_added' | 'due_date' | 'priority' | 'tag'

interface BacklogProps {
    items: any[]
    onAdd: (content: string, tags: string[], priority: Priority, dueDate: string | null, listableId?: string | null, itemType?: 'task' | 'note') => Promise<void>
    onToggle: (id: string, isChecked: boolean) => Promise<void>
    onDelete?: (id: string) => Promise<void>
    onEdit?: (item: any) => void
    listables?: any[]
    pendingSteps?: any[]
}

export const Backlog: React.FC<BacklogProps> = ({ items, onAdd, onToggle, onDelete, onEdit, listables = [], pendingSteps = [] }) => {
    const [isAdding, setIsAdding] = React.useState(false)
    const [newValue, setNewValue] = React.useState("")
    const [priority, setPriority] = React.useState<Priority>('normal')
    const [dueDate, setDueDate] = React.useState<string>("")
    const [selectedListableId, setSelectedListableId] = React.useState<string | null>(null)
    const [filterListableId, setFilterListableId] = React.useState<string | null>(null)
    const [itemType, setItemType] = React.useState<'task' | 'note'>('task')
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [sortBy, setSortBy] = React.useState<SortBy>('date_added')

    const handleAdd = async () => {
        if (!newValue.trim()) return
        setIsSubmitting(true)
        console.log("Backlog: Starting add...", { newValue, priority, dueDate, selectedListableId })

        // ... existing legacy code ... Note: we need to pass listable_id to onAdd
        // But onAdd currently doesn't accept listable_id. We need to update onAdd signature in App.tsx too.
        // For now, let's assume onAdd will carry tags properly.
        // Wait, onAdd in BacklogProps: (content: string, tags: string[], priority: Priority, dueDate: string | null) => Promise<void>
        // Use tags for now? Or update signature? The spec says "listable_id" column.
        // I should update onAdd signature.

        const tags = newValue.match(/#\w+/g)?.map(t => t.slice(1)) || []
        const cleanTitle = newValue.replace(/#\w+/g, "").trim()

        // We'll pass listableId as a 5th argument if we can, or update props.
        // Typescript will complain if I don't update props. I'll update props in a separate chunk or this one.
        // Let's modify the onAdd in BacklogProps first. 
        // Actually, I can't modify earlier chunk here easily.
        // I will rely on "listables" usually being separate from tags.
        // But wait, the listable IS a tag group.

        // I will update onAdd signature in the props definition chunk properly.
        // Ah, I missed updating onAdd in the first chunk. I should cancel and do it right.
        // But I can't cancel.
        // I'll proceed and assume I will fix onAdd signature in a separate edit or this one if I can.

        // Let's just use the updated signature in the call:
        // await onAdd(cleanTitle || newValue, tags, priority, dueDate || null, selectedListableId)

        // I will update the Props definition in this chunk too if checking lines 11-17 allows.
        // Lines 11-17 are covered by previous chunk.
        // I will effectively update lines 13 and call site here.

        if (itemType === 'note' && !selectedListableId) {
            alert("Notes must be assigned to a listable.")
            setIsSubmitting(false)
            return
        }

        await onAdd(cleanTitle || newValue, tags, priority, dueDate || null, selectedListableId, itemType)

        setNewValue("")
        setPriority('normal')
        setDueDate("")
        setSelectedListableId(null)
        setItemType('task')
        setIsAdding(false)
        setIsSubmitting(false)
    }

    // Sort items based on selected criteria
    // filter items
    const filteredItems = React.useMemo(() => {
        let res = items;
        if (filterListableId) {
            res = res.filter(i => i.listable_id === filterListableId)
        }
        return res
    }, [items, filterListableId])

    // Sort items based on selected criteria
    const sortedItems = React.useMemo(() => {
        const sorted = [...filteredItems]
        switch (sortBy) {
            case 'due_date':
                return sorted.sort((a, b) => {
                    if (!a.due_date && !b.due_date) return 0
                    if (!a.due_date) return 1
                    if (!b.due_date) return -1
                    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
                })
            case 'priority': {
                const priorityOrder: Record<Priority, number> = { high: 0, normal: 1, low: 2 }
                return sorted.sort((a, b) =>
                    priorityOrder[(a.priority || 'normal') as Priority] - priorityOrder[(b.priority || 'normal') as Priority]
                )
            }
            case 'tag':
                return sorted.sort((a, b) => {
                    const aTag = a.tags?.[0] || ''
                    const bTag = b.tags?.[0] || ''
                    return aTag.localeCompare(bTag)
                })
            case 'date_added':
            default:
                return sorted.sort((a, b) =>
                    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                )
        }
    }, [items, sortBy])

    return (
        <div className="w-full md:w-80 flex flex-col gap-4">
            {/* Listables Filter Pills */}
            {listables.length > 0 && (
                <div className="flex flex-wrap gap-2 px-2">
                    <button
                        onClick={() => setFilterListableId(null)}
                        className={cn(
                            "px-3 py-1 rounded-full text-xs font-bold border-2 transition-all",
                            !filterListableId ? "bg-text text-background border-text" : "bg-transparent text-text/40 border-text/10 hover:border-text/30"
                        )}
                    >
                        All
                    </button>
                    {listables.map(l => (
                        <button
                            key={l.id}
                            onClick={() => setFilterListableId(filterListableId === l.id ? null : l.id)}
                            className={cn(
                                "px-3 py-1 rounded-full text-xs font-bold border-2 transition-all flex items-center gap-1",
                                filterListableId === l.id ? "text-text border-text" : "text-text/60 border-transparent hover:bg-black/5"
                            )}
                            style={{ backgroundColor: filterListableId === l.id ? l.color : undefined }}
                        >
                            <div className="w-2 h-2 rounded-full border border-text/20" style={{ backgroundColor: l.color }} />
                            {l.name}
                        </button>
                    ))}
                </div>
            )}

            <div className="flex items-center justify-between px-2">
                <h2 className="text-2xl font-black uppercase tracking-tight italic text-text/40">Backlog</h2>
                <div className="flex gap-2">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortBy)}
                        className="text-[10px] font-bold uppercase tracking-widest py-1 px-2 rounded bg-background border border-text/20 text-text/60"
                    >
                        <option value="date_added">Date Added</option>
                        <option value="due_date">Due Date</option>
                        <option value="priority">Priority</option>
                        <option value="tag">Tag</option>
                    </select>
                </div>
            </div>

            <div className="space-y-4">
                {isAdding ? (
                    <div className="space-y-3">
                        <input
                            autoFocus
                            className="w-full p-4 bg-card border-2 border-text rounded-2xl shadow-hard text-lg font-bold focus:outline-none"
                            placeholder="What's on your mind?"
                            value={newValue}
                            onChange={(e) => setNewValue(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAdd()}
                        />

                        {/* Priority selector */}
                        <div className="flex gap-2">
                            {(['high', 'normal', 'low'] as Priority[]).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPriority(p)}
                                    className={cn(
                                        "flex-1 py-2 px-3 rounded-xl border-2 text-xs font-bold uppercase transition-all",
                                        priority === p
                                            ? p === 'high' ? "bg-accent/10 border-accent text-accent"
                                                : p === 'low' ? "bg-text/5 border-text/30 text-text/60"
                                                    : "bg-primary/10 border-primary text-primary"
                                            : "bg-transparent border-text/10 text-text/40 hover:border-text/30"
                                    )}
                                >
                                    {p === 'high' && '🔥 '}
                                    {p}
                                </button>
                            ))}
                        </div>

                        {/* Due date picker */}
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-text/30" size={16} />
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-background border-2 border-text/10 rounded-xl text-sm focus:outline-none"
                            />
                        </div>

                        {/* Listable Selector */}
                        {listables.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {listables.map(l => (
                                    <button
                                        key={l.id}
                                        onClick={() => setSelectedListableId(l.id === selectedListableId ? null : l.id)}
                                        className={cn(
                                            "px-2 py-1 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1",
                                            selectedListableId === l.id
                                                ? "border-text shadow-sm"
                                                : "border-transparent bg-background/50 hover:bg-background"
                                        )}
                                        style={{ backgroundColor: l.color }}
                                    >
                                        {l.name}
                                        {selectedListableId === l.id && <span className="opacity-50">✓</span>}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="flex gap-2">
                            <Button className="flex-1" onClick={handleAdd} disabled={isSubmitting}>
                                {isSubmitting ? "..." : itemType === 'note' ? "Save Note" : "Save Task"}
                            </Button>
                            <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <Button variant="secondary" className="flex-1 py-4 text-lg" onClick={() => { setItemType('task'); setIsAdding(true) }}>
                            □ New Task
                        </Button>
                        <Button variant="secondary" className="flex-1 py-4 text-lg" onClick={() => { setItemType('note'); setIsAdding(true) }}>
                            ○ New Note
                        </Button>
                    </div>
                )}

                {/* Limbo Section (Pending Flow Steps) */}
                {pendingSteps.length > 0 && (
                    <div className="space-y-2 mb-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-text/40 flex items-center gap-2">
                            Limbo <span className="bg-text/10 text-text px-1.5 rounded text-[10px]">{pendingSteps.length}</span>
                        </h3>
                        <div className="space-y-2">
                            {pendingSteps.map(step => (
                                <div key={step.id} className="p-3 bg-background border-2 border-dashed border-text/20 rounded-xl flex items-center justify-between group">
                                    <div>
                                        <div className="text-xs font-bold opacity-60 uppercase tracking-wider">{step.event_chains?.name}</div>
                                        <div className="font-bold">{step.title}</div>
                                    </div>
                                    <Button
                                        className="h-8 text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20"
                                        onClick={() => onAdd(step.title, [], 'normal', null, null, 'task')} // Quick promote to backlog
                                    >
                                        Add
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {sortedItems.filter(i => i.status !== 'done').map(item => (
                    <Card
                        key={item.id}
                        className="p-4 space-y-2 group hover:shadow-hard-sm transition-shadow cursor-pointer relative"
                        onClick={() => onEdit?.(item)}
                    >
                        {/* Delete button */}
                        {onDelete && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onDelete(item.id)
                                }}
                                className="absolute top-2 right-2 p-1.5 rounded-lg bg-background/80 border border-text/10 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all z-10"
                                title="Delete item"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                        <div className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                className="mt-1 w-4 h-4 rounded accent-primary border-text cursor-pointer"
                                onChange={() => onToggle(item.id, true)}
                            />
                            <div className="flex-1 space-y-1">
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className="font-bold text-sm leading-tight">{item.title}</h3>
                                    {/* Priority indicator */}
                                    {item.priority === 'high' && (
                                        <span className="text-xs px-1.5 py-0.5 rounded bg-accent/10 text-accent font-bold">
                                            🔥
                                        </span>
                                    )}
                                    {item.priority === 'low' && (
                                        <span className="text-xs px-1.5 py-0.5 rounded bg-text/5 text-text/40 font-bold">
                                            Low
                                        </span>
                                    )}
                                </div>
                                {item.tags && item.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {item.tags.map((tag: string) => (
                                            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                {item.due_date && (
                                    <div className="flex items-center gap-1 text-[10px] text-text/40 font-bold">
                                        <Calendar size={10} />
                                        Due {format(new Date(item.due_date), 'MMM d')}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    )
}
