-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  avatar_url TEXT,
  spouse_id UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create boards table
CREATE TABLE IF NOT EXISTS public.boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for boards
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

-- Create cards table
CREATE TABLE IF NOT EXISTS public.cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date DATE, -- Null for backlog
  is_recurring_template BOOLEAN DEFAULT false,
  recurrence_rule JSONB, -- { type: 'daily', interval: 2 }
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'done', 'cancelled')),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS for cards
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- Create checklist_items table
CREATE TABLE IF NOT EXISTS public.checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  is_checked BOOLEAN DEFAULT false,
  card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE,
  tags TEXT[] DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  checked_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS for checklist_items
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES (Simple version: Users can see what they created or what their spouse created)

-- Profiles: Users can view their own and their spouse's profile
CREATE POLICY "Users can view own and spouse profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR id IN (SELECT spouse_id FROM public.profiles WHERE id = auth.uid()));

-- Boards: Users can view boards they own or their spouse owns
CREATE POLICY "Users can view own and spouse boards" ON public.boards
  FOR SELECT USING (owner_id = auth.uid() OR owner_id IN (SELECT spouse_id FROM public.profiles WHERE id = auth.uid()));

-- Cards & Checklist Items (similar logic)
CREATE POLICY "Users can manage cards in their boards" ON public.cards
  FOR ALL USING (
    board_id IN (SELECT id FROM public.boards WHERE owner_id = auth.uid() OR owner_id IN (SELECT spouse_id FROM public.profiles WHERE id = auth.uid()))
  );

CREATE POLICY "Users can manage checklist items" ON public.checklist_items
  FOR ALL USING (
    created_by = auth.uid() OR 
    created_by IN (SELECT spouse_id FROM public.profiles WHERE id = auth.uid())
  );
