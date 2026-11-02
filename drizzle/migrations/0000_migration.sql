CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable by members" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NULLIF(NEW.raw_user_meta_data->>'display_name',''), split_part(NEW.email,'@',1)));
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  when_text text NOT NULL DEFAULT '' CHECK (char_length(when_text) <= 1000),
  is_shared boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.habits TO authenticated;
GRANT ALL ON public.habits TO service_role;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "see own or shared habits" ON public.habits FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_shared);
CREATE POLICY "insert own habits" ON public.habits FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "update own habits" ON public.habits FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "delete own habits" ON public.habits FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.can_view_habit(_habit uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.habits h WHERE h.id = _habit AND (h.user_id = auth.uid() OR h.is_shared));
$$;
CREATE OR REPLACE FUNCTION public.owns_habit(_habit uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.habits h WHERE h.id = _habit AND h.user_id = auth.uid());
$$;

CREATE TABLE public.completions (
  habit_id uuid NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  day date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (habit_id, day)
);
GRANT SELECT, INSERT, DELETE ON public.completions TO authenticated;
GRANT ALL ON public.completions TO service_role;
ALTER TABLE public.completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view completions of visible habits" ON public.completions FOR SELECT TO authenticated USING (public.can_view_habit(habit_id));
CREATE POLICY "owner adds completions" ON public.completions FOR INSERT TO authenticated WITH CHECK (public.owns_habit(habit_id));
CREATE POLICY "owner removes completions" ON public.completions FOR DELETE TO authenticated USING (public.owns_habit(habit_id));

CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id uuid NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view comments on visible habits" ON public.comments FOR SELECT TO authenticated USING (public.can_view_habit(habit_id));
CREATE POLICY "post comments on visible habits" ON public.comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND public.can_view_habit(habit_id));
CREATE POLICY "delete own comments" ON public.comments FOR DELETE TO authenticated USING (user_id = auth.uid());