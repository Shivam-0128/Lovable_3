import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Habit Circle — track habits with your friends" },
      { name: "description", content: "A small community habit tracker: tick off daily habits, keep some private, share others and discuss them." },
      { property: "og:title", content: "Habit Circle — track habits with your friends" },
      { property: "og:description", content: "Tick off daily habits, keep some private, share others and discuss them." },
    ],
  }),
  component: Index,
});

function Index() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
        <span className="font-display text-2xl font-bold text-primary">Habit Circle</span>
        <nav className="flex gap-2">
          {signedIn ? (
            <>
              <Button asChild variant="ghost"><Link to="/habits">My habits</Link></Button>
              <Button asChild variant="ghost"><Link to="/community">Community</Link></Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost"><Link to="/signin">Sign in</Link></Button>
              <Button asChild><Link to="/signup">Sign up</Link></Button>
            </>
          )}
        </nav>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 pb-24">
        <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">For friends & colleagues</p>
        <h1 className="max-w-3xl text-5xl font-bold leading-tight md:text-7xl">
          Small habits, <span className="text-primary">kept together.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Tick off your days, keep some habits to yourself, and share the rest with your circle for advice and encouragement.
        </p>
        <div className="mt-8 flex gap-3">
          <Button asChild size="lg"><Link to={signedIn ? "/habits" : "/signup"}>{signedIn ? "Open my habits" : "Join your circle"}</Link></Button>
        </div>
      </main>
    </div>
  );
}
