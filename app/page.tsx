import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, Calendar, BookOpen, CheckSquare, MessageSquare } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home className="h-6 w-6 text-[var(--primary)]" />
            <span className="text-xl font-bold text-[var(--foreground)]">Flow Your Home</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button>Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4">
        <section className="py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-[var(--foreground)] mb-6">
            Your family home,<br />beautifully managed
          </h1>
          <p className="text-lg md:text-xl text-[var(--muted-foreground)] max-w-2xl mx-auto mb-8">
            Coordinate bookings, share house instructions, manage tasks, and keep everyone
            in the loop — all in one warm, simple space.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg">Create your home</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">I have an invite</Button>
            </Link>
          </div>
        </section>

        <section className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              icon: Calendar,
              title: "Shared Calendar",
              description: "See who's visiting when. Book your stay and get admin approval — no more double bookings.",
            },
            {
              icon: BookOpen,
              title: "House Manual",
              description: "Wi-Fi password, boiler instructions, local tips — everything in one place for every visitor.",
            },
            {
              icon: CheckSquare,
              title: "Task List",
              description: "Track repairs, shopping, and cleaning. Assign tasks to family members or the next visitor.",
            },
            {
              icon: MessageSquare,
              title: "Announcements",
              description: "Share updates with everyone. Pin important notes and discuss in comment threads.",
            },
          ].map((feature) => (
            <div key={feature.title} className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] mb-4">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-[var(--muted-foreground)] text-sm">{feature.description}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-[var(--border)] py-8 text-center text-sm text-[var(--muted-foreground)]">
        <p>Flow Your Home — Made for families who share more than just memories.</p>
      </footer>
    </div>
  );
}
