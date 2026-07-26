import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { PLAYPEN_ID } from "@/components/UserPicker"

export interface DailyNote {
    id: string
    playpen_id: string
    user_id: string
    note_date: string
    message: string | null
    created_at: string
}

const LAST_OPEN_KEY = "playpen_last_open"

export function useDailyNotes(playpenId: string | undefined, userId: string | undefined) {
    const [notes, setNotes] = useState<DailyNote[]>([])
    const [partnerNote, setPartnerNote] = useState<DailyNote | null>(null)
    const [loading, setLoading] = useState(true)

    const today = format(new Date(), "yyyy-MM-dd")

    const fetchNotes = useCallback(async () => {
        const id = playpenId || PLAYPEN_ID

        try {
            const { data, error } = await supabase
                .from("daily_notes")
                .select("*")
                .eq("playpen_id", id)
                .eq("note_date", today)

            if (error) throw error
            setNotes(data || [])

            // Find partner's note (not from current user)
            if (userId) {
                const pNote = data?.find(n => n.user_id !== userId) || null
                setPartnerNote(pNote)
            }
        } catch (err) {
            console.error("Error fetching daily notes:", err)
        } finally {
            setLoading(false)
        }
    }, [playpenId, userId, today])

    useEffect(() => {
        fetchNotes()
    }, [fetchNotes])

    // Check if we should show the note prompt (first open of the day)
    const shouldShowNotePrompt = (): boolean => {
        const lastOpen = localStorage.getItem(LAST_OPEN_KEY)
        if (lastOpen === today) return false

        // Mark today as opened
        localStorage.setItem(LAST_OPEN_KEY, today)
        return true
    }

    // Save today's note
    const saveNote = async (message: string): Promise<boolean> => {
        if (!userId) return false
        const id = playpenId || PLAYPEN_ID

        try {
            const { error } = await supabase
                .from("daily_notes")
                .upsert({
                    playpen_id: id,
                    user_id: userId,
                    note_date: today,
                    message
                }, {
                    onConflict: "playpen_id,user_id,note_date"
                })

            if (error) throw error
            await fetchNotes()
            return true
        } catch (err) {
            console.error("Error saving note:", err)
            return false
        }
    }

    // Skip today's prompt without saving
    const skipNote = () => {
        localStorage.setItem(LAST_OPEN_KEY, today)
    }

    return {
        notes,
        partnerNote,
        loading,
        shouldShowNotePrompt,
        saveNote,
        skipNote,
        refetch: fetchNotes
    }
}
