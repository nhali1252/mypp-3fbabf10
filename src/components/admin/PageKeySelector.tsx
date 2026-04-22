import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STORAGE_KEY = "admin:pageKey";

export type PageKey = "B" | "F";

const OPTIONS: { value: PageKey; label: string }[] = [
  { value: "B", label: "Page B (original)" },
  { value: "F", label: "Page F (redesign)" },
];

export function usePageKey(): [PageKey, (v: PageKey) => void] {
  const [pk, setPk] = useState<PageKey>("B");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY) as PageKey | null;
    if (saved === "B" || saved === "F") setPk(saved);
  }, []);
  const set = (v: PageKey) => {
    setPk(v);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, v);
  };
  return [pk, set];
}

export function PageKeySelector({
  value,
  onChange,
}: {
  value: PageKey;
  onChange: (v: PageKey) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Editing
      </span>
      <Select value={value} onValueChange={(v) => onChange(v as PageKey)}>
        <SelectTrigger className="h-8 w-[200px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
