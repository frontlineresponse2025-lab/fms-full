import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useListWhitelist,
  createWhitelistEntry,
  updateWhitelistEntry,
  deleteWhitelistEntry,
  type WhitelistInput,
  type WhitelistEntry,
} from "@workspace/api-client-react";
import { PageHeader } from "@/components/page-header";
import { LoadingState, ErrorState, EmptyState } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
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
import { ShieldCheck, Plus, Edit2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";

const WHITELIST_KEY = ["/api/whitelist"];

type FormData = {
  discordId: string;
  discordUsername: string;
  characterName: string;
  status: string;
  addedBy: string;
  notes: string;
};

const EMPTY_FORM: FormData = {
  discordId: "",
  discordUsername: "",
  characterName: "",
  status: "active",
  addedBy: "",
  notes: "",
};

export default function Whitelist() {
  const { data: whitelist, isLoading, error } = useListWhitelist();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<WhitelistEntry | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<WhitelistEntry | null>(null);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, addedBy: user?.callsign ?? "" });
    setDialogOpen(true);
  }

  function openEdit(entry: WhitelistEntry) {
    setEditing(entry);
    setForm({
      discordId: entry.discordId,
      discordUsername: entry.discordUsername ?? "",
      characterName: entry.characterName ?? "",
      status: entry.status,
      addedBy: entry.addedBy ?? "",
      notes: entry.notes ?? "",
    });
    setDialogOpen(true);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        return updateWhitelistEntry(editing.id, {
          discordUsername: form.discordUsername || undefined,
          characterName: form.characterName || undefined,
          status: form.status,
          addedBy: form.addedBy || undefined,
          notes: form.notes || undefined,
        });
      }
      const payload: WhitelistInput = {
        discordId: form.discordId,
        discordUsername: form.discordUsername || undefined,
        characterName: form.characterName || undefined,
        status: form.status,
        addedBy: form.addedBy || undefined,
        notes: form.notes || undefined,
      };
      return createWhitelistEntry(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: WHITELIST_KEY });
      setDialogOpen(false);
      toast({ title: editing ? "Entry updated" : "Access granted" });
    },
    onError: () => toast({ title: "Error saving entry", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteWhitelistEntry(deleteTarget!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: WHITELIST_KEY });
      setDeleteTarget(null);
      toast({ title: "Access revoked" });
    },
    onError: () => toast({ title: "Error revoking access", variant: "destructive" }),
  });

  function set(key: keyof FormData, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Clearance" description="Server Access Control">
        <Button className="gap-2" onClick={openCreate}>
          <Plus className="w-4 h-4" /> Grant Access
        </Button>
      </PageHeader>

      {isLoading ? (
        <LoadingState message="Verifying clearance levels..." />
      ) : error ? (
        <ErrorState error={error} />
      ) : !whitelist?.length ? (
        <EmptyState icon={ShieldCheck} title="No clearance records" description="No users are currently whitelisted for server access." />
      ) : (
        <div className="border border-border rounded-lg overflow-hidden bg-card/30">
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow>
                <TableHead className="font-mono text-xs tracking-wider">Discord ID</TableHead>
                <TableHead className="font-mono text-xs tracking-wider">Username</TableHead>
                <TableHead className="font-mono text-xs tracking-wider">Character</TableHead>
                <TableHead className="font-mono text-xs tracking-wider">Added By</TableHead>
                <TableHead className="font-mono text-xs tracking-wider">Status</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {whitelist.map((entry) => (
                <TableRow key={entry.id} className="hover:bg-secondary/30 transition-colors">
                  <TableCell className="font-mono text-sm text-primary">{entry.discordId}</TableCell>
                  <TableCell className="text-sm">{entry.discordUsername || "---"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{entry.characterName || "---"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{entry.addedBy || "System"}</TableCell>
                  <TableCell><StatusBadge status={entry.status} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openEdit(entry)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteTarget(entry)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
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
            <DialogTitle className="font-mono uppercase tracking-widest text-sm">
              {editing ? "Edit Clearance Entry" : "Grant Server Access"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discord ID *</Label>
                <Input value={form.discordId} onChange={(e) => set("discordId", e.target.value)} placeholder="123456789" className="font-mono" disabled={!!editing} />
              </div>
              <div className="space-y-2">
                <Label>Discord Username</Label>
                <Input value={form.discordUsername} onChange={(e) => set("discordUsername", e.target.value)} placeholder="username#0000" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Character Name</Label>
                <Input value={form.characterName} onChange={(e) => set("characterName", e.target.value)} placeholder="John Smith" />
              </div>
              <div className="space-y-2">
                <Label>Status *</Label>
                <Select value={form.status} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="revoked">Revoked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Added By</Label>
              <Input value={form.addedBy} onChange={(e) => set("addedBy", e.target.value)} placeholder="Your callsign" />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Notes..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || (!editing && !form.discordId)}>
              {saveMutation.isPending ? "Saving…" : editing ? "Save Changes" : "Grant Access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={`Revoke access for "${deleteTarget?.discordUsername || deleteTarget?.discordId}"?`}
        description="This will permanently remove their server access entry."
        confirmLabel="Revoke"
        onConfirm={() => deleteMutation.mutate()}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
