import React from "react"
import { Card } from "@/components/ui/Card"
import { format } from "date-fns"
import { CheckCircle2, Circle, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface DailyChecklistProps {
    cards: any[]
    backlogItems: any[]
    onToggle: (id: string, isChecked: boolean) => Promise<void>
}

export const DailyChecklist: React.FC<DailyChecklistProps> = ({ cards, backlogItems, onToggle }) => {
    const todayStr = format(new Date(), "yyyy-MM-dd")
    const todayCards = cards.filter(c => c.date === todayStr)

    // Find backlog items linked by tags to today's cards
    const linkedBacklogItems = backlogItems.filter(bi =>
        bi.status !== 'done' &&
        bi.tags?.some((tag: string) => todayCards.some(tc => tc.tags?.includes(tag)))
    )

    if (todayCards.length === 0 && linkedBacklogItems.length === 0) {
        return null
    }

    return (
        <Card className="p-6 mb-8 border-primary/20 bg-primary/5 shadow-hard-sm">
            <div className="flex items-center gap-2 mb-4">
                <Sparkles size={20} className="text-primary fill-primary" />
                <h2 className="text-xl font-black uppercase tracking-tight italic">Today's Focus</h2>
            </div>

            <div className="space-y-4">
                {/* Scheduled Tasks */}
                {todayCards.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-text/40">From Calendar</h3>
                        {todayCards.map(card => (
                            <div key={card.id} className="flex items-center gap-3">
                                <button
                                    onClick={() => onToggle(card.id, card.status !== 'done')}
                                    className="text-text/20 hover:text-primary transition-colors"
                                >
                                    {card.status === 'done' ? <CheckCircle2 className="text-primary" /> : <Circle />}
                                </button>
                                <span className={cn(
                                    "font-bold text-sm",
                                    card.status === 'done' && "line-through text-text/40"
                                )}>
                                    {card.title}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Linked Backlog Items */}
                {linkedBacklogItems.length > 0 && (
                    <div className="space-y-2 pt-2 border-t-2 border-dashed border-text/10">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-text/40">From Backlog (Linked)</h3>
                        {linkedBacklogItems.map(item => (
                            <div key={item.id} className="flex items-center gap-3">
                                <button
                                    onClick={() => onToggle(item.id, true)}
                                    className="text-text/20 hover:text-primary transition-colors"
                                >
                                    <Circle />
                                </button>
                                <div className="flex flex-col">
                                    <span className="font-bold text-sm">
                                        {item.title || item.content}
                                    </span>
                                    <div className="flex gap-1 mt-0.5">
                                        {item.tags?.map((t: string) => (
                                            <span key={t} className="text-[8px] font-bold text-primary/60 uppercase">#{t}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Card>
    )
}
