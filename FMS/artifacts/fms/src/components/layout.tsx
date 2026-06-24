import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Shield,
  Users,
  Layers,
  Activity,
  FileText,
  AlertTriangle,
  ShieldCheck,
  Briefcase,
  Crosshair,
  LogOut,
  Lock,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, ROLE_LABELS, ROLE_INITIALS } from "@/context/auth-context";

const NAV_GROUPS = [
  {
    label: "Command",
    href: "/",
    single: true,
    icon: Crosshair,
  },
  {
    label: "Personnel",
    single: false,
    items: [
      { href: "/members", label: "Roster", icon: Users },
      { href: "/ranks", label: "Ranks", icon: Layers },
      { href: "/departments", label: "Divisions", icon: Shield },
    ],
  },
  {
    label: "Operations",
    single: false,
    items: [
      { href: "/patrol-logs", label: "Patrols", icon: Activity },
      { href: "/activity", label: "Intelligence", icon: Activity },
    ],
  },
  {
    label: "Conduct",
    single: false,
    items: [
      { href: "/applications", label: "Recruitment", icon: FileText },
      { href: "/disciplinary", label: "Disciplinary", icon: AlertTriangle },
    ],
  },
  {
    label: "Admin",
    single: false,
    items: [
      { href: "/whitelist", label: "Clearance", icon: ShieldCheck },
      { href: "/careers", label: "Postings", icon: Briefcase },
    ],
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout, canAccess } = useAuth();
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const initials = user ? ROLE_INITIALS[user.role] : "??";
  const roleLabel = user ? ROLE_LABELS[user.role] : "";

  function isGroupActive(group: (typeof NAV_GROUPS)[number]) {
    if (group.single) return location === "/";
    return group.items?.some(
      (i) => location === i.href || (i.href !== "/" && location.startsWith(i.href))
    );
  }

  function groupHasAccess(group: (typeof NAV_GROUPS)[number]) {
    if (group.single) return canAccess("/");
    return group.items?.some((i) => canAccess(i.href));
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Top Navbar */}
      <nav className="shrink-0 h-12 bg-[hsl(var(--nav))] border-b border-border flex items-center px-4 gap-1 relative z-50">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mr-4 shrink-0">
          <div className="w-7 h-7 rounded bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <span className="font-display font-bold text-base text-foreground tracking-wide">
            FMS
          </span>
        </Link>

        {/* Nav groups */}
        <div className="flex items-center gap-0.5 flex-1">
          {NAV_GROUPS.map((group) => {
            const active = isGroupActive(group);
            const accessible = groupHasAccess(group);

            if (!accessible) {
              return (
                <div
                  key={group.label}
                  className="flex items-center gap-1 px-3 py-1.5 rounded text-sm text-muted-foreground/40 cursor-not-allowed select-none"
                >
                  {group.label}
                  {!group.single && <Lock className="w-3 h-3" />}
                </div>
              );
            }

            if (group.single) {
              return (
                <Link
                  key={group.label}
                  href="/"
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  )}
                >
                  {group.label}
                </Link>
              );
            }

            const isOpen = openGroup === group.label;

            return (
              <div key={group.label} className="relative">
                <button
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  )}
                  onClick={() => setOpenGroup(isOpen ? null : group.label)}
                  onBlur={(e) => {
                    if (!e.currentTarget.parentElement?.contains(e.relatedTarget as Node)) {
                      setOpenGroup(null);
                    }
                  }}
                >
                  {group.label}
                  <ChevronDown
                    className={cn("w-3.5 h-3.5 transition-transform", isOpen && "rotate-180")}
                  />
                </button>

                {isOpen && (
                  <div className="absolute top-full left-0 mt-1 w-44 bg-[hsl(var(--nav))] border border-border rounded-md shadow-lg py-1 z-50">
                    {group.items?.map((item) => {
                      const itemActive =
                        location === item.href ||
                        (item.href !== "/" && location.startsWith(item.href));
                      const itemAccessible = canAccess(item.href);
                      const Icon = item.icon;

                      if (!itemAccessible) {
                        return (
                          <div
                            key={item.href}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground/40 cursor-not-allowed"
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {item.label}
                            <Lock className="w-3 h-3 ml-auto" />
                          </div>
                        );
                      }

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpenGroup(null)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                            itemActive
                              ? "text-primary bg-primary/10"
                              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                          )}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right side: user + logout */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-secondary border border-border flex items-center justify-center text-xs font-mono text-muted-foreground">
              {initials}
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-xs font-medium leading-none text-foreground">{user?.callsign}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{roleLabel}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors border border-border/50"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-xs">Log out</span>
          </button>
        </div>
      </nav>

      {/* Page content */}
      <main
        className="flex-1 overflow-auto relative"
        onClick={() => setOpenGroup(null)}
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        <div className="relative z-10 p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
