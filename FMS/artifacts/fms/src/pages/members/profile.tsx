import { useState } from "react";
import { useParams, Link } from "wouter";
import {
  useGetMember,
  getGetMemberQueryKey,
  useListPatrolLogs,
  useListDisciplinary,
  useListApplications,
} from "@workspace/api-client-react";
import { LoadingState, ErrorState } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Shield,
  Activity,
  Clock,
  AlertTriangle,
  FileText,
  ShieldAlert,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "details", label: "Details", icon: Shield },
  { id: "patrols", label: "Patrols", icon: Activity },
  { id: "disciplinaries", label: "Disciplinaries", icon: AlertTriangle },
  { id: "applications", label: "Applications", icon: FileText },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function MemberProfile() {
  const { id } = useParams();
  const memberId = id ? parseInt(id, 10) : 0;
  const [activeTab, setActiveTab] = useState<TabId>("details");

  const { data: member, isLoading, error } = useGetMember(memberId, {
    query: { enabled: !!memberId, queryKey: getGetMemberQueryKey(memberId) },
  });
  const { data: allLogs } = useListPatrolLogs();
  const { data: allDisciplinary } = useListDisciplinary();
  const { data: allApplications } = useListApplications();

  const logs = allLogs?.filter((l) => l.memberId === memberId) ?? [];
  const disciplinary = allDisciplinary?.filter((d) => d.memberId === memberId) ?? [];
  const applications = allApplications?.filter(
    (a) => a.applicantName === member?.characterName || a.applicantName === member?.discordUsername
  ) ?? [];

  if (isLoading) return <LoadingState message="Accessing personnel file..." />;
  if (error || !member) return <ErrorState error={error} message="Personnel file not found." />;

  const displayName = member.characterName || member.discordUsername;

  return (
    <div className="space-y-0 -m-6 md:-m-8">
      {/* Blue profile header */}
      <div className="bg-[hsl(var(--nav-header))] px-6 md:px-8 pt-5 pb-0">
        <Link
          href="/members"
          className="inline-flex items-center gap-1.5 text-xs text-blue-200/70 hover:text-white transition-colors mb-3 font-mono uppercase tracking-wider"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Roster
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-white">
              {displayName}'s Profile
            </h1>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-blue-200/70 text-xs font-mono uppercase tracking-wider">
                {member.callsign ?? "No Callsign"}
              </span>
              <ChevronRight className="w-3 h-3 text-blue-200/40" />
              <span className="text-blue-200/70 text-xs font-mono uppercase tracking-wider">
                {member.rankName ?? "Recruit"}
              </span>
              <ChevronRight className="w-3 h-3 text-blue-200/40" />
              <StatusBadge status={member.status} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="border-white/20 text-white bg-white/10 hover:bg-white/20 text-xs">
              Edit Profile
            </Button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-0 overflow-x-auto border-t border-white/10 -mx-1 px-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-all",
                  isActive
                    ? "border-white text-white"
                    : "border-transparent text-blue-200/60 hover:text-white hover:border-white/30"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.id === "patrols" && logs.length > 0 && (
                  <span className="ml-1 bg-white/20 text-white text-[10px] font-mono rounded px-1.5 py-0.5">
                    {logs.length}
                  </span>
                )}
                {tab.id === "disciplinaries" && disciplinary.length > 0 && (
                  <span className="ml-1 bg-red-400/30 text-red-200 text-[10px] font-mono rounded px-1.5 py-0.5">
                    {disciplinary.length}
                  </span>
                )}
                {tab.id === "applications" && applications.length > 0 && (
                  <span className="ml-1 bg-white/20 text-white text-[10px] font-mono rounded px-1.5 py-0.5">
                    {applications.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-6 md:px-8 pt-6 pb-8">
        {activeTab === "details" && (
          <DetailsTab member={member} logs={logs} />
        )}
        {activeTab === "patrols" && (
          <PatrolsTab logs={logs} />
        )}
        {activeTab === "disciplinaries" && (
          <DisciplinaryTab records={disciplinary} />
        )}
        {activeTab === "applications" && (
          <ApplicationsTab apps={applications} />
        )}
      </div>
    </div>
  );
}

function DetailsTab({ member, logs }: { member: any; logs: any[] }) {
  const totalHours = logs.reduce((sum, l) => sum + (l.durationMinutes ?? 0) / 60, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="space-y-4">
        <SectionCard title="Service Record" icon={Shield}>
          <DetailRow label="Rank" value={<span className="text-primary font-semibold">{member.rankName ?? "Recruit"}</span>} />
          <DetailRow label="Division" value={member.departmentName ?? "Unassigned"} />
          <DetailRow label="Callsign" value={<span className="font-mono">{member.callsign ?? "—"}</span>} />
          <DetailRow label="Status" value={<StatusBadge status={member.status} />} />
          <DetailRow label="Service Start" value={<span className="font-mono text-sm">{format(new Date(member.joinedAt), "MMM d, yyyy")}</span>} />
        </SectionCard>

        <SectionCard title="Contact" icon={Shield}>
          <DetailRow label="Discord" value={<span className="font-mono text-sm">{member.discordUsername ?? "—"}</span>} />
          <DetailRow label="Discord ID" value={<span className="font-mono text-sm text-muted-foreground">{member.discordId ?? "—"}</span>} />
        </SectionCard>
      </div>

      <div className="md:col-span-2 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <StatBox label="Total Patrol Hours" value={`${totalHours.toFixed(1)}`} unit="HRS" icon={Clock} />
          <StatBox label="Total Patrols" value={String(logs.length)} unit="SESSIONS" icon={Activity} />
        </div>

        <SectionCard title="Operations Notes" icon={ShieldAlert}>
          <div className="min-h-[100px] bg-secondary/10 border border-border/50 rounded p-3">
            {member.notes ? (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{member.notes}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic opacity-50">No operational notes filed.</p>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function PatrolsTab({ logs }: { logs: any[] }) {
  if (!logs.length) return (
    <EmptyTabState icon={Activity} message="No patrol logs recorded for this member." />
  );
  return (
    <TabTable
      title="Patrol Logs"
      headers={["Start Time", "End Time", "Duration", "Server", "Notes"]}
    >
      {logs.map((log) => (
        <TableRow key={log.id} className="hover:bg-secondary/30 transition-colors">
          <TableCell className="font-mono text-sm">{format(new Date(log.startTime), "MMM d, yyyy HH:mm")}</TableCell>
          <TableCell className="font-mono text-sm text-muted-foreground">
            {log.endTime ? format(new Date(log.endTime), "MMM d, yyyy HH:mm") : <span className="text-primary">Ongoing</span>}
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-1.5 font-mono text-sm">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              {log.durationMinutes ? `${(log.durationMinutes / 60).toFixed(1)}h` : "—"}
            </div>
          </TableCell>
          <TableCell className="text-sm">{log.server || "—"}</TableCell>
          <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{log.notes || "—"}</TableCell>
        </TableRow>
      ))}
    </TabTable>
  );
}

function DisciplinaryTab({ records }: { records: any[] }) {
  if (!records.length) return (
    <EmptyTabState icon={AlertTriangle} message="No disciplinary actions on record for this member." good />
  );
  return (
    <TabTable
      title="Disciplinary Records"
      headers={["Type", "Reason", "Issued By", "Issued Date", "Status"]}
    >
      {records.map((record) => (
        <TableRow key={record.id} className="hover:bg-secondary/30 transition-colors">
          <TableCell>
            <span className="font-mono text-xs uppercase text-destructive tracking-widest bg-destructive/10 px-2 py-0.5 rounded border border-destructive/20">
              {record.type}
            </span>
          </TableCell>
          <TableCell className="text-sm max-w-xs truncate">{record.reason}</TableCell>
          <TableCell className="text-sm text-muted-foreground">{record.issuedBy || "System"}</TableCell>
          <TableCell className="font-mono text-sm text-muted-foreground">
            {format(new Date(record.issuedAt), "MMM d, yyyy")}
          </TableCell>
          <TableCell>
            <StatusBadge status={record.active ? "Active" : "Closed"} />
          </TableCell>
        </TableRow>
      ))}
    </TabTable>
  );
}

function ApplicationsTab({ apps }: { apps: any[] }) {
  if (!apps.length) return (
    <EmptyTabState icon={FileText} message="No career applications found for this member." />
  );
  return (
    <TabTable
      title="Career Applications"
      headers={["Career", "Type", "Submission Date", "Status"]}
    >
      {apps.map((app) => (
        <TableRow key={app.id} className="hover:bg-secondary/30 transition-colors">
          <TableCell className="font-medium">{app.careerTitle || "General"}</TableCell>
          <TableCell className="font-mono text-xs uppercase text-muted-foreground">{app.type}</TableCell>
          <TableCell className="font-mono text-sm text-muted-foreground">
            {format(new Date(app.submittedAt), "MMM d, yyyy")}
          </TableCell>
          <TableCell><StatusBadge status={app.status} /></TableCell>
        </TableRow>
      ))}
    </TabTable>
  );
}

function TabTable({
  title,
  headers,
  children,
}: {
  title: string;
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="bg-[hsl(var(--nav-header))] px-4 py-2.5">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-secondary/60">
            <TableRow>
              {headers.map((h) => (
                <TableHead key={h} className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>{children}</TableBody>
        </Table>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border overflow-hidden bg-card/60">
      <div className="bg-[hsl(var(--nav-header))] px-4 py-2.5 flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-blue-200/70" />
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider shrink-0">{label}</span>
      <span className="text-sm text-foreground text-right">{value}</span>
    </div>
  );
}

function StatBox({
  label,
  value,
  unit,
  icon: Icon,
}: {
  label: string;
  value: string;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-lg border border-border bg-card/60 p-4 relative overflow-hidden">
      <Icon className="absolute top-3 right-3 w-8 h-8 text-primary/10" />
      <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">{label}</p>
      <div className="flex items-end gap-1.5">
        <span className="text-4xl font-display font-bold text-foreground">{value}</span>
        <span className="text-muted-foreground mb-1 font-mono text-sm">{unit}</span>
      </div>
    </div>
  );
}

function EmptyTabState({
  icon: Icon,
  message,
  good,
}: {
  icon: React.ComponentType<{ className?: string }>;
  message: string;
  good?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className={cn("w-12 h-12 rounded-full flex items-center justify-center",
        good ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-secondary border border-border"
      )}>
        <Icon className={cn("w-6 h-6", good ? "text-emerald-400" : "text-muted-foreground")} />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
