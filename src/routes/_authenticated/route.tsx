import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ListChecks, Users, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/signin" });
    return { user: data.user };
  },
  component: Layout,
});

function Layout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/signin", replace: true });
  }

  const sideLink =
    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-sidebar-foreground hover:bg-sidebar-accent";
  const active = { className: "bg-sidebar-accent text-sidebar-primary" };

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 flex-col bg-sidebar p-4 md:flex">
        <span className="mb-8 px-3 font-display text-2xl font-bold text-sidebar-primary">Habit Circle</span>
        <nav className="flex flex-col gap-1">
          <Link to="/habits" className={sideLink} activeProps={active}>
            <ListChecks className="h-4 w-4" /> My habits
          </Link>
          <Link to="/community" className={sideLink} activeProps={active}>
            <Users className="h-4 w-4" /> Community
          </Link>
        </nav>
        <button onClick={signOut} className={`${sideLink} mt-auto`}>
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-card px-6 py-3">
          <nav className="flex gap-1">
            <Button asChild variant="ghost" size="sm"><Link to="/habits">My habits</Link></Button>
            <Button asChild variant="ghost" size="sm"><Link to="/community">Community</Link></Button>
          </nav>
          <Button variant="outline" size="sm" onClick={signOut}>Sign out</Button>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
