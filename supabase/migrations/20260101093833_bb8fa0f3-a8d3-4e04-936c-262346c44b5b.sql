-- Create vocabulary sources table
CREATE TABLE public.vocabulary_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  word_count INTEGER NOT NULL DEFAULT 0,
  imported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vocabulary_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sources" ON public.vocabulary_sources
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own sources" ON public.vocabulary_sources
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sources" ON public.vocabulary_sources
  FOR DELETE USING (auth.uid() = user_id);

-- Create vocabulary words table
CREATE TABLE public.vocabulary_words (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_id UUID REFERENCES public.vocabulary_sources(id) ON DELETE SET NULL,
  word TEXT NOT NULL,
  meaning TEXT NOT NULL,
  meaning_en TEXT,
  example TEXT,
  type TEXT,
  ipa TEXT,
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 5),
  next_review TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_reviewed TIMESTAMP WITH TIME ZONE,
  review_count INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vocabulary_words ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own words" ON public.vocabulary_words
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own words" ON public.vocabulary_words
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own words" ON public.vocabulary_words
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own words" ON public.vocabulary_words
  FOR DELETE USING (auth.uid() = user_id);

-- Create daily stats table
CREATE TABLE public.daily_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  words_studied INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, date)
);

ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stats" ON public.daily_stats
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own stats" ON public.daily_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own stats" ON public.daily_stats
  FOR UPDATE USING (auth.uid() = user_id);

-- Create user streaks table
CREATE TABLE public.user_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_study_date DATE
);

ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own streak" ON public.user_streaks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own streak" ON public.user_streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own streak" ON public.user_streaks
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_vocabulary_words_user_id ON public.vocabulary_words(user_id);
CREATE INDEX idx_vocabulary_words_next_review ON public.vocabulary_words(next_review);
CREATE INDEX idx_vocabulary_sources_user_id ON public.vocabulary_sources(user_id);
CREATE INDEX idx_daily_stats_user_date ON public.daily_stats(user_id, date);