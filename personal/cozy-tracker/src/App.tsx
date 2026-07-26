import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Auth } from "@/components/Auth"
import { WeeklyBoard } from "@/components/WeeklyBoard"
import { Backlog } from "@/components/Backlog"
import { DailyChecklist } from "@/components/DailyChecklist"
import { Settings } from "@/components/Settings"
import { CardEditModal } from "@/components/CardEditModal"
import { RoutinesDrawer } from "@/components/RoutinesDrawer"
import { Button } from "@/components/ui/Button"
import { useProfile } from "@/hooks/useProfile"
import { useDatabase } from "@/hooks/useDatabase"
import { useGroup } from "@/hooks/useGroup"
import { useChains } from "@/hooks/useChains"
import { useListables } from "@/hooks/useListables"
import { ListablesDrawer } from "@/components/ListablesDrawer"
import { ChainPrompt } from "@/components/ChainPrompt"
import { FlowsDrawer } from "@/components/FlowsDrawer"
import { Heart, Sparkles, LogOut, Loader2, Settings as SettingsIcon, User, Repeat, Tag, Link } from "lucide-react"
import { format } from "date-fns"
import type { Session } from "@supabase/supabase-js"
import type { AssignmentValue } from "@/components/AssignmentPicker"

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [showRoutines, setShowRoutines] = useState(false)
  const [showFlows, setShowFlows] = useState(false)
  const [showListables, setShowListables] = useState(false)
  const [showOnlyMine, setShowOnlyMine] = useState(false)
  const [editingCard, setEditingCard] = useState<any | null>(null)

  // Chain Prompt State
  const [chainPromptData, setChainPromptData] = useState<{
    isOpen: boolean
    nextStep: any
    chainId: string
  } | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const { profile, board, loading: profileLoading, needsGroup, refresh: refreshProfile } = useProfile(session?.user?.id)
  const { cards, backlogItems, routines, loading: dbLoading, addCard, updateCard, deleteCard, completeCard, uncompleteCard, refresh: refreshDatabase } = useDatabase(session?.user?.id)
  const { members, group } = useGroup(session?.user?.id)
  const { chains, createChain, deleteChain, addStep, deleteStep, getNextStep, updateStep, pendingSteps } = useChains(session?.user?.id)
  const { listables, createListable, updateListable, deleteListable } = useListables(board?.id)

  // Filter cards based on "Show only my tasks"
  const filteredCards = showOnlyMine
    ? cards.filter(c =>
      c.assigned_to === session?.user?.id ||
      c.assigned_to === null ||
      c.assigned_to_both === true
    )
    : cards

  if (!session) {
    return <Auth />
  }

  if (profileLoading || dbLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="font-bold text-text/40 uppercase tracking-widest text-sm">Brewing some coffee...</p>
      </div>
    )
  }

  // User needs to create or join a group first
  if (needsGroup) {
    return (
      <div className="min-h-screen bg-background text-text p-4 md:p-8 font-sans selection:bg-primary/30">
        <div className="max-w-md mx-auto mt-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-primary rounded-2xl border-2 border-text shadow-hard flex items-center justify-center text-white">
              <Sparkles fill="currentColor" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter uppercase italic leading-none">Cozy Daily</h1>
              <p className="text-xs font-bold text-text/40 tracking-widest uppercase mt-1">Welcome!</p>
            </div>
          </div>

          <div className="bg-card border-2 border-text rounded-3xl shadow-hard p-8 space-y-6">
            <h2 className="text-xl font-black uppercase tracking-tight italic">Let's Get Started</h2>
            <p className="text-sm text-text/60">
              Create a new group to start tracking activities, or join an existing one with an invite code from a family member or roommate.
            </p>

            {/* This opens the Settings modal which has the group setup */}
            <Button className="w-full py-4 text-lg" onClick={() => setShowSettings(true)}>
              Set Up Your Group
            </Button>
          </div>
        </div>

        {showSettings && session && (
          <Settings
            userId={session.user.id}
            profile={profile}
            onClose={() => setShowSettings(false)}
            onUpdate={() => {
              refreshProfile()
            }}
          />
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-text p-4 md:p-8 font-sans selection:bg-primary/30">
      <header className="max-w-7xl mx-auto flex items-center justify-between mb-12">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary rounded-2xl border-2 border-text shadow-hard flex items-center justify-center text-white font-black text-xl">
            {profile?.username?.charAt(0).toUpperCase() || <Sparkles fill="currentColor" size={24} />}
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase italic leading-none">Cozy Daily</h1>
            <p className="text-xs font-bold text-text/40 tracking-widest uppercase mt-1">
              {board?.title || "Shared with Love"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-black uppercase leading-none italic">
              {profile?.username || "Explorer"}
            </span>
            <span className="text-[10px] font-extrabold text-text/40 tracking-widest leading-none mt-1">
              {format(new Date(), "MMMM yyyy").toUpperCase()}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-secondary border-2 border-text shadow-hard-sm cursor-pointer" onClick={() => setShowSettings(true)} />
          <Button variant="ghost" className="gap-2" onClick={() => setShowRoutines(true)}>
            <Repeat size={16} />
            <span className="hidden sm:inline">Routines</span>
          </Button>
          <Button variant="ghost" className="gap-2" onClick={() => setShowFlows(true)}>
            <Link size={16} />
            <span className="hidden sm:inline">Flows</span>
          </Button>
          <Button variant="ghost" className="gap-2" onClick={() => setShowListables(true)}>
            <Tag size={16} />
            <span className="hidden sm:inline">Listables</span>
          </Button>
          <Button variant="ghost" onClick={() => setShowSettings(true)} className="p-2">
            <SettingsIcon size={20} />
          </Button>
          <Button variant="ghost" onClick={() => supabase.auth.signOut()} className="p-2">
            <LogOut size={20} />
          </Button>
        </div>
      </header>

      {showSettings && session && (
        <Settings
          userId={session.user.id}
          profile={profile}
          onClose={() => setShowSettings(false)}
          onUpdate={() => {
            // Re-fetch profile/board
            window.location.reload() // Simple way to refresh all hooks
          }}
        />
      )}

      <main className="max-w-7xl mx-auto space-y-8">
        <DailyChecklist
          cards={cards}
          backlogItems={backlogItems}
          onToggle={async (id, isChecked) => {
            await updateCard(id, { status: isChecked ? 'done' : 'todo' })
          }}
        />

        <div className="flex flex-col md:flex-row gap-12 items-start">
          <Backlog
            items={backlogItems}
            listables={listables}
            pendingSteps={pendingSteps}
            onAdd={async (content: string, tags: string[], priority: 'high' | 'normal' | 'low', dueDate: string | null, listableId?: string | null, itemType?: 'task' | 'note') => {
              await addCard({
                title: content,
                tags,
                priority,
                due_date: dueDate,
                board_id: board.id,
                date: null,
                listable_id: listableId,
                item_type: itemType || 'task'
              })
            }}
            onToggle={async (id: string, isChecked: boolean) => {
              await updateCard(id, { status: isChecked ? 'done' : 'todo' })
            }}
            onDelete={async (id: string) => {
              await deleteCard(id)
            }}
            onEdit={(item) => setEditingCard(item)}
          />

          <div className="flex-1 w-full space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-2xl font-black uppercase tracking-tight italic text-text/40">Weekly Board</h2>
              <div className="flex items-center gap-4">
                {/* Filter toggle */}
                <button
                  onClick={() => setShowOnlyMine(!showOnlyMine)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-xs font-bold transition-all ${showOnlyMine
                    ? "bg-primary text-white border-primary"
                    : "bg-transparent text-text/40 border-text/20 hover:border-text/40"
                    }`}
                >
                  <User size={14} />
                  Only Mine
                </button>
                <div className="flex items-center gap-2">
                  <Heart size={16} className="text-accent fill-accent" />
                  <span className="text-xs font-bold uppercase tracking-widest text-text/40">Everything is fine</span>
                </div>
              </div>
            </div>
            <WeeklyBoard
              cards={filteredCards}
              backlogItems={backlogItems}
              members={members}
              onWeekChange={(date) => {
                refreshDatabase(date)
              }}
              onAdd={async (date: string, title: string, tags: string[], isRecurring: boolean, assignment?: AssignmentValue, scheduledTime?: string) => {
                if (isRecurring) {
                  const dayCode = format(new Date(date), "EEEEEE").toUpperCase()
                  await addCard({
                    title,
                    tags,
                    board_id: board.id,
                    is_recurring_template: true,
                    recurrence_rule: `FREQ=WEEKLY;BYDAY=${dayCode}`,
                    date: null,
                    assigned_to: assignment?.assignedTo,
                    assigned_to_both: assignment?.assignedToBoth,
                    scheduled_time: scheduledTime
                  })
                } else {
                  await addCard({
                    title,
                    date,
                    board_id: board.id,
                    tags,
                    assigned_to: assignment?.assignedTo,
                    assigned_to_both: assignment?.assignedToBoth,
                    scheduled_time: scheduledTime
                  })
                }
              }}
              onToggle={async (id: string, isChecked: boolean) => {
                await updateCard(id, { status: isChecked ? 'done' : 'todo' })
              }}
              onDelete={async (id: string) => {
                await deleteCard(id)
              }}
              onComplete={async (id: string) => {
                await completeCard(id)

                // Check for flow/chain
                const card = cards.find(c => c.id === id)
                if (card?.chain_id && card?.step_order) {
                  const next = getNextStep(card.chain_id, card.step_order)
                  if (next) {
                    setChainPromptData({
                      isOpen: true,
                      nextStep: next,
                      chainId: card.chain_id
                    })
                  }
                }
              }}
              onUncomplete={async (id: string) => {
                await uncompleteCard(id)
              }}
              onEdit={(card) => setEditingCard(card)}
            />
          </div>
        </div>
      </main>

      {/* Card Edit Modal */}
      {editingCard && (
        <CardEditModal
          card={editingCard}
          members={members}
          onSave={async (id, updates) => {
            await updateCard(id, updates)
          }}
          onClose={() => setEditingCard(null)}
        />
      )}

      {/* Chain Prompt Modal */}
      {chainPromptData && (
        <ChainPrompt
          isOpen={chainPromptData.isOpen}
          onClose={() => setChainPromptData(null)}
          nextStepTitle={chainPromptData.nextStep.title}
          onAddToToday={async () => {
            const today = format(new Date(), "yyyy-MM-dd")
            await addCard({
              title: chainPromptData.nextStep.title,
              board_id: board.id,
              date: today,
              tags: [],
              chain_id: chainPromptData.chainId,
              step_order: chainPromptData.nextStep.step_order
            })
            setChainPromptData(null)
          }}
          onAddToBacklog={async () => {
            await addCard({
              title: chainPromptData.nextStep.title,
              board_id: board.id,
              date: null,
              tags: [],
              chain_id: chainPromptData.chainId,
              step_order: chainPromptData.nextStep.step_order
            })
            setChainPromptData(null)
          }}
          onSkip={async () => {
            // Mark step as pending (Limbo)
            await updateStep(chainPromptData.nextStep.id, {
              pending_since: new Date().toISOString()
            })
            setChainPromptData(null)
          }}
        />
      )}

      {/* Listables Drawer */}
      <ListablesDrawer
        isOpen={showListables}
        onClose={() => setShowListables(false)}
        listables={listables}
        onAdd={async (name, color) => {
          return createListable(name, color)
        }}
        onUpdate={updateListable}
        onDelete={deleteListable}
      />

      {/* Routines Drawer */}
      <RoutinesDrawer
        isOpen={showRoutines}
        onClose={() => setShowRoutines(false)}
        routines={routines}
        members={members}
        groupId={group?.id}
        onAdd={async (routine) => {
          await addCard({
            ...routine,
            date: null,
            board_id: board.id
          } as any)
        }}
        onUpdate={async (id, updates) => {
          await updateCard(id, updates)
        }}
        onDelete={async (id) => {
          await deleteCard(id)
        }}
      />

      {/* Flows Drawer */}
      <FlowsDrawer
        isOpen={showFlows}
        onClose={() => setShowFlows(false)}
        groupId={group?.id}
        chains={chains}
        onCreateChain={createChain}
        onDeleteChain={deleteChain}
        onAddStep={addStep}
        onDeleteStep={deleteStep}
      />
    </div>
  )
}

export default App
