import {
  Palette,
  Brush,
  Image as ImageIcon,
  Layout,
  Type,
  Sparkles,
  Globe,
  Megaphone,
  Users,
  Clock,
  Eye,
  HeartHandshake,
  MessagesSquare,
  Wand2,
  Layers,
  Star,
  Camera,
  PenTool,
  Smartphone,
  Monitor,
  Code2,
  Rocket,
  Heart,
  Lightbulb,
  Target,
  Zap,
  type LucideIcon,
} from "lucide-react";

/**
 * Whitelisted icons that admins can pick by name in the CMS.
 * Keep keys stable — they are stored in the database.
 */
export const ICON_REGISTRY: Record<string, LucideIcon> = {
  Palette,
  Brush,
  Image: ImageIcon,
  Layout,
  Type,
  Sparkles,
  Globe,
  Megaphone,
  Users,
  Clock,
  Eye,
  HeartHandshake,
  MessagesSquare,
  Wand2,
  Layers,
  Star,
  Camera,
  PenTool,
  Smartphone,
  Monitor,
  Code2,
  Rocket,
  Heart,
  Lightbulb,
  Target,
  Zap,
};

export const ICON_NAMES = Object.keys(ICON_REGISTRY);

export function getIcon(name?: string | null): LucideIcon {
  if (name && ICON_REGISTRY[name]) return ICON_REGISTRY[name];
  return Sparkles;
}
