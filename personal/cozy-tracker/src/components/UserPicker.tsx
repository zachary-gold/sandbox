import { useState, useEffect } from "react"
import "./UserPicker.css"

export type SimpleUser = {
    id: string
    name: string
    emoji: string
}

// These match the seed data in v4_simple_schema.sql
export const USERS: SimpleUser[] = [
    { id: "zach", name: "Zach", emoji: "Z" },
    { id: "partner", name: "Tara", emoji: "T" }
]

export const PLAYPEN_ID = "00000000-0000-0000-0000-000000000001"

interface UserPickerProps {
    onSelect: (user: SimpleUser) => void
}

export function UserPicker({ onSelect }: UserPickerProps) {
    return (
        <div className="user-picker">
            <div className="picker-content">
                <div className="picker-header">
                    <span className="picker-emoji">🐷</span>
                    <h1>Welcome to Playpen!</h1>
                    <p>Who's there?</p>
                </div>

                <div className="user-buttons">
                    {USERS.map(user => (
                        <button
                            key={user.id}
                            className="user-button"
                            onClick={() => onSelect(user)}
                        >
                            <span className="user-emoji">{user.emoji}</span>
                            <span className="user-name">{user.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

// Hook to manage current user
export function useCurrentUser() {
    const [currentUser, setCurrentUser] = useState<SimpleUser | null>(null)

    useEffect(() => {
        const saved = localStorage.getItem("playpen_user")
        if (saved) {
            const user = USERS.find(u => u.id === saved)
            if (user) setCurrentUser(user)
        }
    }, [])

    const selectUser = (user: SimpleUser) => {
        localStorage.setItem("playpen_user", user.id)
        setCurrentUser(user)
    }

    const logout = () => {
        localStorage.removeItem("playpen_user")
        setCurrentUser(null)
    }

    const partner = currentUser
        ? USERS.find(u => u.id !== currentUser.id) || null
        : null

    return { currentUser, partner, selectUser, logout }
}
