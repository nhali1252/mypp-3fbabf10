import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";

export function TagListEditor({
  value,
  onChange,
  placeholder = "Add item",
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");
  function add() {
    const v = input.trim();
    if (!v) return;
    onChange([...value, v]);
    setInput("");
  }
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map((tag, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary text-xs font-medium"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              className="opacity-60 hover:opacity-100"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
        />
        <Button type="button" variant="secondary" onClick={add}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
