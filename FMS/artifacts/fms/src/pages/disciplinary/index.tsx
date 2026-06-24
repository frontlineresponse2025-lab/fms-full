import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useListDisciplinary,
  useListMembers,
  createDisciplinary,
  type DisciplinaryInput,
} from "@workspace/api-client-react";
import { PageHeader } from "@/components/page-header";
import { LoadingState, ErrorState, EmptyState } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
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
import { AlertTriangle, Plus } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";

type FormData = {
  memberId: string;
  type: string;
  reason: string;
  issuedBy: string;
  expiresAt: string;
  notes: string;
};

const EMPTY_FORM: FormData = {
  memberId: "",
  type: "warning",
  reason: "",
  issuedBy: "",
  expiresAt: "",
  notes: "",
};

export default function Disciplinary() {
  const { data: records, isLoading, error } = useListDisciplinary();
  const { data: members } = useListMembers({});
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);

  const createMutation = useMutation({
    mutationFn: () => {
      const payload: DisciplinaryInput = {
        memberId: Number(form.memberId),
        type: form.type,
        reason: form.reason,
        issuedBy: form.issuedBy || user?.callsign || undefined,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
        notes: form.notes || undefined,
      };
      return createDisciplinary(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/disciplinary"] });
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      toast({ title: "Action issued" });
    },
    onError: () => toast({ title: "Error issuing action", variant: "destructive" }),
  });

  function set(key: keyof FormData, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function openCreate() {
    setForm({ ...EMPTY_FORM, issuedBy: user?.callsign ?? "" });
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Disciplinary" description="Infractions & Terminations">
        <Button variant="destructive" className="gap-2" onClick={openCreate}>
          <Plus className="w-4 h-4" /> Issue Action
        </Button>
      </PageHeader>

      {isLoading ? (
        <LoadingState message="Fetching disciplinary records..." />
      ) : error ? (
        <ErrorState error={error} />
      ) : !records?.length ? (
        <EmptyState icon={AlertTriangle} title="Clean record" description="There are no disciplinary actions recorded in the system." />
      ) : (
        <div className="border border-border rounded-lg overflow-hidden bg-card/30">
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow>
                <TableHead className="font-mono text-xs tracking-wider">Operator</TableHead>
                <TableHead className="font-mono text-xs tracking-wider">Type</TableHead>
                <TableHead className="font-mono text-xs tracking-wider">Reason</TableHead>
                <TableHead className="font-mono text-xs tracking-wider">Issued By</TableHead>
                <TableHead className="font-mono text-xs tracking-wider">Issued Date</TableHead>
                <TableHead className="font-mono text-xs tracking-wider">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id} className="hover:bg-secondary/30 transition-colors">
                  <TableCell className="font-medium text-foreground">
                    {record.memberName || `ID: ${record.memberId}`}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs uppercase text-destructive tracking-widest bg-destructive/10 px-2 py-0.5 rounded border border-destructive/20">
                      {record.type}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm truncate max-w-[250px]">{record.reason}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{record.issuedBy || "System"}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {format(new Date(record.issuedAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    {record.active ? (
                      <StatusBadge status="Active" className="bg-destructive/20 text-destructive border-destructive/30" />
                    ) : (
                      <StatusBadge status="Closed" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-mono uppercase tracking-widest text-sm">Issue Disciplinary Action</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
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
              <div className="space-y-2">
                <Label>Action Type *</Label>
                <Select value={form.type} onValueChange={(v) => set("type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="strike">Strike</SelectItem>
                    <SelectItem value="suspension">Suspension</SelectItem>
                    <SelectItem value="termination">Termination</SelectItem>
                    <SelectItem value="demotion">Demotion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason *</Label>
              <Textarea value={form.reason} onChange={(e) => set("reason", e.target.value)} placeholder="Describe the infraction..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Issued By</Label>
                <Input value={form.issuedBy} onChange={(e) => set("issuedBy", e.target.value)} placeholder="Your callsign" />
              </div>
              <div className="space-y-2">
                <Label>Expires At</Label>
                <Input type="date" value={form.expiresAt} onChange={(e) => set("expiresAt", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Additional notes..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !form.memberId || !form.reason}>
              {createMutation.isPending ? "Issuing…" : "Issue Action"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
