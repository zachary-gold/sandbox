import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"

export interface EventChain {
    id: string
    group_id: string
    name: string
    description?: string
    created_at: string
    steps?: ChainStep[]
}

export interface ChainStep {
    id: string
    chain_id: string
    step_order: number
    title: string
    default_delay_hours?: number
    pending_since?: string | null
    created_at: string
}

export function useChains(userId: string | undefined) {
    const [chains, setChains] = useState<EventChain[]>([])
    const [loading, setLoading] = useState(true)
    const [pendingSteps, setPendingSteps] = useState<ChainStep[]>([])

    const fetchChains = useCallback(async () => {
        if (!userId) return

        const { data: chainsData, error: chainsError } = await supabase
            .from("event_chains")
            .select("*")
            .order("created_at", { ascending: false })

        if (chainsError) {
            console.error("Error fetching chains:", chainsError)
            setLoading(false)
            return
        }

        // Fetch steps for all chains
        const chainIds = chainsData.map(c => c.id)

        let stepsData = []
        if (chainIds.length > 0) {
            const { data, error } = await supabase
                .from("chain_steps")
                .select("*")
                .in("chain_id", chainIds)
                .order("step_order", { ascending: true })

            if (error) console.error("Error fetching chain steps:", error)
            stepsData = data || []
        }

        // Combine chains with their steps
        const chainsWithSteps = chainsData.map(chain => ({
            ...chain,
            steps: stepsData.filter(s => s.chain_id === chain.id)
        }))

        // Fetch pending steps (Limbo)
        const { data: pendingData, error: pendingError } = await supabase
            .from("chain_steps")
            .select("*, event_chains(name)")
            .not("pending_since", "is", null)
            .order("pending_since", { ascending: false })

        if (pendingError) console.error("Error fetching pending steps:", pendingError)
        setPendingSteps(pendingData || [])

        setChains(chainsWithSteps)
        setLoading(false)
    }, [userId])

    // ... existing create/update/delete functions ...




    const createChain = async (name: string, groupId: string, steps: { title: string; defaultDelayHours?: number }[]) => {
        // Create the chain
        const { data: chainData, error: chainError } = await supabase
            .from("event_chains")
            .insert([{ name, group_id: groupId }])
            .select()
            .single()

        if (chainError || !chainData) {
            console.error("Error creating chain:", chainError)
            return null
        }

        // Create steps
        const stepsToInsert = steps.map((step, index) => ({
            chain_id: chainData.id,
            step_order: index + 1,
            title: step.title,
            default_delay_hours: step.defaultDelayHours
        }))

        const { error: stepsError } = await supabase
            .from("chain_steps")
            .insert(stepsToInsert)

        if (stepsError) {
            console.error("Error creating chain steps:", stepsError)
        }

        await fetchChains()
        return chainData.id
    }

    const updateChain = async (chainId: string, updates: { name?: string; description?: string }) => {
        const { error } = await supabase
            .from("event_chains")
            .update(updates)
            .eq("id", chainId)

        if (error) {
            console.error("Error updating chain:", error)
            return false
        }

        await fetchChains()
        return true
    }

    const deleteChain = async (chainId: string) => {
        const { error } = await supabase
            .from("event_chains")
            .delete()
            .eq("id", chainId)

        if (error) {
            console.error("Error deleting chain:", error)
            return false
        }

        await fetchChains()
        return true
    }

    const addStep = async (chainId: string, title: string, defaultDelayHours?: number) => {
        // Get current max step order
        const chain = chains.find(c => c.id === chainId)
        const maxOrder = chain?.steps?.reduce((max, s) => Math.max(max, s.step_order), 0) || 0

        const { error } = await supabase
            .from("chain_steps")
            .insert([{
                chain_id: chainId,
                step_order: maxOrder + 1,
                title,
                default_delay_hours: defaultDelayHours
            }])

        if (error) {
            console.error("Error adding step:", error)
            return false
        }

        await fetchChains()
        return true
    }

    const updateStep = async (stepId: string, updates: { title?: string; default_delay_hours?: number; pending_since?: string | null }) => {
        const { error } = await supabase
            .from("chain_steps")
            .update(updates)
            .eq("id", stepId)

        if (error) {
            console.error("Error updating step:", error)
            return false
        }

        await fetchChains()
        return true
    }

    const deleteStep = async (stepId: string) => {
        const { error } = await supabase
            .from("chain_steps")
            .delete()
            .eq("id", stepId)

        if (error) {
            console.error("Error deleting step:", error)
            return false
        }

        await fetchChains()
        return true
    }

    const getNextStep = (chainId: string, currentStep: number): ChainStep | null => {
        const chain = chains.find(c => c.id === chainId)
        if (!chain?.steps) return null
        return chain.steps.find(s => s.step_order === currentStep + 1) || null
    }

    useEffect(() => {
        fetchChains()
    }, [fetchChains])

    return {
        chains,
        loading,
        pendingSteps,
        createChain,
        updateChain,
        deleteChain,
        addStep,
        updateStep,
        deleteStep,
        getNextStep,
        refresh: fetchChains
    }
}
