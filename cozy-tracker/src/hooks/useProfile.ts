import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"

export function useProfile(userId: string | undefined) {
    const [profile, setProfile] = useState<any>(null)
    const [board, setBoard] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const fetchProfileAndBoard = useCallback(async () => {
        if (!userId) {
            setLoading(false)
            return
        }

        try {
            // 1. Fetch Profile
            let { data: profile, error: pError } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .single()

            if (pError && pError.code === "PGRST116") {
                // Profile doesn't exist, create it
                const { data: newProfile, error: createError } = await supabase
                    .from("profiles")
                    .insert([{ id: userId, username: "User" }])
                    .select()
                    .single()

                if (createError) console.error("Error creating profile:", createError)
                profile = newProfile
            }

            setProfile(profile)

            // 2. Fetch Board based on group membership
            if (profile?.current_group_id) {
                // User is in a group - fetch the group's board
                const { data: boards } = await supabase
                    .from("boards")
                    .select("*")
                    .eq("group_id", profile.current_group_id)
                    .limit(1)

                if (boards && boards.length > 0) {
                    setBoard(boards[0])
                } else {
                    // Group exists but no board - CREATE ONE
                    console.log("Group exists but no board found. Creating one...")
                    const { data: newBoard, error: createBoardError } = await supabase
                        .from("boards")
                        .insert({
                            group_id: profile.current_group_id,
                            title: `Our Board`,
                            owner_id: userId // Fallback for schema constraints if any
                        })
                        .select()
                        .single()

                    if (createBoardError) {
                        console.error("Error creating group board:", createBoardError)
                        setBoard(null)
                    } else {
                        setBoard(newBoard)
                    }
                }
            } else {
                // User is NOT in a group yet
                // Check for legacy boards (owner_id based) for backwards compatibility
                const { data: legacyBoards } = await supabase
                    .from("boards")
                    .select("*")
                    .eq("owner_id", userId)
                    .limit(1)

                if (legacyBoards && legacyBoards.length > 0) {
                    // User has a legacy board - they'll need to create/join a group
                    // For now, we show this board but it won't work fully until migration
                    setBoard(legacyBoards[0])
                } else {
                    // No group, no board - user needs to create or join a group
                    setBoard(null)
                }
            }
        } catch (error) {
            console.error("Error fetching profile/board:", error)
        } finally {
            setLoading(false)
        }
    }, [userId])

    useEffect(() => {
        fetchProfileAndBoard()
    }, [fetchProfileAndBoard])

    return {
        profile,
        board,
        loading,
        refresh: fetchProfileAndBoard,
        // Helper to check if user needs to set up a group
        needsGroup: !loading && profile && !profile.current_group_id
    }
}
