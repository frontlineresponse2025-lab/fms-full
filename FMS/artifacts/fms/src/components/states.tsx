import { Loader2, AlertCircle, FileQuestion } from "lucide-react";
import { cn } from "@/lib/utils";

export function LoadingState({ message = "Loading systems..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full border border-border/50 border-dashed rounded-lg bg-card/30">
      <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
      <p className="text-sm font-mono text-muted-foreground uppercase tracking-widest">{message}</p>
    </div>
  );
}

export function ErrorState({ error, message = "System Error" }: { error?: any; message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full border border-destructive/50 border-dashed rounded-lg bg-destructive/5">
      <AlertCircle className="w-8 h-8 text-destructive mb-4" />
      <h3 className="text-lg font-display font-medium text-destructive mb-1">{message}</h3>
      <p className="text-sm text-muted-foreground max-w-md text-center">
        {error?.message || "An unexpected error occurred while communicating with the command server."}
      </p>
    </div>
  );
}

export function EmptyState({ 
  icon: Icon = FileQuestion, 
  title, 
  description,
  action 
}: { 
  icon?: any; 
  title: string; 
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full border border-border border-dashed rounded-lg bg-card/30 p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-secondary/80 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-display font-medium text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      {action}
    </div>
  );
}
