import { useState } from "react";
import { Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useListMembers,
  useListRanks,
  useListDepartments,
  createMember,
  getListMembersQueryKey,
  type MemberInput,
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
import { Users, Search, Plus, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type FormData = {
  discordUsername: string;
  discordId: string;
  callsign: string;
  characterName: string;
  rankId: string;
  departmentId: string;
  status: string;
  notes: string;
};

const EMPTY_FORM: FormData = {
  discordUsername: "",
  discordId: "",
  callsign: "",
  characterName: "",
  rankId: "",
  departmentId: "",
  status: "active",
  notes: "",
};

export default function Members() {
  const [search, setSearch] = useState("");
  const { data: members, isLoading, error } = useListMembers({ search });
  const { data: ranks } = useListRanks();
  const { data: departments } = useListDepartments();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);

  const createMutation = useMutation({
    mutationFn: () => {
      const payload: MemberInput = {
        discordUsername: form.discordUsername,
        discordId: form.discordId || undefined,
        callsign: form.callsign || undefined,
        characterName: form.characterName || undefined,
        rankId: form.rankId ? Number(form.rankId) : undefined,
        departmentId: form.departmentId ? Number(form.departmentId) : undefined,
        status: form.status,
        notes: form.notes || undefined,
      };
      return createMember(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getListMembersQueryKey() });
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      toast({ title: "Personnel added" });
    },
    onError: () => toast({ title: "Error adding personnel", variant: "destructive" }),
  });

  function set(key: keyof FormData, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Roster" description="Personnel Management">
        <Button className="gap-2" onClick={() => { setForm(EMPTY_FORM); setDialogOpen(true); }}>
          <Plus className="w-4 h-4" /> Add Personnel
        </Button>
      </PageHeader>

      <div className="flex items-center gap-4 bg-card/50 p-4 rounded-lg border border-border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search callsign, name, discord..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background/50 border-border"
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Fetching roster data..." />
      ) : error ? (
        <ErrorState error={error} />
      ) : !members?.length ? (
        <EmptyState
          icon={Users}
          title="No personnel found"
          description={search ? "Adjust your search filters to find members." : "The roster is currently empty."}
        />
      ) : (
        <div className="border border-border rounded-lg overflow-hidden bg-card/30">
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow>
                <TableHead className="font-mono text-xs tracking-wider">Callsign</TableHead>
                <TableHead className="font-mono text-xs tracking-wider">Name</TableHead>
                <TableHead className="font-mono text-xs tracking-wider">Rank / Div</TableHead>
                <TableHead className="font-mono text-xs tracking-wider">Discord</TableHead>
                <TableHead className="font-mono text-xs tracking-wider">Patrol Hrs</TableHead>
                <TableHead className="font-mono text-xs tracking-wider">Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id} className="hover:bg-secondary/30 transition-colors group">
                  <TableCell className="font-mono font-medium text-primary">{member.callsign || "---"}</TableCell>
                  <TableCell className="font-medium">{member.characterName || "Unknown"}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{member.rankName || "No Rank"}</span>
                      <span className="text-xs text-muted-foreground">{member.departmentName || "No Dept"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{member.discordUsername}</TableCell>
                  <TableCell className="font-mono text-sm">{member.totalPatrolHours?.toFixed(1) || "0.0"}</TableCell>
                  <TableCell><StatusBadge status={member.status} /></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/members/${member.id}`}><ExternalLink className="w-4 h-4" /></Link>
                    </Button>
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
            <DialogTitle className="font-mono uppercase tracking-widest text-sm">Add Personnel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discord Username *</Label>
                <Input value={form.discordUsername} onChange={(e) => set("discordUsername", e.target.value)} placeholder="username#0000" />
              </div>
              <div className="space-y-2">
                <Label>Discord ID</Label>
                <Input value={form.discordId} onChange={(e) => set("discordId", e.target.value)} placeholder="123456789" className="font-mono" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Callsign</Label>
                <Input value={form.callsign} onChange={(e) => set("callsign", e.target.value)} placeholder="ALPHA-1" className="font-mono uppercase" />
              </div>
              <div className="space-y-2">
                <Label>Character Name</Label>
                <Input value={form.characterName} onChange={(e) => set("characterName", e.target.value)} placeholder="John Smith" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rank</Label>
                <Select value={form.rankId} onValueChange={(v) => set("rankId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select rank" /></SelectTrigger>
                  <SelectContent>
                    {ranks?.map((r) => <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Division</Label>
                <Select value={form.departmentId} onValueChange={(v) => set("departmentId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select division" /></SelectTrigger>
                  <SelectContent>
                    {departments?.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status *</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="loa">Leave of Absence</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Additional notes..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !form.discordUsername}>
              {createMutation.isPending ? "Adding…" : "Add Personnel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
