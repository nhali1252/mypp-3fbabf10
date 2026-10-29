import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ThumbsUp, Flame, Heart, Sparkles, LogIn } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { listReactions, listMyReactions, toggleReaction } from "@/lib/fns/feed-social.functions";
import { toast } from "sonner";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const REACTIONS = [
  { key: "like", label: "Like", Icon: ThumbsUp, color: "text-sky-400" },
  { key: "fire", label: "Fire", Icon: Flame, color: "text-orange-400" },
  { key: "love", label: "Love", Icon: Heart, color: "text-rose-400" },
  { key: "wow", label: "Wow", Icon: Sparkles, color: "text-amber-300" },
] as const;

type ReactionKind = (typeof REACTIONS)[number]["key"];

export function ReactionsBar({
  itemId,
  variant = "light",
}: {
  itemId: string;
  variant?: "light" | "dark";
}) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const site = useSiteSettings("B");
  const reactionsEnabled = site.reactions_enabled !== false;
  const showCount = site.reactions_show_count !== false;
  const countsQ = useQuery({
    queryKey: ["feed_reactions", itemId],
    queryFn: () => listReactions({ data: { item_id: itemId } }),
    staleTime: 10_000,
  });

  const mineQ = useQuery({
    queryKey: ["feed_reactions_mine", itemId, user?.id ?? "anon"],
    queryFn: async () => {
      if (!user) return { mine: [] as ReactionKind[] };
      return listMyReactions({ data: { item_id: itemId } });
    },
    enabled: true,
    staleTime: 10_000,
  });

  const mine = new Set((mineQ.data?.mine ?? []) as ReactionKind[]);
  const counts = countsQ.data?.counts ?? { like: 0, fire: 0, love: 0, wow: 0 };

  // Anti-spam: lock buttons briefly after each click.
  const [locked, setLocked] = useState<ReactionKind | null>(null);
  useEffect(() => {
    if (!locked) return;
    const t = setTimeout(() => setLocked(null), 600);
    return () => clearTimeout(t);
  }, [locked]);

  const toggle = useMutation({
    mutationFn: async (reaction: ReactionKind) =>
      toggleReaction({ data: { item_id: itemId, reaction } }),
    onMutate: async (reaction) => {
      setLocked(reaction);
      await qc.cancelQueries({ queryKey: ["feed_reactions", itemId] });
      const prevCounts = qc.getQueryData<{ counts: Record<ReactionKind, number> }>([
        "feed_reactions",
        itemId,
      ]);
      const prevMine = qc.getQueryData<{ mine: ReactionKind[] }>([
        "feed_reactions_mine",
        itemId,
        user?.id ?? "anon",
      ]);
      const has = mine.has(reaction);
      qc.setQueryData(["feed_reactions", itemId], (old: any) => {
        const c = { ...(old?.counts ?? counts) };
        c[reaction] = Math.max(0, (c[reaction] ?? 0) + (has ? -1 : 1));
        return { counts: c };
      });
      qc.setQueryData(
        ["feed_reactions_mine", itemId, user?.id ?? "anon"],
        () => ({
          mine: has
            ? Array.from(mine).filter((r) => r !== reaction)
            : Array.from(new Set([...mine, reaction])),
        }),
      );
      return { prevCounts, prevMine };
    },
    onError: (err: any, _v, ctx) => {
      if (ctx?.prevCounts) qc.setQueryData(["feed_reactions", itemId], ctx.prevCounts);
      if (ctx?.prevMine)
        qc.setQueryData(["feed_reactions_mine", itemId, user?.id ?? "anon"], ctx.prevMine);
      toast.error(err?.message ?? "Couldn't react");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["feed_reactions", itemId] });
      qc.invalidateQueries({ queryKey: ["feed_reactions_mine", itemId, user?.id ?? "anon"] });
    },
  });

  function onClick(r: ReactionKind) {
    if (!user) {
      toast.message("Sign in to react", {
        description: "Reactions require a verified account so they stay authentic.",
      });
      return;
    }
    if (locked === r) return;
    toggle.mutate(r);
  }

  const baseBtn =
    variant === "dark"
      ? "bg-white/10 border-white/15 hover:bg-white/20 text-white"
      : "bg-card border-border hover:bg-muted text-foreground";

  if (!reactionsEnabled) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {REACTIONS.map(({ key, label, Icon, color }) => {
        const active = mine.has(key);
        const count = counts[key] ?? 0;
        return (
          <motion.button
            key={key}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClick(key);
            }}
            whileTap={{ scale: 0.92 }}
            aria-label={label}
            aria-pressed={active}
            className={`group inline-flex items-center gap-1.5 h-8 px-2.5 rounded-full border text-xs font-bold transition-colors ${baseBtn} ${
              active ? "ring-1 ring-primary/60 border-primary/45" : ""
            }`}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={active ? "on" : "off"}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className={`inline-flex ${active ? color : "opacity-80"}`}
              >
                <Icon
                  className="w-3.5 h-3.5"
                  fill={active ? "currentColor" : "none"}
                  strokeWidth={active ? 1.5 : 2}
                />
              </motion.span>
            </AnimatePresence>
            {showCount && <span className="font-numeric tabular-nums text-[11px]">{count}</span>}
          </motion.button>
        );
      })}
      {!user && (
        <Link
          to="/auth"
          onClick={(e) => e.stopPropagation()}
          className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-full border text-[10px] font-bold uppercase tracking-[0.18em] transition-colors ${baseBtn}`}
        >
          <LogIn className="w-3 h-3" /> Sign in
        </Link>
      )}
    </div>
  );
}
