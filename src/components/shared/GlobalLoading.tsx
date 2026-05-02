import { Loader2 } from 'lucide-react';

export function GlobalLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background/50">
      <div className="flex flex-col items-center gap-4 p-8 rounded-lg bg-card shadow-sm border border-border">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading module...</p>
      </div>
    </div>
  );
}
