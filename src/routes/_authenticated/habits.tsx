import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/habits")({
  head: () => ({ meta: [{ title: "My habits — Habit Circle" }] }),
  component: MyHabits,
});

function MyHabits() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [whenText, setWhenText] = useState("");
  const [shared, setShared] = useState(false);

  const { data: habits = [], isLoading } = useQuery({
    queryKey: ["my-habits", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("habits")
        .select("id, name, is_shared, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("habits")
        .insert({ user_id: user.id, name: name.trim(), when_text: whenText.trim(), is_shared: shared });
      if (error) throw error;
    },
    onSuccess: () => {
      setName(""); setWhenText(""); setShared(false);
      qc.invalidateQueries({ queryKey: ["my-habits"] });
      toast.success("Habit added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error("Habit name is required");
    if (name.length > 120 || whenText.length > 1000) return toast.error("Text is too long");
    add.mutate();
  }

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold">My habits</h1>

      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border bg-card p-5">
        <div className="space-y-1.5">
          <Label htmlFor="hn">Habit name</Label>
          <Input id="hn" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="wh">When I do it</Label>
          <Textarea
            id="wh"
            value={whenText}
            onChange={(e) => setWhenText(e.target.value)}
            placeholder="e.g. Right after my morning coffee, especially when the sun is out"
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="sh" checked={shared} onCheckedChange={(v) => setShared(v === true)} />
          <Label htmlFor="sh">Share with the community</Label>
        </div>
        <Button type="submit" disabled={add.isPending}>Add habit</Button>
      </form>

      <ul className="divide-y rounded-xl border bg-card">
        {isLoading && <li className="p-4 text-muted-foreground">Loading…</li>}
        {!isLoading && habits.length === 0 && (
          <li className="p-4 text-muted-foreground">No habits yet — add your first one above.</li>
        )}
        {habits.map((h) => (
          <li key={h.id} className="flex items-center justify-between p-4">
            <Link to="/habits/$id" params={{ id: h.id }} className="font-semibold hover:text-primary hover:underline">
              {h.name}
            </Link>
            <Badge variant={h.is_shared ? "default" : "secondary"}>{h.is_shared ? "Shared" : "Private"}</Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
