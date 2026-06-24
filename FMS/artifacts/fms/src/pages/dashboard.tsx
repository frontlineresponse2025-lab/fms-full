import { useGetDashboardStats } from "@workspace/api-client-react";
import { LoadingState, ErrorState } from "@/components/states";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Activity, Clock, Crosshair, FileText, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/auth-context";

export default function Dashboard() {
  const { data: stats, isLoading, error } = useGetDashboardStats();
  const { user } = useAuth();

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="text-center py-6">
        <h1 className="text-3xl font-display font-bold text-foreground">
          Welcome, {user?.callsign ?? "Operator"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1 font-mono uppercase tracking-widest">
          Force Management System — Command Overview
        </p>
      </div>

      {/* Top 3-column cards (reference style) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <PortalCard
          title="Active Personnel"
          icon={<Crosshair className="w-4 h-4" />}
        >
          <div className="flex items-end gap-3">
            <span className="text-5xl font-display font-bold text-foreground">{stats.activeMembers}</span>
            <span className="text-muted-foreground mb-1 font-mono text-sm">/ {stats.totalMembers} total</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {stats.totalMembers > 0
              ? `${((stats.activeMembers / stats.totalMembers) * 100).toFixed(1)}% of roster on active duty`
              : "No roster data"}
          </p>
        </PortalCard>

        <PortalCard
          title="Pending Applications"
          icon={<FileText className="w-4 h-4" />}
        >
          {stats.pendingApplications === 0 ? (
            <p className="text-sm text-muted-foreground italic">No pending applications. Check back later.</p>
          ) : (
            <div>
              <span className="text-5xl font-display font-bold text-foreground">{stats.pendingApplications}</span>
              <p className="text-xs text-muted-foreground mt-2">Applications awaiting review</p>
            </div>
          )}
        </PortalCard>

        <PortalCard
          title="Outstanding Actions"
          icon={<ShieldCheck className="w-4 h-4" />}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Open Postings</span>
              <span className="font-mono font-bold text-primary">{stats.openPositions}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Whitelisted</span>
              <span className="font-mono font-bold text-primary">{stats.whitelistedCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Patrol Hrs</span>
              <span className="font-mono font-bold text-primary">{Math.round(stats.totalPatrolHours)}</span>
            </div>
          </div>
        </PortalCard>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard title="Total Roster" value={stats.totalMembers} icon={Users} />
        <StatCard title="Active Duty" value={stats.activeMembers} icon={Crosshair} />
        <StatCard title="Patrol Hrs" value={Math.round(stats.totalPatrolHours)} icon={Clock} />
        <StatCard title="Applications" value={stats.pendingApplications} icon={FileText} />
        <StatCard title="Postings" value={stats.openPositions} icon={Activity} />
        <StatCard title="Clearances" value={stats.whitelistedCount} icon={ShieldCheck} />
      </div>

      {/* Bottom two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <PortalCard title="Recent Activity" icon={<Activity className="w-4 h-4" />} className="lg:col-span-2">
          <div className="space-y-2">
            {stats.recentActivity?.map((activity, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded bg-secondary/40 border border-border/50"
              >
                <div>
                  <p className="font-medium text-sm">{activity.memberName}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {activity.rankName} · {activity.departmentName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono text-primary font-bold">{activity.totalPatrolHours} HRS</p>
                  <p className="text-xs text-muted-foreground">{activity.patrolCount} patrols</p>
                </div>
              </div>
            ))}
            {(!stats.recentActivity || stats.recentActivity.length === 0) && (
              <p className="text-sm text-muted-foreground italic text-center py-4">No recent activity recorded.</p>
            )}
          </div>
        </PortalCard>

        <PortalCard title="Division Breakdown" icon={<Users className="w-4 h-4" />}>
          <div className="space-y-3">
            {stats.departmentBreakdown?.map((dept, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{dept.name}</span>
                <span className="font-mono text-sm bg-secondary px-2 py-0.5 rounded border border-border">
                  {dept.count}
                </span>
              </div>
            ))}
            {(!stats.departmentBreakdown || stats.departmentBreakdown.length === 0) && (
              <p className="text-sm text-muted-foreground italic text-center py-4">No division data.</p>
            )}
          </div>
        </PortalCard>
      </div>
    </div>
  );
}

function PortalCard({
  title,
  icon,
  children,
  className,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={`overflow-hidden border-border bg-card/80 ${className ?? ""}`}>
      <CardHeader className="py-2.5 px-4 bg-[hsl(var(--nav-header))] border-b border-border/50">
        <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">{children}</CardContent>
    </Card>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="bg-card/80 border-border overflow-hidden">
      <CardContent className="p-4 relative">
        <Icon className="absolute top-3 right-3 w-8 h-8 text-primary/10" />
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">{title}</p>
        <p className="text-3xl font-display font-bold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}
