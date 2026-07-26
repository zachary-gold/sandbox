import React, { useState } from "react"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { type EventChain } from "@/hooks/useChains"
import { Plus, Trash2, ChevronDown, ChevronUp, Link, X } from "lucide-react"

interface ChainManagerProps {
    chains: EventChain[]
    groupId: string
    onCreateChain: (name: string, groupId: string, steps: { title: string; defaultDelayHours?: number }[]) => Promise<string | null>
    onDeleteChain: (chainId: string) => Promise<boolean>
    onAddStep: (chainId: string, title: string, defaultDelayHours?: number) => Promise<boolean>
    onDeleteStep: (stepId: string) => Promise<boolean>
}

export const ChainManager: React.FC<ChainManagerProps> = ({
    chains,
    groupId,
    onCreateChain,
    onDeleteChain,
    onAddStep,
    onDeleteStep
}) => {
    const [isAdding, setIsAdding] = useState(false)
    const [expandedChainId, setExpandedChainId] = useState<string | null>(null)

    return (
        <div className="space-y-4 border-t-2 border-text/10 pt-4 mt-4">
            {/* Section Header */}
            <div className="flex items-center gap-2">
                <Link size={16} className="text-primary" />
                <h3 className="text-sm font-black uppercase tracking-tight text-text/60">Event Chains</h3>
            </div>

            {/* Add Chain Button */}
            {!isAdding && (
                <Button
                    variant="ghost"
                    className="w-full py-2 text-sm border-2 border-dashed border-text/20"
                    onClick={() => setIsAdding(true)}
                >
                    <Plus size={14} /> Add Chain
                </Button>
            )}

            {/* Add Chain Form */}
            {isAdding && (
                <ChainForm
                    onSave={async (name, steps) => {
                        await onCreateChain(name, groupId, steps)
                        setIsAdding(false)
                    }}
                    onCancel={() => setIsAdding(false)}
                />
            )}

            {/* Chain List */}
            {chains.map(chain => (
                <ChainCard
                    key={chain.id}
                    chain={chain}
                    isExpanded={expandedChainId === chain.id}
                    onToggleExpand={() => setExpandedChainId(
                        expandedChainId === chain.id ? null : chain.id
                    )}
                    onDelete={() => onDeleteChain(chain.id)}
                    onAddStep={(title, delay) => onAddStep(chain.id, title, delay)}
                    onDeleteStep={onDeleteStep}
                />
            ))}

            {chains.length === 0 && !isAdding && (
                <p className="text-xs text-text/40 text-center py-2">
                    No chains yet. Create one to link tasks together!
                </p>
            )}
        </div>
    )
}

// Chain Card with expandable steps
const ChainCard: React.FC<{
    chain: EventChain
    isExpanded: boolean
    onToggleExpand: () => void
    onDelete: () => void
    onAddStep: (title: string, delay?: number) => Promise<boolean>
    onDeleteStep: (stepId: string) => Promise<boolean>
}> = ({ chain, isExpanded, onToggleExpand, onDelete, onAddStep, onDeleteStep }) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [addingStep, setAddingStep] = useState(false)
    const [newStepTitle, setNewStepTitle] = useState("")
    const [newStepDelay, setNewStepDelay] = useState("")

    const handleAddStep = async () => {
        if (!newStepTitle.trim()) return
        await onAddStep(newStepTitle.trim(), newStepDelay ? parseInt(newStepDelay) : undefined)
        setNewStepTitle("")
        setNewStepDelay("")
        setAddingStep(false)
    }

    return (
        <Card className="p-3 space-y-2">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={onToggleExpand}
                    className="flex items-center gap-2 flex-1 text-left"
                >
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    <span className="font-bold text-sm">{chain.name}</span>
                    <span className="text-xs text-text/40">({chain.steps?.length || 0} steps)</span>
                </button>

                {showDeleteConfirm ? (
                    <div className="flex items-center gap-1">
                        <span className="text-xs text-red-500">Delete?</span>
                        <button
                            onClick={() => { onDelete(); setShowDeleteConfirm(false) }}
                            className="px-2 py-1 text-xs font-bold text-red-500"
                        >
                            Yes
                        </button>
                        <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className="px-2 py-1 text-xs font-bold text-text/60"
                        >
                            No
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="p-1 text-text/40 hover:text-red-500 transition-colors"
                    >
                        <Trash2 size={14} />
                    </button>
                )}
            </div>

            {/* Expanded Steps */}
            {isExpanded && (
                <div className="pl-6 space-y-2 border-l-2 border-text/10 ml-1">
                    {chain.steps?.map((step, index) => (
                        <div key={step.id} className="flex items-center justify-between group">
                            <div className="flex items-center gap-2 text-sm">
                                <span className="w-5 h-5 rounded-full bg-text/10 flex items-center justify-center text-xs font-bold">
                                    {index + 1}
                                </span>
                                <span>{step.title}</span>
                                {step.default_delay_hours && (
                                    <span className="text-xs text-text/40">
                                        (+{step.default_delay_hours}h)
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => onDeleteStep(step.id)}
                                className="p-1 text-text/20 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}

                    {/* Add Step */}
                    {addingStep ? (
                        <div className="flex items-center gap-2">
                            <input
                                autoFocus
                                value={newStepTitle}
                                onChange={(e) => setNewStepTitle(e.target.value)}
                                placeholder="Step title..."
                                className="flex-1 px-2 py-1 text-sm border-2 border-text/10 rounded-lg focus:outline-none focus:border-primary"
                                onKeyDown={(e) => e.key === "Enter" && handleAddStep()}
                            />
                            <input
                                value={newStepDelay}
                                onChange={(e) => setNewStepDelay(e.target.value)}
                                placeholder="hrs"
                                type="number"
                                className="w-12 px-2 py-1 text-sm border-2 border-text/10 rounded-lg focus:outline-none focus:border-primary"
                            />
                            <button
                                onClick={handleAddStep}
                                className="px-2 py-1 text-xs font-bold text-primary"
                            >
                                Add
                            </button>
                            <button
                                onClick={() => setAddingStep(false)}
                                className="px-2 py-1 text-xs font-bold text-text/40"
                            >
                                ×
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setAddingStep(true)}
                            className="text-xs text-text/40 hover:text-text transition-colors"
                        >
                            + Add step
                        </button>
                    )}
                </div>
            )}
        </Card>
    )
}

// New Chain Form
const ChainForm: React.FC<{
    onSave: (name: string, steps: { title: string; defaultDelayHours?: number }[]) => Promise<void>
    onCancel: () => void
}> = ({ onSave, onCancel }) => {
    const [name, setName] = useState("")
    const [steps, setSteps] = useState<{ title: string; delay: string }[]>([
        { title: "", delay: "" }
    ])
    const [isSaving, setIsSaving] = useState(false)

    const addStep = () => {
        setSteps([...steps, { title: "", delay: "" }])
    }

    const updateStep = (index: number, field: 'title' | 'delay', value: string) => {
        const newSteps = [...steps]
        newSteps[index][field] = value
        setSteps(newSteps)
    }

    const removeStep = (index: number) => {
        if (steps.length <= 1) return
        setSteps(steps.filter((_, i) => i !== index))
    }

    const handleSave = async () => {
        if (!name.trim() || steps.every(s => !s.title.trim())) return
        setIsSaving(true)

        const validSteps = steps
            .filter(s => s.title.trim())
            .map(s => ({
                title: s.title.trim(),
                defaultDelayHours: s.delay ? parseInt(s.delay) : undefined
            }))

        await onSave(name.trim(), validSteps)
        setIsSaving(false)
    }

    return (
        <Card className="p-4 space-y-3 border-primary/30 bg-primary/5">
            {/* Chain Name */}
            <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Chain name (e.g., Laundry Cycle)..."
                className="w-full p-2 bg-background border-2 border-text/10 rounded-xl text-sm font-bold focus:outline-none focus:border-primary"
            />

            {/* Steps */}
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-text/40">Steps</label>
                {steps.map((step, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                            {index + 1}
                        </span>
                        <input
                            value={step.title}
                            onChange={(e) => updateStep(index, 'title', e.target.value)}
                            placeholder={`Step ${index + 1}...`}
                            className="flex-1 px-2 py-1.5 text-sm border-2 border-text/10 rounded-lg focus:outline-none focus:border-primary"
                        />
                        <input
                            value={step.delay}
                            onChange={(e) => updateStep(index, 'delay', e.target.value)}
                            placeholder="hrs"
                            type="number"
                            className="w-14 px-2 py-1.5 text-sm border-2 border-text/10 rounded-lg focus:outline-none focus:border-primary"
                            title="Hours until next step"
                        />
                        {steps.length > 1 && (
                            <button
                                onClick={() => removeStep(index)}
                                className="p-1 text-text/40 hover:text-red-500"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                ))}
                <button
                    onClick={addStep}
                    className="text-xs text-primary font-bold"
                >
                    + Add another step
                </button>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
                <Button
                    className="flex-1"
                    onClick={handleSave}
                    disabled={isSaving || !name.trim()}
                >
                    {isSaving ? 'Creating...' : 'Create Chain'}
                </Button>
                <Button variant="ghost" onClick={onCancel}>
                    Cancel
                </Button>
            </div>
        </Card>
    )
}
