import type { Item } from "@/hooks/useItems"
import type { Pen } from "@/hooks/usePens"
import "./FocusItem.css"

interface FocusItemProps {
    item: Item
    pen: Pen | null
    claimerEmoji: string | null
    isOverdue: boolean
    onToggleComplete: () => void
    onToggleClaim: () => void
}

export function FocusItem({
    item,
    pen,
    claimerEmoji,
    isOverdue,
    onToggleComplete,
    onToggleClaim
}: FocusItemProps) {
    const isCompleted = !!item.completed_at

    // Trigger haptic feedback on iOS
    const triggerHaptic = () => {
        if ('vibrate' in navigator) {
            navigator.vibrate(10)
        }
    }

    const handleCheckboxClick = () => {
        triggerHaptic()
        onToggleComplete()
    }

    return (
        <div className={`focus-item ${isCompleted ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`}>
            {/* Checkbox */}
            <button
                className={`item-checkbox ${isCompleted ? 'checked' : ''}`}
                onClick={handleCheckboxClick}
                aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
            >
                {isCompleted ? '☑' : '☐'}
            </button>

            {/* Content */}
            <div className="item-content">
                <span className={`item-title ${isCompleted ? 'strikethrough' : ''}`}>
                    {item.title}
                    {item.scheduled_time && (
                        <span className="item-time"> @ {item.scheduled_time.slice(0, 5)}</span>
                    )}
                </span>
                {isOverdue && <span className="overdue-badge" title="Rolled over">⚠️</span>}
            </div>

            {/* Pen emoji */}
            {pen && (
                <span className="item-pen-emoji" title={pen.name}>
                    {pen.emoji}
                </span>
            )}

            {/* Claim avatar */}
            <button
                className={`item-claim ${claimerEmoji ? 'claimed' : ''}`}
                onClick={onToggleClaim}
                aria-label={claimerEmoji ? "Unclaim" : "Claim"}
            >
                {claimerEmoji || <span className="claim-placeholder">👤</span>}
            </button>
        </div>
    )
}

// Nested grocery items component
interface GroceryNestedItemProps {
    items: Item[]
    onToggleComplete: (itemId: string) => void
}

export function GroceryNestedItems({ items, onToggleComplete }: GroceryNestedItemProps) {
    return (
        <div className="grocery-nested">
            {items.map(item => (
                <div
                    key={item.id}
                    className={`grocery-item ${item.completed_at ? 'completed' : ''}`}
                    onClick={() => onToggleComplete(item.id)}
                >
                    <span className="grocery-bullet">
                        {item.completed_at ? '●' : '○'}
                    </span>
                    <span className={`grocery-title ${item.completed_at ? 'strikethrough' : ''}`}>
                        {item.title}
                    </span>
                </div>
            ))}
        </div>
    )
}

// Project card with steps
interface ProjectCardProps {
    item: Item
    onToggleStep: (stepIndex: number) => void
}

export function ProjectCard({ item, onToggleStep }: ProjectCardProps) {
    if (!item.project_steps) return null

    const completedCount = item.project_steps.filter(s => s.completed).length
    const totalSteps = item.project_steps.length

    return (
        <div className="project-card">
            <div className="project-header">
                <span className="project-title">{item.title}</span>
                <span className="project-progress">
                    Day {completedCount + 1}/{totalSteps}
                </span>
            </div>
            <div className="project-steps">
                {item.project_steps.map((step, index) => (
                    <div
                        key={index}
                        className={`project-step ${step.completed ? 'completed' : ''} ${index === completedCount ? 'current' : ''}`}
                        onClick={() => onToggleStep(index)}
                    >
                        <span className="step-checkbox">
                            {step.completed ? '☑' : index <= completedCount ? '☐' : '○'}
                        </span>
                        <span className={`step-title ${step.completed ? 'strikethrough' : ''}`}>
                            {step.title}
                            {index === completedCount && !step.completed && (
                                <span className="step-current-badge">today</span>
                            )}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}
