import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useListApplications,
  useListCareers,
  createApplication,
  updateApplication,
  getListApplicationsQueryKey,
  type ApplicationInput,
  type Application,
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
import { FileText, Eye, Plus } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";

type NewAppForm = {
  applicantName: string;
  discordUsername: string;
  discordId: string;
  type: string;
  careerId: string;
  answers: string;
};

type ReviewForm = {
  status: string;
  reviewedBy: string;
  reviewNotes: string;
};

const EMPTY_NEW: NewAppForm = {
  applicantName: "",
  discordUsername: "",
  discordId: "",
  type: "recruitment",
  careerId: "",
  answers: "",
};

export default function Applications() {
  const { data: applications, isLoading, error } = useListApplications();
  const { data: careers } = useListCareers();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [newForm, setNewForm] = useState<NewAppForm>(EMPTY_NEW);

  const [reviewTarget, setReviewTarget] = useState<Application | null>(null);
  const [reviewForm, setReviewForm] = useState<ReviewForm>({ status: "", reviewedBy: "", reviewNotes: "" });

  const createMutation = useMutation({
    mutationFn: () => {
      const payload: ApplicationInput = {
        applicantName: newForm.applicantName,
        discordId: newForm.discordId || undefined,
        discordUsername: newForm.discordUsername || undefined,
        type: newForm.type,
        careerId: newForm.careerId && newForm.careerId !== "none" ? Number(newForm.careerId) : undefined,
        answers: newForm.answers || undefined,
      };
      return createApplication(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
      setNewDialogOpen(false);
      setNewForm(EMPTY_NEW);
      toast({ title: "Application submitted" });
    },
    onError: () => toast({ title: "Error submitting application", variant: "destructive" }),
  });

  const reviewMutation = useMutation({
    mutationFn: () =>
      updateApplication(reviewTarget!.id, {
        status: reviewForm.status || undefined,
        reviewedBy: reviewForm.reviewedBy || undefined,
        reviewNotes: reviewForm.reviewNotes || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
      setReviewTarget(null);
      toast({ title: "Application updated" });
    },
    onError: () => toast({ title: "Error updating application", variant: "destructive" }),
  });

  function openReview(app: Application) {
    setReviewTarget(app);
    setReviewForm({
      status: app.status,
      reviewedBy: user?.callsign ?? "",
      reviewNotes: "",
    });
  }

  function setNew(key: keyof NewAppForm, val: string) {
    setNewForm((f) => ({ ...f, [key]: val }));
  }

  function setReview(key: keyof ReviewForm, val: string) {
    setReviewForm((f) => ({ ...f, [key]: val }));
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Recruitment" description="Application Processing">
        <Button className="gap-2" onClick={() => { setNewForm(EMPTY_NEW); setNewDialogOpen(true); }}>
          <Plus className="w-4 h-4" /> New Application
        </Button>
      </PageHeader>

      {isLoading ? (
        <LoadingState message="Fetching applications..." />
      ) : error ? (
        <ErrorState error={error} />
      ) : !applications?.length ? (
        <EmptyState icon={FileText} title="No pending applications" description="There are currently no applications waiting for review." />
      ) : (
        <div className="border border-border rounded-lg overflow-hidden bg-card/30">
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow>
                <TableHead className="font-mono text-xs tracking-wider">Applicant</TableHead>
                <TableHead className="font-mono text-xs tracking-wider">Discord</TableHead>
                <TableHead className="font-mono text-xs tracking-wider">Type</TableHead>
                <TableHead className="font-mono text-xs tracking-wider">Target Role</TableHead>
                <TableHead className="font-mono text-xs tracking-wider">Status</TableHead>
                <TableHead className="font-mono text-xs tracking-wider">Submitted</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => (
                <TableRow key={app.id} className="hover:bg-secondary/30 transition-colors group">
                  <TableCell className="font-medium text-foreground">{app.applicantName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{app.discordUsername || "---"}</TableCell>
                  <TableCell className="font-mono text-xs uppercase text-muted-foreground">{app.type}</TableCell>
                  <TableCell className="text-sm">{app.careerTitle || "General"}</TableCell>
                  <TableCell><StatusBadge status={app.status} /></TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {format(new Date(app.submittedAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity gap-2"
                      onClick={() => openReview(app)}
                    >
                      <Eye className="w-4 h-4" /> Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-mono uppercase tracking-widest text-sm">Submit Application</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Applicant Name *</Label>
              <Input value={newForm.applicantName} onChange={(e) => setNew("applicantName", e.target.value)} placeholder="Full name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discord Username</Label>
                <Input value={newForm.discordUsername} onChange={(e) => setNew("discordUsername", e.target.value)} placeholder="username#0000" />
              </div>
              <div className="space-y-2">
                <Label>Discord ID</Label>
                <Input value={newForm.discordId} onChange={(e) => setNew("discordId", e.target.value)} placeholder="123456789" className="font-mono" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Application Type *</Label>
                <Select value={newForm.type} onValueChange={(v) => setNew("type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recruitment">Recruitment</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                    <SelectItem value="promotion">Promotion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Target Role</Label>
                <Select value={newForm.careerId} onValueChange={(v) => setNew("careerId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select posting" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">General</SelectItem>
                    {careers?.filter((c) => c.isOpen).map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Application Answers</Label>
              <Textarea value={newForm.answers} onChange={(e) => setNew("answers", e.target.value)} placeholder="Applicant's responses..." rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !newForm.applicantName}>
              {createMutation.isPending ? "Submitting…" : "Submit Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!reviewTarget} onOpenChange={(o) => !o && setReviewTarget(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-mono uppercase tracking-widest text-sm">
              Review Application — {reviewTarget?.applicantName}
            </DialogTitle>
          </DialogHeader>
          {reviewTarget && (
            <div className="space-y-4 py-2">
              <div className="p-3 rounded-md bg-secondary/30 border border-border space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-mono text-xs">TYPE</span>
                  <span className="font-mono uppercase text-xs">{reviewTarget.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-mono text-xs">DISCORD</span>
                  <span>{reviewTarget.discordUsername || "---"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-mono text-xs">POSTED</span>
                  <span className="font-mono text-xs">{format(new Date(reviewTarget.submittedAt), "MMM d, yyyy")}</span>
                </div>
                {reviewTarget.answers && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-muted-foreground font-mono text-xs mb-1">ANSWERS</p>
                    <p className="text-sm whitespace-pre-wrap">{reviewTarget.answers}</p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Update Status</Label>
                <Select value={reviewForm.status} onValueChange={(v) => setReview("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reviewed By</Label>
                <Input value={reviewForm.reviewedBy} onChange={(e) => setReview("reviewedBy", e.target.value)} placeholder="Your callsign" />
              </div>
              <div className="space-y-2">
                <Label>Review Notes</Label>
                <Textarea value={reviewForm.reviewNotes} onChange={(e) => setReview("reviewNotes", e.target.value)} placeholder="Decision notes..." rows={3} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewTarget(null)}>Close</Button>
            <Button onClick={() => reviewMutation.mutate()} disabled={reviewMutation.isPending}>
              {reviewMutation.isPending ? "Saving…" : "Save Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
