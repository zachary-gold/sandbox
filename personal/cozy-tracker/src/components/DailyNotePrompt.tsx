import { useState } from "react"
import "./DailyNotePrompt.css"

interface DailyNotePromptProps {
    partnerName: string
    onSend: (message: string) => void
    onSkip: () => void
}

export function DailyNotePrompt({ partnerName, onSend, onSkip }: DailyNotePromptProps) {
    const [message, setMessage] = useState("")

    const handleSend = () => {
        if (message.trim()) {
            onSend(message.trim())
        }
    }

    return (
        <div className="note-prompt-overlay">
            <div className="note-prompt-modal">
                <div className="note-prompt-header">
                    <span className="note-prompt-emoji">☀️</span>
                    <h2>Good morning!</h2>
                </div>

                <p className="note-prompt-message">
                    Anything <strong>{partnerName}</strong> should know?
                </p>

                <textarea
                    className="note-prompt-input"
                    placeholder="lots of meetings today..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    autoFocus
                />

                <div className="note-prompt-actions">
                    <button className="note-skip-button" onClick={onSkip}>
                        Not today
                    </button>
                    <button
                        className="note-send-button"
                        onClick={handleSend}
                        disabled={!message.trim()}
                    >
                        Send 💕
                    </button>
                </div>
            </div>
        </div>
    )
}
