import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = status.toLowerCase();
  
  let variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" = "default";
  
  if (["active", "approved", "open"].includes(normalized)) {
    variant = "success";
  } else if (["pending", "loa"].includes(normalized)) {
    variant = "warning";
  } else if (["inactive", "suspended", "denied", "closed", "termination"].includes(normalized)) {
    variant = "destructive";
  } else {
    variant = "secondary";
  }

  // Map variants to actual tailwind classes since standard badge might not have all our custom tactical ones
  const variantClasses = {
    default: "bg-primary/20 text-primary border-primary/30",
    secondary: "bg-secondary text-secondary-foreground border-border",
    destructive: "bg-destructive/20 text-red-400 border-destructive/30",
    outline: "border-border text-muted-foreground",
    success: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    warning: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  };

  return (
    <div className={cn(
      "inline-flex items-center rounded-sm border px-2.5 py-0.5 text-xs font-mono uppercase tracking-wider font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
      variantClasses[variant],
      className
    )}>
      {status}
    </div>
  );
}
