import React from "react"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { ArrowRight, Calendar, LogIn, SkipForward } from "lucide-react"

interface ChainPromptProps {
    isOpen: boolean
    onClose: () => void
    nextStepTitle: string
    onAddToToday: () => void
    onAddToBacklog: () => void
    onSkip: () => void
}

export const ChainPrompt: React.FC<ChainPromptProps> = ({
    isOpen,
    onClose,
    nextStepTitle,
    onAddToToday,
    onAddToBacklog,
    onSkip
}) => {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            <Card className="relative w-full max-w-md bg-card border-2 border-text shadow-hard p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="space-y-2 text-center">
                    <h2 className="text-xl font-black uppercase tracking-tight">Flow Continued!</h2>
                    <p className="text-text/60 font-medium">
                        You completed a step. The next step is:
                    </p>
                    <div className="p-3 bg-primary/10 border-2 border-primary rounded-xl font-bold text-lg text-primary">
                        {nextStepTitle}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    <Button
                        onClick={onAddToToday}
                        className="w-full py-6 text-lg justify-start gap-3 relative overflow-hidden group"
                    >
                        <Calendar className="w-6 h-6" />
                        <div className="flex flex-col items-start">
                            <span className="font-black uppercase tracking-wider text-xs opacity-60">Do it Today</span>
                            <span>Add to Today's Board</span>
                        </div>
                        <ArrowRight className="absolute right-4 opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0" />
                    </Button>

                    <Button
                        onClick={onAddToBacklog}
                        variant="secondary"
                        className="w-full py-6 text-lg justify-start gap-3"
                    >
                        <LogIn className="w-6 h-6" />
                        <div className="flex flex-col items-start">
                            <span className="font-black uppercase tracking-wider text-xs opacity-60">Save for Later</span>
                            <span>Add to Backlog</span>
                        </div>
                    </Button>

                    <Button
                        onClick={onSkip}
                        variant="ghost"
                        className="w-full py-4 justify-start gap-3 text-text/40 hover:text-text hover:bg-black/5"
                    >
                        <SkipForward className="w-5 h-5" />
                        <div className="flex flex-col items-start">
                            <span className="font-bold text-sm">Skip for now</span>
                            <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">Move to Limbo</span>
                        </div>
                    </Button>
                </div>
            </Card>
        </div>
    )
}
