-- ============================================
-- V4 Migration Step 2: Create Triggers
-- ============================================
-- RUN THIS SECOND!
-- Creates helper triggers for automatic functionality.
-- ============================================

-- Auto-create starter pens when a new playpen is created
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

-- NOTE: Adding creator as member is handled in app code (usePlaypen.ts)
-- because auth.uid() returns null in trigger context.
