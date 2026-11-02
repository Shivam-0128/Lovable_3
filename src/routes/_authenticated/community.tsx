import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/community")({
  head: () => ({ meta: [{ title: "Community — Habit Circle" }] }),
  component: Community,
});

function Community() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["community"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("habits")
        .select("id, name, when_text, profiles(display_name), completions(count)")
        .eq("is_shared", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold">Community</h1>
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {!isLoading && data.length === 0 && <p className="text-muted-foreground">No shared habits yet.</p>}
      <ul className="space-y-4">
        {data.map((h) => (
          <li key={h.id} className="rounded-xl border bg-card p-5">
            <div className="flex items-baseline justify-between gap-4">
              <Link to="/habits/$id" params={{ id: h.id }} className="font-display text-xl font-bold hover:text-primary hover:underline">
                {h.name}
              </Link>
              <span className="text-sm text-muted-foreground">{h.profiles?.display_name}</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{h.when_text || "—"}</p>
            <p className="mt-3 text-sm font-semibold">
              Days done: <span className="text-primary">{h.completions[0]?.count ?? 0}</span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
