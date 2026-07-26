import { useState } from "react"
import type { Pen } from "@/hooks/usePens"
import type { Item } from "@/hooks/useItems"
import "./ThePen.css"

interface ThePenProps {
    pens: Pen[]
    items: Item[] // Backlog items only (no focus_date, not completed)
    onPullToFocus: (itemId: string) => Promise<boolean>
    onAddGroceriesToFocus?: (penId: string) => Promise<void>
}

// Detect if a pen is the Groceries pen
const isGroceriesPen = (pen: Pen) => {
    return pen.emoji === '🛒' || pen.name.toLowerCase().includes('grocer')
}

export function ThePen({ pens, items, onPullToFocus, onAddGroceriesToFocus }: ThePenProps) {
    const [expandedPenId, setExpandedPenId] = useState<string | null>(null)

    // Group items by pen
    const getItemsForPen = (penId: string) => {
        return items.filter(item => item.pen_id === penId)
    }

    // Items without a pen
    const uncategorizedItems = items.filter(item => !item.pen_id)

    const handlePenClick = (penId: string) => {
        setExpandedPenId(expandedPenId === penId ? null : penId)
    }

    return (
        <section className="the-pen">
            <div className="pen-header">
                <h2>THE PEN</h2>
            </div>

            <div className="pen-categories">
                {pens.map(pen => {
                    const penItems = getItemsForPen(pen.id)
                    const isExpanded = expandedPenId === pen.id
                    const isGrocery = isGroceriesPen(pen)

                    return (
                        <div key={pen.id} className={`pen-category ${isGrocery ? 'grocery-category' : ''}`}>
                            <button
                                className={`pen-category-header ${isExpanded ? 'expanded' : ''}`}
                                onClick={() => handlePenClick(pen.id)}
                            >
                                <span className="pen-emoji">{pen.emoji}</span>
                                <span className="pen-name">{pen.name}</span>
                                <span className="pen-count">({penItems.length})</span>
                                <span className="pen-chevron">{isExpanded ? '▼' : '▶'}</span>
                            </button>

                            {/* Special Groceries "Add all to today" button */}
                            {isGrocery && penItems.length > 0 && onAddGroceriesToFocus && (
                                <button
                                    className="add-groceries-button"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onAddGroceriesToFocus(pen.id)
                                    }}
                                >
                                    🛒 Add grocery run to today
                                </button>
                            )}

                            {isExpanded && (
                                <div className="pen-items">
                                    {penItems.length === 0 ? (
                                        <div className="pen-empty">No items</div>
                                    ) : (
                                        penItems.map(item => (
                                            <PenItem
                                                key={item.id}
                                                item={item}
                                                onPull={() => onPullToFocus(item.id)}
                                            />
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}

                {/* Uncategorized items */}
                {uncategorizedItems.length > 0 && (
                    <div className="pen-category">
                        <button
                            className={`pen-category-header ${expandedPenId === 'uncategorized' ? 'expanded' : ''}`}
                            onClick={() => handlePenClick('uncategorized')}
                        >
                            <span className="pen-emoji">📝</span>
                            <span className="pen-name">Uncategorized</span>
                            <span className="pen-count">({uncategorizedItems.length})</span>
                            <span className="pen-chevron">{expandedPenId === 'uncategorized' ? '▼' : '▶'}</span>
                        </button>

                        {expandedPenId === 'uncategorized' && (
                            <div className="pen-items">
                                {uncategorizedItems.map(item => (
                                    <PenItem
                                        key={item.id}
                                        item={item}
                                        onPull={() => onPullToFocus(item.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    )
}

// Simple pen item with "Add to today" pill
interface PenItemProps {
    item: Item
    onPull: () => void
}

function PenItem({ item, onPull }: PenItemProps) {
    return (
        <div className="pen-item">
            <div className="pen-item-content">
                <span className="pen-item-title">{item.title}</span>
                {item.due_date && (
                    <span className="due-badge">Due {new Date(item.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                )}
                {item.recurrence_rule && (
                    <span className="recurrence-badge" title="Recurring">🔄</span>
                )}
            </div>
            <button className="add-today-pill" onClick={onPull}>
                Add to today
            </button>
        </div>
    )
}

