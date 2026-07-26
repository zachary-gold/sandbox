import { useEffect, useState } from "react"
import { format } from "date-fns"
import { usePens, type Pen } from "@/hooks/usePens"
import { useItems } from "@/hooks/useItems"
import { useDailyNotes } from "@/hooks/useDailyNotes"
import { FocusItem } from "./FocusItem"
import { ThePen } from "./ThePen"
import { DailyNotePrompt } from "./DailyNotePrompt"
import { DailyNoteBanner } from "./DailyNoteBanner"
import { QuickAddSheet } from "./QuickAddSheet"
import { PenView } from "./PenView"
import type { SimpleUser } from "./UserPicker"
import { PLAYPEN_ID } from "./UserPicker"
import "./FocusView.css"

interface FocusViewProps {
    userId: string
    currentUser: SimpleUser
    partner: SimpleUser | null
    onLogout: () => void
}

export function FocusView({ userId, currentUser, partner, onLogout }: FocusViewProps) {
    const { pens } = usePens(PLAYPEN_ID)
    const {
        items,
        getFocusItems,
        toggleComplete,
        toggleClaim,
        pullToFocus,
        performRollover,
        createItem,
        pullGroceriesToFocus,
        scheduleRecurringItems
    } = useItems(PLAYPEN_ID, userId)
    const { partnerNote, shouldShowNotePrompt, saveNote, skipNote } = useDailyNotes(PLAYPEN_ID, userId)

    const [showNotePrompt, setShowNotePrompt] = useState(false)
    const [showQuickAdd, setShowQuickAdd] = useState(false)
    const [showPenView, setShowPenView] = useState(false)
    const [rolloverCount, setRolloverCount] = useState(0)

    // Check for note prompt, perform rollover, and schedule recurring items on first load
    useEffect(() => {
        const onLoad = async () => {
            // Schedule recurring items first
            await scheduleRecurringItems()
            // Then perform rollover
            const count = await performRollover()
            if (count > 0) setRolloverCount(count)
            // Finally check for note prompt
            if (shouldShowNotePrompt()) {
                setShowNotePrompt(true)
            }
        }
        onLoad()
    }, [])

    const focusItems = getFocusItems()
    const completedItems = focusItems.filter(item => item.completed_at)
    const pendingItems = focusItems.filter(item => !item.completed_at)
    const backlogItems = items.filter(i => !i.focus_date && !i.completed_at)

    // Get pen info for an item
    const getPenForItem = (penId: string | null): Pen | null => {
        if (!penId) return null
        return pens.find(p => p.id === penId) || null
    }

    // Find partner's emoji for claims
    const getClaimerEmoji = (claimedBy: string | null) => {
        if (!claimedBy) return null
        if (claimedBy === userId) return currentUser.emoji
        return partner?.emoji || "💕"
    }

    const handleNoteSend = async (message: string) => {
        await saveNote(message)
        setShowNotePrompt(false)
    }

    const handleNoteSkip = () => {
        skipNote()
        setShowNotePrompt(false)
    }

    const handleQuickAdd = async (title: string, penId: string | null, dueDate: string | null, recurrence: string | null) => {
        await createItem({
            title,
            pen_id: penId || undefined,
            due_date: dueDate || undefined,
            recurrence_rule: recurrence || undefined
        })
        setShowQuickAdd(false)
    }

    return (
        <div className="focus-view">
            {/* Header */}
            <header className="focus-header">
                <h1 className="focus-title">PLAYPEN</h1>
                <div className="header-right">
                    {partner && (
                        <div className="partner-avatar" title={partner.name}>
                            {partner.emoji}
                        </div>
                    )}
                    <button className="user-badge" onClick={onLogout} title="Switch user">
                        {currentUser.emoji}
                    </button>
                </div>
            </header>

            {/* Partner's daily note */}
            {partnerNote && <DailyNoteBanner note={partnerNote.message || ""} />}

            {/* Rollover notification */}
            {rolloverCount > 0 && (
                <div className="rollover-notice">
                    ⚠️ {rolloverCount} item{rolloverCount > 1 ? 's' : ''} rolled over from yesterday
                </div>
            )}

            {/* Today's Focus section */}
            <section className="focus-section">
                <div className="section-header">
                    <h2>TODAY'S FOCUS</h2>
                    <span className="focus-date">{format(new Date(), "MMM d")}</span>
                </div>

                {focusItems.length === 0 ? (
                    <div className="focus-empty">
                        <p>Nothing on focus today.</p>
                        <p className="focus-empty-hint">Pull items from The Pen below!</p>
                    </div>
                ) : (
                    <div className="focus-items">
                        {/* Pending items first */}
                        {pendingItems.map(item => (
                            <FocusItem
                                key={item.id}
                                item={item}
                                pen={getPenForItem(item.pen_id)}
                                claimerEmoji={getClaimerEmoji(item.claimed_by)}
                                isOverdue={!!item.original_focus_date && item.original_focus_date !== item.focus_date}
                                onToggleComplete={() => toggleComplete(item.id)}
                                onToggleClaim={() => toggleClaim(item.id)}
                            />
                        ))}
                        {/* Completed items (greyed) */}
                        {completedItems.map(item => (
                            <FocusItem
                                key={item.id}
                                item={item}
                                pen={getPenForItem(item.pen_id)}
                                claimerEmoji={getClaimerEmoji(item.claimed_by)}
                                isOverdue={false}
                                onToggleComplete={() => toggleComplete(item.id)}
                                onToggleClaim={() => toggleClaim(item.id)}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Divider */}
            <div className="section-divider" />

            {/* The Pen section */}
            <ThePen
                pens={pens}
                items={items.filter(i => !i.focus_date && !i.completed_at)}
                onPullToFocus={pullToFocus}
                onAddGroceriesToFocus={pullGroceriesToFocus}
            />

            {/* Fixed bottom bar */}
            <nav className="bottom-bar">
                <button className="add-button" onClick={() => setShowQuickAdd(true)}>
                    + Add
                </button>
                <button className="see-playpen-button" onClick={() => setShowPenView(true)}>
                    🐷 See Playpen
                </button>
            </nav>

            {/* Daily note prompt modal */}
            {showNotePrompt && (
                <DailyNotePrompt
                    partnerName={partner?.name || "your partner"}
                    onSend={handleNoteSend}
                    onSkip={handleNoteSkip}
                />
            )}

            {/* Quick add sheet */}
            {showQuickAdd && (
                <QuickAddSheet
                    pens={pens}
                    onAdd={handleQuickAdd}
                    onClose={() => setShowQuickAdd(false)}
                />
            )}

            {/* Full-screen Pen view */}
            {showPenView && (
                <PenView
                    pens={pens}
                    items={backlogItems}
                    onPullToFocus={pullToFocus}
                    onClose={() => setShowPenView(false)}
                />
            )}
        </div>
    )
}
