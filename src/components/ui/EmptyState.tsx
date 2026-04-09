import { FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-teal/10 text-emerald-teal mb-4">
        {icon || <FolderOpen className="h-10 w-10" strokeWidth={1.5} />}
      </div>
      <h3 className="mt-2 text-lg font-heading font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-foreground/60 max-w-[250px] mb-6">{description}</p>
      {action}
    </div>
  );
}
