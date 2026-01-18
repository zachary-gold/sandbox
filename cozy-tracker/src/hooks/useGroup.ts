import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"

export interface HouseGroup {
    id: string
    name: string
    invite_code: string
    created_at: string
}

export interface GroupMember {
    id: string
    group_id: string
    user_id: string
    role: "admin" | "member"
    joined_at: string
    profile?: {
        id: string
        username: string
        avatar_url: string | null
    }
}

export function useGroup(userId: string | undefined) {
    const [group, setGroup] = useState<HouseGroup | null>(null)
    const [members, setMembers] = useState<GroupMember[]>([])
    const [isAdmin, setIsAdmin] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Fetch the user's current group and its members
    const fetchGroup = useCallback(async () => {
        if (!userId) {
            setLoading(false)
            return
        }

        try {
            // Get user's current group from their profile
            const { data: profile } = await supabase
                .from("profiles")
                .select("current_group_id")
                .eq("id", userId)
                .single()

            if (!profile?.current_group_id) {
                setGroup(null)
                setMembers([])
                setLoading(false)
                return
            }

            // Fetch the group details
            const { data: groupData, error: groupError } = await supabase
                .from("house_groups")
                .select("*")
                .eq("id", profile.current_group_id)
                .single()

            if (groupError) throw groupError
            setGroup(groupData)

            // Fetch group members with their profiles
            const { data: membersData, error: membersError } = await supabase
                .from("group_members")
                .select(`
          *,
          profile:profiles(id, username, avatar_url)
        `)
                .eq("group_id", profile.current_group_id)

            if (membersError) throw membersError
            setMembers(membersData || [])

            // Check if current user is admin
            const currentMember = membersData?.find(m => m.user_id === userId)
            setIsAdmin(currentMember?.role === "admin")

        } catch (err: any) {
            console.error("Error fetching group:", err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [userId])

    useEffect(() => {
        fetchGroup()
    }, [fetchGroup])

    // Create a new group (user becomes admin)
    const createGroup = async (name: string): Promise<HouseGroup | null> => {
        if (!userId) return null

        try {
            // Create the group
            const { data: newGroup, error: groupError } = await supabase
                .from("house_groups")
                .insert({ name })
                .select()
                .single()

            if (groupError) throw groupError

            // Add user as admin member
            const { error: memberError } = await supabase
                .from("group_members")
                .insert({
                    group_id: newGroup.id,
                    user_id: userId,
                    role: "admin"
                })

            if (memberError) throw memberError

            // Update user's current_group_id
            const { error: profileError } = await supabase
                .from("profiles")
                .update({ current_group_id: newGroup.id })
                .eq("id", userId)

            if (profileError) throw profileError

            // Also create a board for this group
            const { error: boardError } = await supabase
                .from("boards")
                .insert({
                    group_id: newGroup.id,
                    title: `${name}'s Board`
                })

            if (boardError) throw boardError

            await fetchGroup()
            return newGroup
        } catch (err: any) {
            console.error("Error creating group:", err)
            setError(err.message)
            return null
        }
    }

    // Join an existing group via invite code
    const joinGroup = async (inviteCode: string): Promise<boolean> => {
        if (!userId) return false

        try {
            // Find the group by invite code
            const { data: targetGroup, error: findError } = await supabase
                .from("house_groups")
                .select("*")
                .eq("invite_code", inviteCode.toLowerCase().trim())
                .single()

            if (findError || !targetGroup) {
                setError("Invalid invite code")
                return false
            }

            // Check member count (max 5)
            const { count } = await supabase
                .from("group_members")
                .select("*", { count: "exact", head: true })
                .eq("group_id", targetGroup.id)

            if (count && count >= 5) {
                setError("This group is full (max 5 members)")
                return false
            }

            // Add user as member
            const { error: memberError } = await supabase
                .from("group_members")
                .insert({
                    group_id: targetGroup.id,
                    user_id: userId,
                    role: "member"
                })

            if (memberError) {
                if (memberError.code === "23505") {
                    setError("You're already a member of this group")
                } else {
                    throw memberError
                }
                return false
            }

            // Update user's current_group_id
            const { error: profileError } = await supabase
                .from("profiles")
                .update({ current_group_id: targetGroup.id })
                .eq("id", userId)

            if (profileError) throw profileError

            await fetchGroup()
            return true
        } catch (err: any) {
            console.error("Error joining group:", err)
            setError(err.message)
            return false
        }
    }

    // Remove a member (admin only)
    const removeMember = async (memberUserId: string): Promise<boolean> => {
        if (!isAdmin || !group) return false

        try {
            const { error } = await supabase
                .from("group_members")
                .delete()
                .eq("group_id", group.id)
                .eq("user_id", memberUserId)

            if (error) throw error

            // Also clear their current_group_id
            await supabase
                .from("profiles")
                .update({ current_group_id: null })
                .eq("id", memberUserId)

            await fetchGroup()
            return true
        } catch (err: any) {
            console.error("Error removing member:", err)
            setError(err.message)
            return false
        }
    }

    // Leave group (self-removal)
    const leaveGroup = async (): Promise<boolean> => {
        if (!userId || !group) return false

        try {
            const { error } = await supabase
                .from("group_members")
                .delete()
                .eq("group_id", group.id)
                .eq("user_id", userId)

            if (error) throw error

            // Clear current_group_id
            await supabase
                .from("profiles")
                .update({ current_group_id: null })
                .eq("id", userId)

            setGroup(null)
            setMembers([])
            setIsAdmin(false)
            return true
        } catch (err: any) {
            console.error("Error leaving group:", err)
            setError(err.message)
            return false
        }
    }

    // Regenerate invite code (admin only)
    const regenerateInviteCode = async (): Promise<string | null> => {
        if (!isAdmin || !group) return null

        try {
            const newCode = crypto.randomUUID().substring(0, 8)

            const { error } = await supabase
                .from("house_groups")
                .update({ invite_code: newCode })
                .eq("id", group.id)

            if (error) throw error

            await fetchGroup()
            return newCode
        } catch (err: any) {
            console.error("Error regenerating invite code:", err)
            setError(err.message)
            return null
        }
    }

    // Update group name (admin only)
    const updateGroupName = async (newName: string): Promise<boolean> => {
        if (!isAdmin || !group) return false

        try {
            const { error } = await supabase
                .from("house_groups")
                .update({ name: newName })
                .eq("id", group.id)

            if (error) throw error

            await fetchGroup()
            return true
        } catch (err: any) {
            console.error("Error updating group name:", err)
            setError(err.message)
            return false
        }
    }

    return {
        group,
        members,
        isAdmin,
        loading,
        error,
        createGroup,
        joinGroup,
        removeMember,
        leaveGroup,
        regenerateInviteCode,
        updateGroupName,
        refetch: fetchGroup
    }
}
