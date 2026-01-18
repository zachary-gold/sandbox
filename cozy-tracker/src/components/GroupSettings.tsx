import React, { useState } from "react"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { useGroup, type GroupMember } from "@/hooks/useGroup"
import { Users, UserPlus, Copy, Check, RefreshCw, LogOut, Crown, Trash2, Home } from "lucide-react"

interface GroupSettingsProps {
    userId: string
}

export const GroupSettings: React.FC<GroupSettingsProps> = ({ userId }) => {
    const {
        group,
        members,
        isAdmin,
        loading,
        error,
        createGroup,
        joinGroup,
        removeMember,
        leaveGroup,
        regenerateInviteCode
    } = useGroup(userId)

    const [newGroupName, setNewGroupName] = useState("")
    const [inviteCode, setInviteCode] = useState("")
    const [copied, setCopied] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [isJoining, setIsJoining] = useState(false)
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [showJoinForm, setShowJoinForm] = useState(false)

    const handleCopyCode = () => {
        if (group?.invite_code) {
            navigator.clipboard.writeText(group.invite_code)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) return
        setIsCreating(true)
        await createGroup(newGroupName.trim())
        setNewGroupName("")
        setShowCreateForm(false)
        setIsCreating(false)
    }

    const handleJoinGroup = async () => {
        if (!inviteCode.trim()) return
        setIsJoining(true)
        const success = await joinGroup(inviteCode.trim())
        if (success) {
            setInviteCode("")
            setShowJoinForm(false)
        }
        setIsJoining(false)
    }

    if (loading) {
        return (
            <div className="space-y-4">
                <h3 className="text-lg font-black uppercase tracking-tight italic flex items-center gap-2">
                    <Users size={20} /> House Group
                </h3>
                <p className="text-sm text-text/40">Loading...</p>
            </div>
        )
    }

    // No group yet - show create/join options
    if (!group) {
        return (
            <div className="space-y-4">
                <h3 className="text-lg font-black uppercase tracking-tight italic flex items-center gap-2">
                    <Users size={20} /> House Group
                </h3>

                <p className="text-sm text-text/60">
                    Create or join a group to share your board with family or roommates.
                </p>

                {error && (
                    <div className="p-3 bg-accent/10 border border-accent/20 rounded-xl text-accent text-xs font-bold">
                        {error}
                    </div>
                )}

                {showCreateForm ? (
                    <Card className="p-4 space-y-3">
                        <h4 className="font-bold text-sm">Create a New Group</h4>
                        <input
                            type="text"
                            placeholder="Group name (e.g., 'The Smiths')"
                            className="w-full p-3 bg-background border-2 border-text rounded-xl text-sm focus:outline-none"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleCreateGroup()}
                        />
                        <div className="flex gap-2">
                            <Button onClick={handleCreateGroup} disabled={isCreating} className="flex-1">
                                {isCreating ? "Creating..." : "Create Group"}
                            </Button>
                            <Button variant="ghost" onClick={() => setShowCreateForm(false)}>
                                Cancel
                            </Button>
                        </div>
                    </Card>
                ) : showJoinForm ? (
                    <Card className="p-4 space-y-3">
                        <h4 className="font-bold text-sm">Join an Existing Group</h4>
                        <input
                            type="text"
                            placeholder="Enter invite code"
                            className="w-full p-3 bg-background border-2 border-text rounded-xl text-sm font-mono focus:outline-none"
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleJoinGroup()}
                        />
                        <div className="flex gap-2">
                            <Button onClick={handleJoinGroup} disabled={isJoining} className="flex-1">
                                {isJoining ? "Joining..." : "Join Group"}
                            </Button>
                            <Button variant="ghost" onClick={() => setShowJoinForm(false)}>
                                Cancel
                            </Button>
                        </div>
                    </Card>
                ) : (
                    <div className="flex gap-3">
                        <Button onClick={() => setShowCreateForm(true)} className="flex-1">
                            <Home size={16} className="mr-2" />
                            Create Group
                        </Button>
                        <Button variant="secondary" onClick={() => setShowJoinForm(true)} className="flex-1">
                            <UserPlus size={16} className="mr-2" />
                            Join Group
                        </Button>
                    </div>
                )}
            </div>
        )
    }

    // Has a group - show group details and members
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-black uppercase tracking-tight italic flex items-center gap-2">
                    <Users size={20} /> {group.name}
                </h3>
                {isAdmin && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-1">
                        <Crown size={12} /> Admin
                    </span>
                )}
            </div>

            {error && (
                <div className="p-3 bg-accent/10 border border-accent/20 rounded-xl text-accent text-xs font-bold">
                    {error}
                </div>
            )}

            {/* Invite Code */}
            <Card className="p-4 space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-text/40">
                    Invite Code (share with others)
                </label>
                <div className="flex gap-2">
                    <div className="flex-1 px-4 py-2 bg-background border-2 border-dashed border-text/20 rounded-xl font-mono text-sm">
                        {group.invite_code}
                    </div>
                    <Button variant="secondary" className="px-3" onClick={handleCopyCode}>
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                    </Button>
                    {isAdmin && (
                        <Button variant="ghost" className="px-3" onClick={regenerateInviteCode} title="Generate new code">
                            <RefreshCw size={18} />
                        </Button>
                    )}
                </div>
            </Card>

            {/* Members */}
            <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-text/40">
                    Members ({members.length}/5)
                </label>
                <div className="space-y-2">
                    {members.map((member) => (
                        <MemberRow
                            key={member.id}
                            member={member}
                            isCurrentUser={member.user_id === userId}
                            canRemove={isAdmin && member.user_id !== userId}
                            onRemove={() => removeMember(member.user_id)}
                        />
                    ))}
                </div>
            </div>

            {/* Leave Group */}
            <Button
                variant="ghost"
                className="w-full text-text/40 hover:text-accent"
                onClick={leaveGroup}
            >
                <LogOut size={16} className="mr-2" />
                Leave Group
            </Button>
        </div>
    )
}

// Member row component
const MemberRow: React.FC<{
    member: GroupMember
    isCurrentUser: boolean
    canRemove: boolean
    onRemove: () => void
}> = ({ member, isCurrentUser, canRemove, onRemove }) => {
    const [confirming, setConfirming] = useState(false)

    return (
        <div className="flex items-center gap-3 p-3 bg-card border-2 border-text/10 rounded-xl">
            {/* Avatar placeholder */}
            <div className="w-8 h-8 rounded-full bg-secondary/20 border-2 border-text/10 flex items-center justify-center text-xs font-bold uppercase">
                {member.profile?.username?.charAt(0) || "?"}
            </div>

            <div className="flex-1">
                <div className="font-bold text-sm flex items-center gap-2">
                    {member.profile?.username || "Unknown"}
                    {isCurrentUser && (
                        <span className="text-[8px] font-bold uppercase tracking-widest text-text/40">(you)</span>
                    )}
                    {member.role === "admin" && (
                        <Crown size={12} className="text-primary" />
                    )}
                </div>
            </div>

            {canRemove && (
                confirming ? (
                    <div className="flex gap-1">
                        <Button variant="ghost" className="px-2 py-1 text-xs text-accent" onClick={onRemove}>
                            Remove
                        </Button>
                        <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => setConfirming(false)}>
                            Cancel
                        </Button>
                    </div>
                ) : (
                    <button
                        onClick={() => setConfirming(true)}
                        className="p-2 text-text/20 hover:text-accent transition-colors"
                    >
                        <Trash2 size={16} />
                    </button>
                )
            )}
        </div>
    )
}
