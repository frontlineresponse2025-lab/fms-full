import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useListRanks,
  createRank,
  updateRank,
  deleteRank,
  getListRanksQueryKey,
  type RankInput,
  type Rank,
} from "@workspace/api-client-react";
import { PageHeader } from "@/components/page-header";
import { LoadingState, ErrorState, EmptyState } from "@/components/states";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Layers, Plus, Edit2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type FormData = {
  name: string;
  level: string;
  description: string;
  color: string;
  discordRoleId: string;
};

const EMPTY_FORM: FormData = {
  name: "",
  level: "",
  description: "",
  color: "#6366f1",
  discordRoleId: "",
};

export default function Ranks() {
  const { data: ranks, isLoading, error } = useListRanks();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Rank | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Rank | null>(null);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(rank: Rank) {
    setEditing(rank);
    setForm({
      name: rank.name,
      level: String(rank.level),
      description: rank.description ?? "",
      color: rank.color ?? "#6366f1",
      discordRoleId: rank.discordRoleId ?? "",
    });
    setDialogOpen(true);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: RankInput = {
        name: form.name,
        level: Number(form.level),
        description: form.description || undefined,
        color: form.color || undefined,
        discordRoleId: form.discordRoleId || undefined,
      };
      if (editing) return updateRank(editing.id, payload);
      return createRank(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getListRanksQueryKey() });
      setDialogOpen(false);
      toast({ title: editing ? "Rank updated" : "Rank created" });
    },
    onError: () => {
      toast({ title: "Error saving rank", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteRank(deleteTarget!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getListRanksQueryKey() });
      setDeleteTarget(null);
      toast({ title: "Rank deleted" });
    },
    onError: () => {
      toast({ title: "Error deleting rank", variant: "destructive" });
    },
  });

  function set(key: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Rank Structure" description="Hierarchy Configuration">
        <Button className="gap-2" onClick={openCreate}>
          <Plus className="w-4 h-4" /> Create Rank
        </Button>
      </PageHeader>

      {isLoading ? (
        <LoadingState message="Fetching hierarchy..." />
      ) : error ? (
        <ErrorState error={error} />
      ) : !ranks?.length ? (
        <EmptyState
          icon={Layers}
          title="No ranks configured"
          description="Create ranks to establish your command hierarchy."
        />
      ) : (
        <div className="border border-border rounded-lg overflow-hidden bg-card/30">
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow>
                <TableHead className="font-mono text-xs tracking-wider w-16">Level</TableHead>
                <TableHead className="font-mono text-xs tracking-wider">Rank Name</TableHead>
                <TableHead className="font-mono text-xs tracking-wider">Description</TableHead>
                <TableHead className="font-mono text-xs tracking-wider">Discord Role ID</TableHead>
                <TableHead className="font-mono text-xs tracking-wider">Personnel</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...ranks].sort((a, b) => b.level - a.level).map((rank) => (
                <TableRow key={rank.id} className="hover:bg-secondary/30 transition-colors">
                  <TableCell className="font-mono text-muted-foreground">{rank.level}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {rank.color && (
                        <div
                          className="w-3 h-3 rounded-full border border-border/50"
                          style={{ backgroundColor: rank.color }}
                        />
                      )}
                      <span className="font-medium">{rank.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]">
                    {rank.description || "---"}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {rank.discordRoleId || "---"}
                  </TableCell>
                  <TableCell>
                    <span className="bg-secondary px-2 py-1 rounded text-xs font-mono">
                      {rank.memberCount || 0}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => openEdit(rank)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget(rank)}
                      >
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-mono uppercase tracking-widest text-sm">
              {editing ? "Edit Rank" : "Create Rank"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rank Name *</Label>
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Commander" />
              </div>
              <div className="space-y-2">
                <Label>Level *</Label>
                <Input type="number" value={form.level} onChange={(e) => set("level", e.target.value)} placeholder="e.g. 10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Role description..." rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={form.color} onChange={(e) => set("color", e.target.value)} className="w-10 h-10 rounded cursor-pointer border border-border bg-transparent p-0.5" />
                  <Input value={form.color} onChange={(e) => set("color", e.target.value)} className="font-mono text-sm" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Discord Role ID</Label>
                <Input value={form.discordRoleId} onChange={(e) => set("discordRoleId", e.target.value)} placeholder="123456789" className="font-mono" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !form.name || !form.level}
            >
              {saveMutation.isPending ? "Saving…" : editing ? "Save Changes" : "Create Rank"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This rank will be permanently removed. Members assigned this rank will be unaffected but lose their rank assignment."
        onConfirm={() => deleteMutation.mutate()}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
