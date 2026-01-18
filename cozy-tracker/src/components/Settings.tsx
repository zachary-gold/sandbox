import React, { useState } from "react"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { GroupSettings } from "@/components/GroupSettings"
import { User, X } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface SettingsProps {
    profile: any
    userId: string
    onClose: () => void
    onUpdate: () => void
}

export const Settings: React.FC<SettingsProps> = ({ profile, userId, onClose, onUpdate }) => {
    const [username, setUsername] = useState(profile?.username || "")
    const [loading, setLoading] = useState(false)

    const handleUpdateProfile = async () => {
        setLoading(true)
        const { error } = await supabase
            .from("profiles")
            .update({ username })
            .eq("id", userId)

        if (error) alert(error.message)
        else onUpdate()
        setLoading(false)
    }

    return (
        <div className="fixed inset-0 bg-text/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <Card className="w-full max-w-md p-8 relative my-8">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-text/30 hover:text-text transition-colors"
                >
                    <X size={24} />
                </button>

                <h2 className="text-2xl font-black mb-6 uppercase tracking-tight italic">Settings</h2>

                <div className="space-y-8">
                    {/* Profile Section */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-text/40 ml-1">Your Nickname</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-text/30" size={18} />
                                <input
                                    type="text"
                                    className="w-full pl-10 pr-4 py-2 bg-background border-2 border-text rounded-xl focus:outline-none"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleUpdateProfile()}
                                />
                            </div>
                            <Button onClick={handleUpdateProfile} disabled={loading}>Save</Button>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t-2 border-dashed border-text/10" />

                    {/* House Group Section (replaces old spouse linking) */}
                    <GroupSettings userId={userId} />
                </div>
            </Card>
        </div>
    )
}
