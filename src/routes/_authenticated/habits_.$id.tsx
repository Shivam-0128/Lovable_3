import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { currentStreak, lastDays } from "@/lib/habits";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/habits_/$id")({
  head: () => ({ meta: [{ title: "Habit — Habit Circle" }] }),
  component: HabitPage,
});

function HabitPage() {
  const { id } = Route.useParams();
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [comment, setComment] = useState("");

  const habitQ = useQuery({
    queryKey: ["habit", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("habits")
        .select("id, name, when_text, is_shared, user_id, profiles(display_name), completions(day)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const commentsQ = useQuery({
    queryKey: ["comments", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("id, body, created_at, profiles(display_name)")
        .eq("habit_id", id)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ day, done }: { day: string; done: boolean }) => {
      const { error } = done
        ? await supabase.from("completions").insert({ habit_id: id, day })
        : await supabase.from("completions").delete().eq("habit_id", id).eq("day", day);
      if (error) throw error;
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["habit", id] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const post = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("comments").insert({ habit_id: id, user_id: user.id, body: comment.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      setComment("");
      qc.invalidateQueries({ queryKey: ["comments", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (habitQ.isLoading) return <p className="text-muted-foreground">Loading…</p>;
  const habit = habitQ.data;
  if (!habit) return <p className="text-muted-foreground">This habit doesn't exist or is private.</p>;

  const isOwner = habit.user_id === user.id;
  const doneDays = habit.completions.map((c) => c.day);
  const doneSet = new Set(doneDays);
  const days = lastDays(7);

  function onPost(e: FormEvent) {
    e.preventDefault();
    const t = comment.trim();
    if (!t) return toast.error("Write a comment first");
    if (t.length > 2000) return toast.error("Comment is too long");
    post.mutate();
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-bold">{habit.name}</h1>
          <Badge variant={habit.is_shared ? "default" : "secondary"}>{habit.is_shared ? "Shared" : "Private"}</Badge>
        </div>
        {!isOwner && <p className="mt-1 text-sm text-muted-foreground">by {habit.profiles?.display_name}</p>}
        <div className="mt-4 rounded-xl border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">When I do it</p>
          <p className="mt-1 whitespace-pre-wrap">{habit.when_text || "—"}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Days done:</p>
          <p className="font-display text-3xl font-bold text-primary">{doneDays.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Current streak:</p>
          <p className="font-display text-3xl font-bold text-primary">{currentStreak(doneDays)}</p>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-2xl font-bold">Last 7 days</h2>
        <ul className="divide-y rounded-xl border bg-card">
          {days.map((d) => (
            <li key={d} className="flex items-center gap-3 p-3">
              <Checkbox
                id={`d-${d}`}
                checked={doneSet.has(d)}
                disabled={!isOwner || toggle.isPending}
                onCheckedChange={(v) => toggle.mutate({ day: d, done: v === true })}
              />
              <Label htmlFor={`d-${d}`} className="font-mono">{d}</Label>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Comments</h2>
        <ul className="space-y-3">
          {commentsQ.data?.length === 0 && <li className="text-muted-foreground">No comments yet.</li>}
          {commentsQ.data?.map((c) => (
            <li key={c.id} className="rounded-xl border bg-card p-4">
              <p className="text-sm font-semibold text-primary">{c.profiles?.display_name}</p>
              <p className="mt-1 whitespace-pre-wrap">{c.body}</p>
            </li>
          ))}
        </ul>
        <form onSubmit={onPost} className="space-y-2">
          <Label htmlFor="cm">Comment</Label>
          <Textarea id="cm" value={comment} onChange={(e) => setComment(e.target.value)} />
          <Button type="submit" disabled={post.isPending}>Post comment</Button>
        </form>
      </section>
    </div>
  );
}
