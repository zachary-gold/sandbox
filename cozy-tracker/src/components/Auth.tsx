import React, { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Sparkles, Mail, Lock, User } from "lucide-react"

export const Auth: React.FC = () => {
    const [loading, setLoading] = useState(false)
    const [isSignUp, setIsSignUp] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [username, setUsername] = useState("")
    const [error, setError] = useState<string | null>(null)

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            username: username,
                        },
                    },
                })
                if (error) throw error
                alert("Check your email for the confirmation link!")
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-primary rounded-2xl border-2 border-text shadow-hard flex items-center justify-center text-white">
                    <Sparkles fill="currentColor" size={24} />
                </div>
                <h1 className="text-3xl font-black tracking-tighter uppercase italic leading-none">Cozy Daily</h1>
            </div>

            <Card className="w-full max-w-md p-8">
                <h2 className="text-2xl font-black mb-6 uppercase tracking-tight italic">
                    {isSignUp ? "Join the Nest" : "Welcome Back"}
                </h2>

                <form onSubmit={handleAuth} className="space-y-4">
                    {isSignUp && (
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase tracking-widest text-text/40 ml-1">Username</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-text/30" size={18} />
                                <input
                                    type="text"
                                    placeholder="How should I call you?"
                                    className="w-full pl-10 pr-4 py-3 bg-background border-2 border-text rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-widest text-text/40 ml-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text/30" size={18} />
                            <input
                                type="email"
                                placeholder="your@email.com"
                                className="w-full pl-10 pr-4 py-3 bg-background border-2 border-text rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-widest text-text/40 ml-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text/30" size={18} />
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="w-full pl-10 pr-4 py-3 bg-background border-2 border-text rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-accent/10 border border-accent/20 rounded-xl text-accent text-xs font-bold">
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full py-4 text-lg" disabled={loading}>
                        {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-sm font-bold text-text/40 hover:text-primary transition-colors"
                    >
                        {isSignUp ? "Already have an account? Sign In" : "New here? Create an account"}
                    </button>
                </div>
            </Card>

            {!import.meta.env.VITE_SUPABASE_URL && (
                <div className="mt-8 p-4 bg-yellow-100 border-2 border-yellow-400 rounded-2xl max-w-md text-sm text-yellow-800 font-medium text-center">
                    ⚠️ Looks like Supabase environment variables are missing! Check your .env file.
                </div>
            )}
        </div>
    )
}
