import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"

export interface Playpen {
    id: string
    name: string
    invite_code: string
    created_at: string
}

export interface PlaypenMember {
    id: string
    playpen_id: string
    user_id: string
    display_name: string | null
    avatar_emoji: string
    joined_at: string
}

export function usePlaypen(userId: string | undefined) {
    const [playpen, setPlaypen] = useState<Playpen | null>(null)
    const [members, setMembers] = useState<PlaypenMember[]>([])
    const [partner, setPartner] = useState<PlaypenMember | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchPlaypen = useCallback(async () => {
        if (!userId) {
            setLoading(false)
            return
        }

        try {
            // Get user's current playpen from their profile
            const { data: profile } = await supabase
                .from("profiles")
                .select("current_group_id")
                .eq("id", userId)
                .single()

            if (!profile?.current_group_id) {
                setPlaypen(null)
                setMembers([])
                setPartner(null)
                setLoading(false)
                return
            }

            // Fetch the playpen details
            const { data: playpenData, error: playpenError } = await supabase
                .from("playpens")
                .select("*")
                .eq("id", profile.current_group_id)
                .single()

            if (playpenError) throw playpenError
            setPlaypen(playpenData)

            // Fetch playpen members
            const { data: membersData, error: membersError } = await supabase
                .from("playpen_members")
                .select("*")
                .eq("playpen_id", profile.current_group_id)

            if (membersError) throw membersError
            setMembers(membersData || [])

            // Find the partner (the other member who isn't me)
            const partnerMember = membersData?.find(m => m.user_id !== userId) || null
            setPartner(partnerMember)

        } catch (err: any) {
            console.error("Error fetching playpen:", err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [userId])

    useEffect(() => {
        fetchPlaypen()
    }, [fetchPlaypen])

    // Create a new playpen
    const createPlaypen = async (name: string): Promise<Playpen | null> => {
        if (!userId) return null

        try {
            const { data: newPlaypen, error: playpenError } = await supabase
                .from("playpens")
                .insert({ name })
                .select()
                .single()

            if (playpenError) throw playpenError

            // Add creator as a member (trigger doesn't work because auth.uid() is null in trigger context)
            const { error: memberError } = await supabase
                .from("playpen_members")
                .insert({
                    playpen_id: newPlaypen.id,
                    user_id: userId,
                    avatar_emoji: "🐷"
                })

            if (memberError) throw memberError

            // Update user's current_group_id to point to new playpen
            await supabase
                .from("profiles")
                .update({ current_group_id: newPlaypen.id })
                .eq("id", userId)

            await fetchPlaypen()
            return newPlaypen
        } catch (err: any) {
            console.error("Error creating playpen:", err)
            setError(err.message)
            return null
        }
    }

    // Join a playpen via invite code
    const joinPlaypen = async (inviteCode: string): Promise<boolean> => {
        if (!userId) return false

        try {
            const { data: targetPlaypen, error: findError } = await supabase
                .from("playpens")
                .select("*")
                .eq("invite_code", inviteCode.toLowerCase().trim())
                .single()

            if (findError || !targetPlaypen) {
                setError("Invalid invite code")
                return false
            }

            // Add user as member
            const { error: memberError } = await supabase
                .from("playpen_members")
                .insert({
                    playpen_id: targetPlaypen.id,
                    user_id: userId,
                    avatar_emoji: "🐷"
                })

            if (memberError) {
                if (memberError.code === "23505") {
                    setError("You're already in this playpen")
                } else {
                    throw memberError
                }
                return false
            }

            // Update current_group_id
            await supabase
                .from("profiles")
                .update({ current_group_id: targetPlaypen.id })
                .eq("id", userId)

            await fetchPlaypen()
            return true
        } catch (err: any) {
            console.error("Error joining playpen:", err)
            setError(err.message)
            return false
        }
    }

    // Update your avatar emoji
    const updateAvatarEmoji = async (emoji: string): Promise<boolean> => {
        if (!userId || !playpen) return false

        try {
            const { error } = await supabase
                .from("playpen_members")
                .update({ avatar_emoji: emoji })
                .eq("playpen_id", playpen.id)
                .eq("user_id", userId)

            if (error) throw error

            await fetchPlaypen()
            return true
        } catch (err: any) {
            setError(err.message)
            return false
        }
    }

    // Update display name
    const updateDisplayName = async (name: string): Promise<boolean> => {
        if (!userId || !playpen) return false

        try {
            const { error } = await supabase
                .from("playpen_members")
                .update({ display_name: name })
                .eq("playpen_id", playpen.id)
                .eq("user_id", userId)

            if (error) throw error

            await fetchPlaypen()
            return true
        } catch (err: any) {
            setError(err.message)
            return false
        }
    }

    return {
        playpen,
        members,
        partner,
        loading,
        error,
        createPlaypen,
        joinPlaypen,
        updateAvatarEmoji,
        updateDisplayName,
        refetch: fetchPlaypen
    }
}
