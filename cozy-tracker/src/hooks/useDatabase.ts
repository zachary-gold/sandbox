import { useState, useEffect, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { format, startOfWeek, endOfWeek, addDays } from "date-fns"

export function useDatabase(userId: string | undefined) {
    const [cards, setCards] = useState<any[]>([])
    const [backlogItems, setBacklogItems] = useState<any[]>([])
    const [routines, setRoutines] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Track current week for refreshes
    const currentWeekRef = useRef<Date>(new Date())

    const fetchCards = useCallback(async (startDate: Date = new Date()) => {
        if (!userId) return
        currentWeekRef.current = startDate

        const weekStart = startOfWeek(startDate, { weekStartsOn: 1 })
        const weekEnd = endOfWeek(startDate, { weekStartsOn: 1 })
        const weekStartStr = format(weekStart, "yyyy-MM-dd")
        const weekEndStr = format(weekEnd, "yyyy-MM-dd")

        const { data, error } = await supabase
            .from("cards")
            .select("*")
            .or(`date.gte.${weekStartStr},date.lte.${weekEndStr},date.is.null,is_recurring_template.eq.true`)
            .order("created_at", { ascending: true })

        if (error) {
            console.error("Error fetching cards:", error)
            setLoading(false)
            return
        }

        const templates = data.filter(c => c.is_recurring_template && c.is_active !== false)
        const allInstances = data.filter(c => !c.is_recurring_template && c.date !== null)
        const activeInstances = allInstances.filter(c => c.status !== 'cancelled')
        const backlog = data.filter(c => !c.is_recurring_template && c.date === null && c.status !== 'cancelled')

        // Generate Just-In-Time instances for the requested week
        for (const template of templates) {
            const days = template.recurrence_rule?.split("BYDAY=")[1]?.split(",") || []
            for (let i = 0; i < 7; i++) {
                const d = addDays(weekStart, i)
                const dStr = format(d, "yyyy-MM-dd")
                const dayCode = format(d, "EEEEEE").toUpperCase()

                if (days.includes(dayCode)) {
                    // Check if ANY instance exists (including cancelled) - don't recreate cancelled ones
                    const exists = allInstances.some(ins => ins.template_id === template.id && ins.date === dStr)
                    if (!exists) {
                        try {
                            const newInstance = await addCardToServer({
                                title: template.title,
                                description: template.description,
                                date: dStr,
                                tags: template.tags,
                                board_id: template.board_id,
                                template_id: template.id,
                                assigned_to: template.assigned_to,
                                assigned_to_both: template.assigned_to_both,
                                scheduled_time: template.scheduled_time
                            })
                            if (newInstance && newInstance[0]) {
                                activeInstances.push(newInstance[0])
                            }
                        } catch (e) {
                            console.error("Error creating recurring instance:", e)
                        }
                    }
                }
            }
        }

        setCards(activeInstances)
        setBacklogItems(backlog)
        setRoutines(templates.filter(t => t.is_active !== false)) // Only active routines for JIT
        setLoading(false)
    }, [userId])

    // Fetch all routines (including paused) for the drawer
    const fetchRoutines = useCallback(async () => {
        if (!userId) return

        const { data, error } = await supabase
            .from("cards")
            .select("*")
            .eq("is_recurring_template", true)
            .order("created_at", { ascending: false })

        if (error) {
            console.error("Error fetching routines:", error)
            return
        }

        setRoutines(data || [])
    }, [userId])

    // Low-level server operation (no optimistic update)
    const addCardToServer = async (card: any) => {
        const { data, error } = await supabase
            .from("cards")
            .insert([{ ...card, created_by: userId }])
            .select()

        if (error) {
            console.error("Error adding card:", error)
            throw error
        }
        return data
    }

    // Optimistic add card
    const addCard = useCallback(async (card: any) => {
        // Generate optimistic card with temp ID
        const tempId = `temp-${Date.now()}`
        const optimisticCard = {
            ...card,
            id: tempId,
            created_by: userId,
            created_at: new Date().toISOString(),
            status: card.status || 'todo'
        }

        // Optimistically add to state
        if (card.date === null) {
            setBacklogItems(prev => [...prev, optimisticCard])
        } else {
            setCards(prev => [...prev, optimisticCard])
        }

        try {
            const data = await addCardToServer(card)

            // Replace temp card with real one
            if (data && data[0]) {
                if (card.date === null) {
                    setBacklogItems(prev => prev.map(c => c.id === tempId ? data[0] : c))
                } else {
                    setCards(prev => prev.map(c => c.id === tempId ? data[0] : c))
                }
            }
            return data
        } catch (error: any) {
            // Rollback on error
            if (card.date === null) {
                setBacklogItems(prev => prev.filter(c => c.id !== tempId))
            } else {
                setCards(prev => prev.filter(c => c.id !== tempId))
            }
            alert(`Error adding card: ${error.message}\n\nDetails in console.`)
            return null
        }
    }, [userId])

    // Optimistic update card
    const updateCard = useCallback(async (id: string, updates: any) => {
        // Store previous states for rollback
        const prevCards = cards
        const prevBacklog = backlogItems

        // Optimistically update
        setCards(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
        setBacklogItems(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))

        const { error } = await supabase
            .from("cards")
            .update(updates)
            .eq("id", id)

        if (error) {
            console.error("Error updating card:", error)
            // Rollback
            setCards(prevCards)
            setBacklogItems(prevBacklog)
        }
    }, [cards, backlogItems])

    // Optimistic delete card (soft-delete for template instances, hard-delete for others)
    const deleteCard = useCallback(async (id: string) => {
        // Store previous states for rollback
        const prevCards = cards
        const prevBacklog = backlogItems

        // Find the card to determine if it's a template instance
        const cardToDelete = [...cards, ...backlogItems].find(c => c.id === id)
        const isTemplateInstance = cardToDelete?.template_id !== null && cardToDelete?.template_id !== undefined

        // Optimistically remove from UI
        setCards(prev => prev.filter(c => c.id !== id))
        setBacklogItems(prev => prev.filter(c => c.id !== id))

        let error
        if (isTemplateInstance) {
            // Soft-delete: mark as cancelled so JIT doesn't recreate
            const result = await supabase
                .from("cards")
                .update({ status: 'cancelled' })
                .eq("id", id)
            error = result.error
        } else {
            // Hard-delete for non-template cards
            const result = await supabase
                .from("cards")
                .delete()
                .eq("id", id)
            error = result.error
        }

        if (error) {
            console.error("Error deleting card:", error)
            // Rollback
            setCards(prevCards)
            setBacklogItems(prevBacklog)
            alert(`Error deleting card: ${error.message}`)
        }
    }, [cards, backlogItems])

    // Optimistic completion
    const completeCard = useCallback(async (id: string) => {
        const prevCards = cards
        const now = new Date().toISOString()

        // Optimistic update
        setCards(prev => prev.map(c => c.id === id ? { ...c, completed_at: now } : c))

        const { error } = await supabase
            .from("cards")
            .update({ completed_at: now })
            .eq("id", id)

        if (error) {
            console.error("Error completing card:", error)
            setCards(prevCards)
        }
    }, [cards])

    const uncompleteCard = useCallback(async (id: string) => {
        const prevCards = cards

        // Optimistic update
        setCards(prev => prev.map(c => c.id === id ? { ...c, completed_at: null } : c))

        const { error } = await supabase
            .from("cards")
            .update({ completed_at: null })
            .eq("id", id)

        if (error) {
            console.error("Error uncompleting card:", error)
            setCards(prevCards)
        }
    }, [cards])

    useEffect(() => {
        fetchCards()
        fetchRoutines()

        // Real-time subscription for multi-device sync
        const subscription = supabase
            .channel("db-changes")
            .on("postgres_changes", { event: "*", schema: "public", table: "cards" }, () => {
                // Only refresh on external changes, not our own optimistic updates
                fetchCards(currentWeekRef.current)
                fetchRoutines()
            })
            .subscribe()

        return () => {
            subscription.unsubscribe()
        }
    }, [userId, fetchCards, fetchRoutines])

    return {
        cards,
        backlogItems,
        routines,
        loading,
        addCard,
        updateCard,
        deleteCard,
        completeCard,
        uncompleteCard,
        refresh: fetchCards,
        refreshRoutines: fetchRoutines
    }
}
