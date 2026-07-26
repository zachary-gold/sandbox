import { UserPicker, useCurrentUser, USERS, PLAYPEN_ID } from "@/components/UserPicker"
import { FocusView } from "@/components/FocusView"
import "./PlaypenApp.css"

function PlaypenApp() {
    const { currentUser, partner, selectUser, logout } = useCurrentUser()

    // Not logged in - show user picker
    if (!currentUser) {
        return <UserPicker onSelect={selectUser} />
    }

    // Main app
    return (
        <FocusView
            userId={currentUser.id}
            currentUser={currentUser}
            partner={partner}
            onLogout={logout}
        />
    )
}

export default PlaypenApp
