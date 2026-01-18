import React from "react"
import { X, ExternalLink } from "lucide-react"
import { ChainManager } from "@/components/ChainManager"
import { type EventChain } from "@/hooks/useChains"

interface FlowsDrawerProps {
    isOpen: boolean
    onClose: () => void
    groupId?: string
    chains: EventChain[]
    onCreateChain: (name: string, groupId: string, steps: { title: string; defaultDelayHours?: number }[]) => Promise<string | null>
    onDeleteChain: (chainId: string) => Promise<boolean>
    onAddStep: (chainId: string, title: string, defaultDelayHours?: number) => Promise<boolean>
    onDeleteStep: (stepId: string) => Promise<boolean>
}

export const FlowsDrawer: React.FC<FlowsDrawerProps> = ({
    isOpen,
    onClose,
    groupId,
    chains,
    onCreateChain,
    onDeleteChain,
    onAddStep,
    onDeleteStep
}) => {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-40">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />

            {/* Drawer */}
            <div className="absolute top-0 left-0 right-0 bg-card border-b-2 border-text shadow-hard max-h-[70vh] overflow-hidden flex flex-col animate-in slide-in-from-top duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b-2 border-text/10">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🔗</span>
                        <h2 className="text-xl font-black uppercase tracking-tight italic">Flows</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-text/5 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <p className="text-sm text-text/60 italic">
                        Flows are sequences of tasks that can be triggered. When you complete one step, the next one is suggested.
                    </p>

                    {groupId && (
                        <ChainManager
                            chains={chains}
                            groupId={groupId}
                            onCreateChain={onCreateChain}
                            onDeleteChain={onDeleteChain}
                            onAddStep={onAddStep}
                            onDeleteStep={onDeleteStep}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}
