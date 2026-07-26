import "./DailyNoteBanner.css"

interface DailyNoteBannerProps {
    note: string
}

export function DailyNoteBanner({ note }: DailyNoteBannerProps) {
    if (!note) return null

    return (
        <div className="daily-note-banner">
            <span className="note-icon">💬</span>
            <span className="note-text">"{note}"</span>
        </div>
    )
}
