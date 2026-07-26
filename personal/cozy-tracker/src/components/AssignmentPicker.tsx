import React, { useState } from "react"
import { type GroupMember } from "@/hooks/useGroup"
import { Users, Heart, ChevronDown, Check } from "lucide-react"

export type AssignmentValue = {
    assignedTo: string | null  // null = "whoever"
    assignedToBoth: boolean
}

interface AssignmentPickerProps {
    value: AssignmentValue
    members: GroupMember[]
    onChange: (value: AssignmentValue) => void
    compact?: boolean  // For inline display
}

export const AssignmentPicker: React.FC<AssignmentPickerProps> = ({
    value,
    members,
    onChange,
    compact = false
}) => {
    const [isOpen, setIsOpen] = useState(false)

    const getDisplayLabel = () => {
        if (value.assignedToBoth) {
            return { icon: <Heart size={14} className="fill-accent text-accent" />, label: "Both" }
        }
        if (value.assignedTo) {
            const member = members.find(m => m.user_id === value.assignedTo)
            return {
                icon: <div className="w-4 h-4 rounded-full bg-secondary/30 flex items-center justify-center text-[8px] font-bold uppercase">
                    {member?.profile?.username?.charAt(0) || "?"}
                </div>,
                label: member?.profile?.username || "Unknown"
            }
        }
        return { icon: <Users size={14} />, label: "Whoever" }
    }

    const display = getDisplayLabel()

    if (compact) {
        return (
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-background/50 border border-text/10 text-[10px] font-bold text-text/60 hover:bg-background transition-colors"
            >
                {display.icon}
                <span>{display.label}</span>
            </button>
        )
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background border-2 border-text/10 text-sm font-bold hover:border-text/30 transition-colors w-full"
            >
                {display.icon}
                <span className="flex-1 text-left">{display.label}</span>
                <ChevronDown size={16} className={`text-text/40 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

                    {/* Dropdown */}
                    <div className="absolute top-full left-0 right-0 mt-1 bg-card border-2 border-text rounded-xl shadow-hard z-20 overflow-hidden">
                        {/* Whoever option */}
                        <OptionRow
                            icon={<Users size={16} />}
                            label="Whoever"
                            description="Either person can do it"
                            selected={!value.assignedTo && !value.assignedToBoth}
                            onClick={() => {
                                onChange({ assignedTo: null, assignedToBoth: false })
                                setIsOpen(false)
                            }}
                        />

                        {/* Both option */}
                        <OptionRow
                            icon={<Heart size={16} className="text-accent" />}
                            label="Both"
                            description="Requires both people"
                            selected={value.assignedToBoth}
                            onClick={() => {
                                onChange({ assignedTo: null, assignedToBoth: true })
                                setIsOpen(false)
                            }}
                        />

                        {/* Divider */}
                        <div className="border-t border-text/10 my-1" />

                        {/* Individual members */}
                        {members.map(member => (
                            <OptionRow
                                key={member.id}
                                icon={
                                    <div className="w-6 h-6 rounded-full bg-secondary/30 flex items-center justify-center text-xs font-bold uppercase">
                                        {member.profile?.username?.charAt(0) || "?"}
                                    </div>
                                }
                                label={member.profile?.username || "Unknown"}
                                selected={value.assignedTo === member.user_id}
                                onClick={() => {
                                    onChange({ assignedTo: member.user_id, assignedToBoth: false })
                                    setIsOpen(false)
                                }}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}

// Individual option row
const OptionRow: React.FC<{
    icon: React.ReactNode
    label: string
    description?: string
    selected: boolean
    onClick: () => void
}> = ({ icon, label, description, selected, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-background/50 transition-colors ${selected ? "bg-primary/5" : ""}`}
    >
        {icon}
        <div className="flex-1 text-left">
            <div className="text-sm font-bold">{label}</div>
            {description && <div className="text-[10px] text-text/40">{description}</div>}
        </div>
        {selected && <Check size={16} className="text-primary" />}
    </button>
)

// Compact badge for displaying assignment on cards
export const AssignmentBadge: React.FC<{
    assignedTo: string | null
    assignedToBoth: boolean
    members: GroupMember[]
}> = ({ assignedTo, assignedToBoth, members }) => {
    if (assignedToBoth) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[10px] font-bold">
                <Heart size={10} className="fill-current" />
                Both
            </span>
        )
    }

    if (assignedTo) {
        const member = members.find(m => m.user_id === assignedTo)
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-[10px] font-bold">
                <span className="w-3 h-3 rounded-full bg-secondary/30 flex items-center justify-center text-[6px] font-bold uppercase">
                    {member?.profile?.username?.charAt(0) || "?"}
                </span>
                {member?.profile?.username || "?"}
            </span>
        )
    }

    // "Whoever" - don't show a badge (it's the default)
    return null
}
