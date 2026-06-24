import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useListCareers,
  useListDepartments,
  createCareer,
  updateCareer,
  deleteCareer,
  type CareerInput,
  type Career,
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
import { Briefcase, Plus, Users, Edit2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CAREERS_KEY = ["/api/careers"];

type FormData = {
  title: string;
  departmentId: string;
  description: string;
  requirements: string;
  isOpen: string;
};

const EMPTY_FORM: FormData = {
  title: "",
  departmentId: "",
  description: "",
  requirements: "",
  isOpen: "true",
};

export default function Careers() {
  const { data: careers, isLoading, error } = useListCareers();
  const { data: departments } = useListDepartments();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Career | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Career | null>(null);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(career: Career) {
    setEditing(career);
    setForm({
      title: career.title,
      departmentId: career.departmentId ? String(career.departmentId) : "",
      description: career.description ?? "",
      requirements: career.requirements ?? "",
      isOpen: career.isOpen ? "true" : "false",
    });
    setDialogOpen(true);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: CareerInput = {
        title: form.title,
        departmentId: form.departmentId && form.departmentId !== "none" ? Number(form.departmentId) : undefined,
        description: form.description || undefined,
        requirements: form.requirements || undefined,
        isOpen: form.isOpen === "true",
      };
      if (editing) return updateCareer(editing.id, payload);
      return createCareer(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CAREERS_KEY });
      setDialogOpen(false);
      toast({ title: editing ? "Posting updated" : "Posting created" });
    },
    onError: () => toast({ title: "Error saving posting", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCareer(deleteTarget!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CAREERS_KEY });
      setDeleteTarget(null);
      toast({ title: "Posting deleted" });
    },
    onError: () => toast({ title: "Error deleting posting", variant: "destructive" }),
  });

  function set(key: keyof FormData, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Postings" description="Internal Career Opportunities">
        <Button className="gap-2" onClick={openCreate}>
          <Plus className="w-4 h-4" /> New Posting
        </Button>
      </PageHeader>

      {isLoading ? (
        <LoadingState message="Fetching open positions..." />
      ) : error ? (
        <ErrorState error={error} />
      ) : !careers?.length ? (
        <EmptyState icon={Briefcase} title="No career postings" description="Create postings to advertise internal roles." />
      ) : (
        <div className="border border-border rounded-lg overflow-hidden bg-card/30">
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow>
                <TableHead className="font-mono text-xs tracking-wider">Title</TableHead>
                <TableHead className="font-mono text-xs tracking-wider">Division</TableHead>
                <TableHead className="font-mono text-xs tracking-wider">Status</TableHead>
                <TableHead className="font-mono text-xs tracking-wider text-right">Applicants</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {careers.map((career) => (
                <TableRow key={career.id} className="hover:bg-secondary/30 transition-colors">
                  <TableCell className="font-medium text-foreground">{career.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{career.departmentName || "General"}</TableCell>
                  <TableCell><StatusBadge status={career.isOpen ? "Open" : "Closed"} /></TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center justify-end gap-1.5 font-mono text-sm text-muted-foreground">
                      <Users className="w-3.5 h-3.5" />
                      {career.applicationCount || 0}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openEdit(career)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteTarget(career)}>
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
              {editing ? "Edit Posting" : "New Career Posting"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Senior Officer" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Division</Label>
                <Select value={form.departmentId} onValueChange={(v) => set("departmentId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select division" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">General</SelectItem>
                    {departments?.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status *</Label>
                <Select value={form.isOpen} onValueChange={(v) => set("isOpen", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Open</SelectItem>
                    <SelectItem value="false">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Role description..." rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Requirements</Label>
              <Textarea value={form.requirements} onChange={(e) => set("requirements", e.target.value)} placeholder="Requirements to apply..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.title}>
              {saveMutation.isPending ? "Saving…" : editing ? "Save Changes" : "Create Posting"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.title}"?`}
        description="This posting will be permanently removed along with its application history."
        onConfirm={() => deleteMutation.mutate()}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
