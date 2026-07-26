import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { PLAYPEN_ID } from "@/components/UserPicker"

export interface ProjectStep {
    id: string
    title: string
    completed: boolean
}

export interface Item {
    id: string
    playpen_id: string
    pen_id: string | null
    title: string
    focus_date: string | null
    due_date: string | null
    scheduled_time: string | null
    recurrence_rule: string | null
    recurrence_paused: boolean
    is_project: boolean
    project_steps: ProjectStep[] | null
    project_start_date: string | null
    claimed_by: string | null
    completed_at: string | null
    original_focus_date: string | null
    archived_at: string | null
    created_at: string
    created_by: string | null
}

export function useItems(playpenId: string | undefined, userId: string | undefined) {
    const [items, setItems] = useState<Item[]>([])
    const [loading, setLoading] = useState(true)

    const fetchItems = useCallback(async () => {
        const id = playpenId || PLAYPEN_ID

        try {
            const { data, error } = await supabase
                .from("items")
                .select("*")
                .eq("playpen_id", id)
                .is("archived_at", null)
                .order("created_at", { ascending: false })

            if (error) throw error
            setItems(data || [])
        } catch (err) {
            console.error("Error fetching items:", err)
        } finally {
            setLoading(false)
        }
    }, [playpenId])

    useEffect(() => {
        fetchItems()
    }, [fetchItems])

    // Get items with a focus_date for today
    const getFocusItems = () => {
        const today = format(new Date(), "yyyy-MM-dd")
        return items.filter(item => item.focus_date === today)
    }

    // Get backlog items (no focus_date, not completed)
    const getBacklogItems = () => {
        return items.filter(item => !item.focus_date && !item.completed_at)
    }

    // Toggle completion
    const toggleComplete = async (itemId: string): Promise<boolean> => {
        const item = items.find(i => i.id === itemId)
        if (!item) return false

        const newCompletedAt = item.completed_at ? null : new Date().toISOString()

        try {
            const { error } = await supabase
                .from("items")
                .update({ completed_at: newCompletedAt })
                .eq("id", itemId)

            if (error) throw error

            // Haptic feedback on complete
            if (newCompletedAt && navigator.vibrate) {
                navigator.vibrate(50)
            }

            await fetchItems()
            return true
        } catch (err) {
            console.error("Error toggling complete:", err)
            return false
        }
    }

    // Toggle claim (assign to current user)
    const toggleClaim = async (itemId: string): Promise<boolean> => {
        if (!userId) return false

        const item = items.find(i => i.id === itemId)
        if (!item) return false

        const newClaimedBy = item.claimed_by === userId ? null : userId

        try {
            const { error } = await supabase
                .from("items")
                .update({ claimed_by: newClaimedBy })
                .eq("id", itemId)

            if (error) throw error
            await fetchItems()
            return true
        } catch (err) {
            console.error("Error toggling claim:", err)
            return false
        }
    }

    // Pull item to today's focus
    const pullToFocus = async (itemId: string): Promise<boolean> => {
        const today = format(new Date(), "yyyy-MM-dd")

        try {
            const { error } = await supabase
                .from("items")
                .update({
                    focus_date: today,
                    original_focus_date: today
                })
                .eq("id", itemId)

            if (error) throw error
            await fetchItems()
            return true
        } catch (err) {
            console.error("Error pulling to focus:", err)
            return false
        }
    }

    // Rollover: move uncompleted items from yesterday to today
    const performRollover = async (): Promise<number> => {
        const today = format(new Date(), "yyyy-MM-dd")
        const id = playpenId || PLAYPEN_ID

        try {
            // Find items with focus_date before today that aren't completed
            const { data: overdueItems, error: fetchError } = await supabase
                .from("items")
                .select("id")
                .eq("playpen_id", id)
                .lt("focus_date", today)
                .is("completed_at", null)
                .is("archived_at", null)

            if (fetchError) throw fetchError
            if (!overdueItems || overdueItems.length === 0) return 0

            // Update them to today
            const { error: updateError } = await supabase
                .from("items")
                .update({ focus_date: today })
                .in("id", overdueItems.map(i => i.id))

            if (updateError) throw updateError
            await fetchItems()
            return overdueItems.length
        } catch (err) {
            console.error("Error performing rollover:", err)
            return 0
        }
    }

    // Create a new item
    const createItem = async (data: {
        title: string
        pen_id?: string
        focus_date?: string
        due_date?: string
        recurrence_rule?: string
        is_project?: boolean
        project_steps?: ProjectStep[]
    }): Promise<Item | null> => {
        const id = playpenId || PLAYPEN_ID

        try {
            const { data: newItem, error } = await supabase
                .from("items")
                .insert({
                    playpen_id: id,
                    title: data.title,
                    pen_id: data.pen_id || null,
                    focus_date: data.focus_date || null,
                    due_date: data.due_date || null,
                    recurrence_rule: data.recurrence_rule || null,
                    is_project: data.is_project || false,
                    project_steps: data.project_steps || null,
                    created_by: userId || null
                })
                .select()
                .single()

            if (error) throw error
            await fetchItems()
            return newItem
        } catch (err) {
            console.error("Error creating item:", err)
            return null
        }
    }

    // Update project steps (for project items)
    const updateProjectSteps = async (itemId: string, steps: ProjectStep[]): Promise<boolean> => {
        try {
            const { error } = await supabase
                .from("items")
                .update({ project_steps: steps })
                .eq("id", itemId)

            if (error) throw error
            await fetchItems()
            return true
        } catch (err) {
            console.error("Error updating project steps:", err)
            return false
        }
    }

    // Pull all items from a pen (e.g., Groceries) to today's focus
    const pullGroceriesToFocus = async (penId: string): Promise<void> => {
        const today = format(new Date(), "yyyy-MM-dd")
        const groceryItems = items.filter(i => i.pen_id === penId && !i.focus_date && !i.completed_at)

        if (groceryItems.length === 0) return

        try {
            const { error } = await supabase
                .from("items")
                .update({ focus_date: today, original_focus_date: today })
                .in("id", groceryItems.map(i => i.id))

            if (error) throw error
            await fetchItems()
        } catch (err) {
            console.error("Error pulling groceries to focus:", err)
        }
    }

    // Schedule recurring items for today if they match the recurrence rule
    const scheduleRecurringItems = async (): Promise<number> => {
        const today = new Date()
        const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase() // mon, tue, etc.
        const todayStr = format(today, "yyyy-MM-dd")
        const id = playpenId || PLAYPEN_ID

        try {
            // Get all recurring items that aren't paused
            const { data: recurringItems, error } = await supabase
                .from("items")
                .select("*")
                .eq("playpen_id", id)
                .not("recurrence_rule", "is", null)
                .eq("recurrence_paused", false)
                .is("archived_at", null)

            if (error) throw error
            if (!recurringItems || recurringItems.length === 0) return 0

            let scheduled = 0

            for (const item of recurringItems) {
                // Skip if already scheduled for today
                if (item.focus_date === todayStr) continue

                // Parse recurrence rule: "daily" or "weekly:mon,wed,fri"
                const rule = item.recurrence_rule as string
                let shouldSchedule = false

                if (rule === 'daily') {
                    shouldSchedule = true
                } else if (rule.startsWith('weekly:')) {
                    const days = rule.replace('weekly:', '').split(',').map(d => d.trim().toLowerCase())
                    shouldSchedule = days.includes(dayOfWeek)
                }

                if (shouldSchedule) {
                    const { error: updateError } = await supabase
                        .from("items")
                        .update({ focus_date: todayStr, original_focus_date: todayStr, completed_at: null })
                        .eq("id", item.id)

                    if (!updateError) scheduled++
                }
            }

            if (scheduled > 0) await fetchItems()
            return scheduled
        } catch (err) {
            console.error("Error scheduling recurring items:", err)
            return 0
        }
    }

    return {
        items,
        loading,
        getFocusItems,
        getBacklogItems,
        toggleComplete,
        toggleClaim,
        pullToFocus,
        performRollover,
        createItem,
        updateProjectSteps,
        pullGroceriesToFocus,
        scheduleRecurringItems,
        refetch: fetchItems
    }
}
