import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useListDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getListDepartmentsQueryKey,
  type DepartmentInput,
  type Department,
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
import { Shield, Plus, Edit2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type FormData = {
  name: string;
  description: string;
  color: string;
  discordRoleId: string;
};

const EMPTY_FORM: FormData = { name: "", description: "", color: "#6366f1", discordRoleId: "" };

export default function Departments() {
  const { data: departments, isLoading, error } = useListDepartments();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(dept: Department) {
    setEditing(dept);
    setForm({
      name: dept.name,
      description: dept.description ?? "",
      color: dept.color ?? "#6366f1",
      discordRoleId: dept.discordRoleId ?? "",
    });
    setDialogOpen(true);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: DepartmentInput = {
        name: form.name,
        description: form.description || undefined,
        color: form.color || undefined,
        discordRoleId: form.discordRoleId || undefined,
      };
      if (editing) return updateDepartment(editing.id, payload);
      return createDepartment(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getListDepartmentsQueryKey() });
      setDialogOpen(false);
      toast({ title: editing ? "Division updated" : "Division created" });
    },
    onError: () => toast({ title: "Error saving division", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteDepartment(deleteTarget!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getListDepartmentsQueryKey() });
      setDeleteTarget(null);
      toast({ title: "Division deleted" });
    },
    onError: () => toast({ title: "Error deleting division", variant: "destructive" }),
  });

  function set(key: keyof FormData, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Divisions" description="Department Management">
        <Button className="gap-2" onClick={openCreate}>
          <Plus className="w-4 h-4" /> New Division
        </Button>
      </PageHeader>

      {isLoading ? (
        <LoadingState message="Fetching divisions..." />
      ) : error ? (
        <ErrorState error={error} />
      ) : !departments?.length ? (
        <EmptyState icon={Shield} title="No divisions established" description="Create departments to organize your personnel." />
      ) : (
        <div className="border border-border rounded-lg overflow-hidden bg-card/30">
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow>
                <TableHead className="font-mono text-xs tracking-wider">Division Name</TableHead>
                <TableHead className="font-mono text-xs tracking-wider">Command</TableHead>
                <TableHead className="font-mono text-xs tracking-wider">Description</TableHead>
                <TableHead className="font-mono text-xs tracking-wider">Discord Role</TableHead>
                <TableHead className="font-mono text-xs tracking-wider">Strength</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((dept) => (
                <TableRow key={dept.id} className="hover:bg-secondary/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {dept.color && (
                        <div className="w-3 h-3 rounded-sm border border-border/50" style={{ backgroundColor: dept.color }} />
                      )}
                      <span className="font-medium font-display tracking-wide">{dept.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {dept.leaderName ? (
                      <span className="text-sm font-medium text-primary">{dept.leaderName}</span>
                    ) : (
                      <span className="text-muted-foreground text-sm italic">Vacant</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground truncate max-w-[300px]">
                    {dept.description || "---"}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {dept.discordRoleId || "---"}
                  </TableCell>
                  <TableCell>
                    <span className="bg-secondary px-2 py-1 rounded text-xs font-mono">{dept.memberCount || 0}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openEdit(dept)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteTarget(dept)}>
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
              {editing ? "Edit Division" : "New Division"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Division Name *</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Special Operations" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Division mission..." rows={2} />
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
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.name}>
              {saveMutation.isPending ? "Saving…" : editing ? "Save Changes" : "Create Division"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This division will be permanently removed. Members in this division will lose their assignment."
        onConfirm={() => deleteMutation.mutate()}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
