-- ============================================
-- V4 Schema: SIMPLE (No RLS, No Auth)
-- ============================================
-- Run v4_migration_00_nuclear_reset.sql first, then this.
-- No auth = just localStorage-based user picker
-- ============================================

-- ============================================
-- 1. CREATE ALL TABLES (no RLS!)
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
    user_id TEXT NOT NULL,  -- Just a string ID like 'zach' or 'partner'
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
    claimed_by TEXT,  -- Just 'zach' or 'partner'
    completed_at TIMESTAMP WITH TIME ZONE,
    original_focus_date DATE,
    archived_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT  -- Just 'zach' or 'partner'
);

CREATE TABLE daily_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    playpen_id UUID REFERENCES playpens(id) ON DELETE CASCADE NOT NULL,
    user_id TEXT NOT NULL,  -- Just 'zach' or 'partner'
    note_date DATE DEFAULT CURRENT_DATE,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(playpen_id, user_id, note_date)
);

-- ============================================
-- 2. INDEXES
-- ============================================

CREATE INDEX idx_playpen_members_user ON playpen_members(user_id);
CREATE INDEX idx_items_playpen_focus ON items(playpen_id, focus_date);
CREATE INDEX idx_items_playpen_pen ON items(playpen_id, pen_id);
CREATE INDEX idx_items_claimed ON items(claimed_by);
CREATE INDEX idx_pens_playpen ON pens(playpen_id);
CREATE INDEX idx_daily_notes_lookup ON daily_notes(playpen_id, note_date);

-- ============================================
-- 3. SEED DATA: Create your playpen!
-- ============================================

-- Create the playpen
INSERT INTO playpens (id, name) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Zach & GF Playpen');

-- Add you and your girlfriend as members
INSERT INTO playpen_members (playpen_id, user_id, display_name, avatar_emoji) VALUES
    ('00000000-0000-0000-0000-000000000001', 'zach', 'Zach', '🧑'),
    ('00000000-0000-0000-0000-000000000001', 'partner', 'Partner', '👩');

-- Create starter pens
INSERT INTO pens (playpen_id, name, emoji, sort_order) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Groceries', '🛒', 1),
    ('00000000-0000-0000-0000-000000000001', 'Chores', '🧹', 2),
    ('00000000-0000-0000-0000-000000000001', 'Projects', '🔨', 3),
    ('00000000-0000-0000-0000-000000000001', 'Date Ideas', '💕', 4);

-- Done! 🐷
