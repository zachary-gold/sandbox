import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"

export interface Listable {
    id: string
    board_id: string
    name: string
    color: string
    created_at: string
}

export function useListables(boardId: string | undefined) {
    const [listables, setListables] = useState<Listable[]>([])
    const [loading, setLoading] = useState(true)

    const fetchListables = useCallback(async () => {
        if (!boardId) return

        const { data, error } = await supabase
            .from("listables")
            .select("*")
            .eq("board_id", boardId)
            .order("name", { ascending: true })

        if (error) {
            console.error("Error fetching listables:", error)
        } else {
            setListables(data || [])
        }
        setLoading(false)
    }, [boardId])

    const createListable = async (name: string, color: string) => {
        if (!boardId) return null

        const { data, error } = await supabase
            .from("listables")
            .insert([{ name, color, board_id: boardId }])
            .select()
            .single()

        if (error) {
            console.error("Error creating listable:", error)
            return null
        }

        setListables(prev => [...prev, data])
        return data
    }

    const updateListable = async (id: string, updates: { name?: string; color?: string }) => {
        const { error } = await supabase
            .from("listables")
            .update(updates)
            .eq("id", id)

        if (error) {
            console.error("Error updating listable:", error)
            return false
        }

        setListables(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l))
        return true
    }

    const deleteListable = async (id: string) => {
        const { error } = await supabase
            .from("listables")
            .delete()
            .eq("id", id)

        if (error) {
            console.error("Error deleting listable:", error)
            return false
        }

        setListables(prev => prev.filter(l => l.id !== id))
        return true
    }

    useEffect(() => {
        fetchListables()
    }, [fetchListables])

    return {
        listables,
        loading,
        createListable,
        updateListable,
        deleteListable,
        refresh: fetchListables
    }
}
