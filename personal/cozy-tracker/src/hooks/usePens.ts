import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { PLAYPEN_ID } from "@/components/UserPicker"

export interface Pen {
    id: string
    playpen_id: string
    name: string
    emoji: string
    sort_order: number
    created_at: string
}

export function usePens(playpenId: string | undefined) {
    const [pens, setPens] = useState<Pen[]>([])
    const [loading, setLoading] = useState(true)

    const fetchPens = useCallback(async () => {
        const id = playpenId || PLAYPEN_ID

        try {
            const { data, error } = await supabase
                .from("pens")
                .select("*")
                .eq("playpen_id", id)
                .order("sort_order")

            if (error) throw error
            setPens(data || [])
        } catch (err) {
            console.error("Error fetching pens:", err)
        } finally {
            setLoading(false)
        }
    }, [playpenId])

    useEffect(() => {
        fetchPens()
    }, [fetchPens])

    const createPen = async (name: string, emoji: string): Promise<Pen | null> => {
        const id = playpenId || PLAYPEN_ID

        try {
            const maxOrder = pens.reduce((max, p) => Math.max(max, p.sort_order), 0)

            const { data, error } = await supabase
                .from("pens")
                .insert({
                    playpen_id: id,
                    name,
                    emoji,
                    sort_order: maxOrder + 1
                })
                .select()
                .single()

            if (error) throw error
            await fetchPens()
            return data
        } catch (err) {
            console.error("Error creating pen:", err)
            return null
        }
    }

    const updatePen = async (penId: string, updates: Partial<Pen>): Promise<boolean> => {
        try {
            const { error } = await supabase
                .from("pens")
                .update(updates)
                .eq("id", penId)

            if (error) throw error
            await fetchPens()
            return true
        } catch (err) {
            console.error("Error updating pen:", err)
            return false
        }
    }

    const deletePen = async (penId: string): Promise<boolean> => {
        try {
            const { error } = await supabase
                .from("pens")
                .delete()
                .eq("id", penId)

            if (error) throw error
            await fetchPens()
            return true
        } catch (err) {
            console.error("Error deleting pen:", err)
            return false
        }
    }

    return {
        pens,
        loading,
        createPen,
        updatePen,
        deletePen,
        refetch: fetchPens
    }
}
