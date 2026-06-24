import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useListPatrolLogs,
  useListMembers,
  createPatrolLog,
  getListPatrolLogsQueryKey,
  type PatrolLogInput,
} from "@workspace/api-client-react";
import { PageHeader } from "@/components/page-header";
import { LoadingState, ErrorState, EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Activity, Plus, Clock } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

type FormData = {
  memberId: string;
  startTime: string;
  endTime: string;
  durationMinutes: string;
  server: string;
  notes: string;
};

const EMPTY_FORM: FormData = {
  memberId: "",
  startTime: "",
  endTime: "",
  durationMinutes: "",
  server: "",
  notes: "",
};

export default function PatrolLogs() {
  const { data: logs, isLoading, error } = useListPatrolLogs();
  const { data: members } = useListMembers({});
  const qc = useQueryClient();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);

  const createMutation = useMutation({
    mutationFn: () => {
      const payload: PatrolLogInput = {
        memberId: Number(form.memberId),
        startTime: new Date(form.startTime).toISOString(),
        endTime: form.endTime ? new Date(form.endTime).toISOString() : undefined,
        durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : undefined,
        server: form.server || undefined,
        notes: form.notes || undefined,
      };
      return createPatrolLog(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getListPatrolLogsQueryKey() });
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      toast({ title: "Patrol logged" });
    },
    onError: () => toast({ title: "Error logging patrol", variant: "destructive" }),
  });

  function set(key: keyof FormData, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Patrol Matrix" description="Unit Activity Logs">
        <Button className="gap-2" onClick={() => { setForm(EMPTY_FORM); setDialogOpen(true); }}>
          <Plus className="w-4 h-4" /> Log Patrol
        </Button>
      </PageHeader>

      {isLoading ? (
        <LoadingState message="Fetching patrol data..." />
      ) : error ? (
        <ErrorState error={error} />
      ) : !logs?.length ? (
        <EmptyState icon={Activity} title="No patrol logs found" description="Members haven't logged any patrols yet." />
      ) : (
        <div className="border border-border rounded-lg overflow-hidden bg-card/30">
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow>
                <TableHead className="font-mono text-xs tracking-wider">Operator</TableHead>
                <TableHead className="font-mono text-xs tracking-wider">Start Time</TableHead>
                <TableHead className="font-mono text-xs tracking-wider">End Time</TableHead>
                <TableHead className="font-mono text-xs tracking-wider">Duration</TableHead>
                <TableHead className="font-mono text-xs tracking-wider">Server</TableHead>
                <TableHead className="font-mono text-xs tracking-wider">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} className="hover:bg-secondary/30 transition-colors">
                  <TableCell className="font-medium text-primary">{log.memberName || "Unknown"}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {format(new Date(log.startTime), "MMM d, HH:mm")}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {log.endTime ? format(new Date(log.endTime), "MMM d, HH:mm") : "Ongoing"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 font-mono text-sm">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      {log.durationMinutes ? `${(log.durationMinutes / 60).toFixed(1)}h` : "---"}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{log.server || "---"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]">{log.notes || "---"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-mono uppercase tracking-widest text-sm">Log Patrol</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Operator *</Label>
              <Select value={form.memberId} onValueChange={(v) => set("memberId", v)}>
                <SelectTrigger><SelectValue placeholder="Select operator" /></SelectTrigger>
                <SelectContent>
                  {members?.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.callsign ? `${m.callsign} — ` : ""}{m.characterName || m.discordUsername}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time *</Label>
                <Input type="datetime-local" value={form.startTime} onChange={(e) => set("startTime", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input type="datetime-local" value={form.endTime} onChange={(e) => set("endTime", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Input type="number" value={form.durationMinutes} onChange={(e) => set("durationMinutes", e.target.value)} placeholder="e.g. 90" />
              </div>
              <div className="space-y-2">
                <Label>Server</Label>
                <Input value={form.server} onChange={(e) => set("server", e.target.value)} placeholder="e.g. Server 1" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Patrol notes..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !form.memberId || !form.startTime}>
              {createMutation.isPending ? "Logging…" : "Log Patrol"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
