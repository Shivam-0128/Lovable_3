import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { AuthCard } from "@/components/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign up — Habit Circle" },
      { name: "description", content: "Create your Habit Circle account." },
      { property: "og:title", content: "Sign up — Habit Circle" },
      { property: "og:description", content: "Create your Habit Circle account." },
    ],
  }),
  component: SignUp,
});

const schema = z.object({
  displayName: z.string().trim().min(1, "Display name is required").max(60),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

function SignUp() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ displayName: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: { data: { display_name: parsed.data.displayName }, emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    navigate({ to: "/habits" });
  }

  return (
    <AuthCard
      title="Sign up"
      footer={<>Already a member? <Link to="/signin" className="font-semibold text-primary underline">Sign in</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="dn">Display name</Label>
          <Input id="dn" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="em">Email</Label>
          <Input id="em" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pw">Password</Label>
          <Input id="pw" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>Sign up</Button>
      </form>
    </AuthCard>
  );
}
