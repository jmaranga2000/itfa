import {
  Archive,
  BriefcaseBusiness,
  Clock3,
  FileText,
  Landmark,
  Lock,
  MessageSquareText,
  RotateCcw,
  Scale,
  ShieldCheck,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap = {
  archive: Archive,
  users: Users,
  briefcase: BriefcaseBusiness,
  file: FileText,
  shield: ShieldCheck,
  message: MessageSquareText,
  finance: Landmark,
  template: FileText,
  staff: UserCog,
  lock: Lock,
  clock: Clock3,
  restore: RotateCcw,
  trash: Trash2,
  legal: Scale,
} as const;

export function ArchiveCategoryIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = iconMap[icon as keyof typeof iconMap] ?? Archive;

  return <Icon aria-hidden="true" className={cn("h-4 w-4", className)} />;
}
