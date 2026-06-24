import { useGetActivityLeaderboard } from "@workspace/api-client-react";
import { PageHeader } from "@/components/page-header";
import { LoadingState, ErrorState, EmptyState } from "@/components/states";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, Trophy } from "lucide-react";

export default function ActivityLeaderboard() {
  const { data: leaderboard, isLoading, error } = useGetActivityLeaderboard();

  return (
    <div className="space-y-6">
      <PageHeader title="Intelligence" description="Operator Performance Metrics">
      </PageHeader>

      {isLoading ? (
        <LoadingState message="Compiling intelligence data..." />
      ) : error ? (
        <ErrorState error={error} />
      ) : !leaderboard?.length ? (
        <EmptyState 
          icon={Activity}
          title="No activity data" 
          description="Insufficient data to compile performance metrics."
        />
      ) : (
        <div className="border border-border rounded-lg overflow-hidden bg-card/30">
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow>
                <TableHead className="font-mono text-xs tracking-wider w-16 text-center">Rank</TableHead>
                <TableHead className="font-mono text-xs tracking-wider">Operator</TableHead>
                <TableHead className="font-mono text-xs tracking-wider">Grade / Division</TableHead>
                <TableHead className="font-mono text-xs tracking-wider text-right">Patrols</TableHead>
                <TableHead className="font-mono text-xs tracking-wider text-right">Total Hours</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard.map((record, index) => (
                <TableRow key={record.memberId} className="hover:bg-secondary/30 transition-colors group">
                  <TableCell className="text-center font-mono text-sm">
                    {index === 0 ? (
                      <Trophy className="w-4 h-4 mx-auto text-primary" />
                    ) : index === 1 ? (
                      <span className="text-muted-foreground font-bold">2</span>
                    ) : index === 2 ? (
                      <span className="text-muted-foreground/60 font-bold">3</span>
                    ) : (
                      <span className="text-muted-foreground/30">{index + 1}</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {record.memberName}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{record.rankName || "---"}</span>
                      <span className="text-xs text-muted-foreground">{record.departmentName || "---"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-muted-foreground">
                    {record.patrolCount || 0}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-primary font-medium">
                    {(record.totalPatrolHours || 0).toFixed(1)} <span className="text-xs text-muted-foreground uppercase tracking-widest ml-1">hrs</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
