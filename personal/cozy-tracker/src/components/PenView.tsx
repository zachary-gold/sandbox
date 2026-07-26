import { useState } from "react"
import type { Pen } from "@/hooks/usePens"
import type { Item } from "@/hooks/useItems"
import "./PenView.css"

interface PenViewProps {
    pens: Pen[]
    items: Item[] // Backlog items (no focus_date, not completed)
    onPullToFocus: (itemId: string) => Promise<boolean>
    onClose: () => void
}

export function PenView({ pens, items, onPullToFocus, onClose }: PenViewProps) {
    const [selectedPenId, setSelectedPenId] = useState<string | null>(null)

    const getItemsForPen = (penId: string) => {
        return items.filter(item => item.pen_id === penId)
    }

    const uncategorizedItems = items.filter(item => !item.pen_id)

    const handlePullToFocus = async (itemId: string) => {
        const success = await onPullToFocus(itemId)
        if (success) {
            // Optionally show feedback
        }
    }

    // Category grid view
    if (!selectedPenId) {
        return (
            <div className="pen-view-overlay">
                <div className="pen-view">
                    <header className="pen-view-header">
                        <h1>The Playpen</h1>
                        <button className="close-button" onClick={onClose}>✕</button>
                    </header>

                    <div className="pen-grid">
                        {pens.map(pen => {
                            const count = getItemsForPen(pen.id).length
                            return (
                                <button
                                    key={pen.id}
                                    className="pen-card"
                                    onClick={() => setSelectedPenId(pen.id)}
                                >
                                    <span className="pen-card-emoji">{pen.emoji}</span>
                                    <span className="pen-card-name">{pen.name}</span>
                                    <span className="pen-card-count">{count} item{count !== 1 ? 's' : ''}</span>
                                </button>
                            )
                        })}

                        {uncategorizedItems.length > 0 && (
                            <button
                                className="pen-card uncategorized"
                                onClick={() => setSelectedPenId('uncategorized')}
                            >
                                <span className="pen-card-emoji">📝</span>
                                <span className="pen-card-name">Uncategorized</span>
                                <span className="pen-card-count">{uncategorizedItems.length} item{uncategorizedItems.length !== 1 ? 's' : ''}</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    // Detail view for selected pen
    const selectedPen = pens.find(p => p.id === selectedPenId)
    const selectedItems = selectedPenId === 'uncategorized'
        ? uncategorizedItems
        : getItemsForPen(selectedPenId)

    return (
        <div className="pen-view-overlay">
            <div className="pen-view">
                <header className="pen-view-header">
                    <button className="back-button" onClick={() => setSelectedPenId(null)}>
                        ← Back
                    </button>
                    <h1>
                        {selectedPen?.emoji || '📝'} {selectedPen?.name || 'Uncategorized'}
                    </h1>
                    <button className="close-button" onClick={onClose}>✕</button>
                </header>

                <div className="item-cards">
                    {selectedItems.length === 0 ? (
                        <div className="empty-state">
                            <p>No items in this pen</p>
                        </div>
                    ) : (
                        selectedItems.map(item => (
                            <div key={item.id} className="item-card">
                                <div className="item-card-content">
                                    <h3 className="item-card-title">{item.title}</h3>
                                    <div className="item-card-meta">
                                        {item.due_date && (
                                            <span className="due-badge">
                                                Due {new Date(item.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </span>
                                        )}
                                        {item.recurrence_rule && (
                                            <span className="recurrence-badge">🔄 Recurring</span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    className="add-today-pill"
                                    onClick={() => handlePullToFocus(item.id)}
                                >
                                    Add to today
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
