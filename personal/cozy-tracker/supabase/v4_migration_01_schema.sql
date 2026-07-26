-- ============================================
-- V4 Schema: Fixed RLS Policies (no recursion)
-- ============================================
-- Run v4_migration_00_nuclear_reset.sql first, then this.
-- ============================================

-- ============================================
-- 1. CREATE ALL TABLES
-- ============================================

CREATE TABLE playpens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT DEFAULT 'Our Playpen',
    invite_code TEXT UNIQUE DEFAULT lower(substring(gen_random_uuid()::text, 1, 8)),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE playpen_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    playpen_id UUID REFERENCES playpens(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    display_name TEXT,
    avatar_emoji TEXT DEFAULT '🐷',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(playpen_id, user_id)
);

CREATE TABLE pens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    playpen_id UUID REFERENCES playpens(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    emoji TEXT DEFAULT '📝',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    playpen_id UUID REFERENCES playpens(id) ON DELETE CASCADE NOT NULL,
    pen_id UUID REFERENCES pens(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    focus_date DATE,
    due_date DATE,
    scheduled_time TIME,
    recurrence_rule TEXT,
    recurrence_paused BOOLEAN DEFAULT FALSE,
    is_project BOOLEAN DEFAULT FALSE,
    project_steps JSONB,
    project_start_date DATE,
    claimed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    original_focus_date DATE,
    archived_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE daily_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    playpen_id UUID REFERENCES playpens(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    note_date DATE DEFAULT CURRENT_DATE,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(playpen_id, user_id, note_date)
);

-- ============================================
-- 2. ENABLE RLS
-- ============================================

ALTER TABLE playpens ENABLE ROW LEVEL SECURITY;
ALTER TABLE playpen_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE pens ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_notes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. CREATE POLICIES (Fixed - no recursion!)
-- ============================================

-- PLAYPEN_MEMBERS: Use user_id directly, no subquery needed
CREATE POLICY "Users can view their memberships" ON playpen_members FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can join playpens" ON playpen_members FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own membership" ON playpen_members FOR UPDATE
    USING (user_id = auth.uid());

-- PLAYPENS: Need broader SELECT so INSERT RETURNING works
CREATE POLICY "Anyone can view playpens by id" ON playpens FOR SELECT
    USING (true);  -- Broad read, items/pens have their own RLS

CREATE POLICY "Authenticated users can create playpens" ON playpens FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- PENS
CREATE POLICY "Members can view pens" ON pens FOR SELECT
    USING (playpen_id IN (SELECT playpen_id FROM playpen_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can manage pens" ON pens FOR ALL
    USING (playpen_id IN (SELECT playpen_id FROM playpen_members WHERE user_id = auth.uid()));

-- ITEMS
CREATE POLICY "Members can view items" ON items FOR SELECT
    USING (playpen_id IN (SELECT playpen_id FROM playpen_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can manage items" ON items FOR ALL
    USING (playpen_id IN (SELECT playpen_id FROM playpen_members WHERE user_id = auth.uid()));

-- DAILY_NOTES
CREATE POLICY "Members can view daily notes" ON daily_notes FOR SELECT
    USING (playpen_id IN (SELECT playpen_id FROM playpen_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can create their own notes" ON daily_notes FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- ============================================
-- 4. CREATE INDEXES
-- ============================================

CREATE INDEX idx_playpen_members_user ON playpen_members(user_id);
CREATE INDEX idx_playpen_members_playpen ON playpen_members(playpen_id);
CREATE INDEX idx_items_playpen_focus ON items(playpen_id, focus_date);
CREATE INDEX idx_items_playpen_pen ON items(playpen_id, pen_id);
CREATE INDEX idx_items_claimed ON items(claimed_by);
CREATE INDEX idx_pens_playpen ON pens(playpen_id);
CREATE INDEX idx_daily_notes_lookup ON daily_notes(playpen_id, note_date);

-- ============================================
-- 5. CREATE TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION create_starter_pens()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO pens (playpen_id, name, emoji, sort_order) VALUES
        (NEW.id, 'Groceries', '🛒', 1),
        (NEW.id, 'Chores', '🧹', 2),
        (NEW.id, 'Projects', '🔨', 3);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_playpen_created_starter_pens
    AFTER INSERT ON playpens
    FOR EACH ROW EXECUTE FUNCTION create_starter_pens();

-- Done! 🐷
