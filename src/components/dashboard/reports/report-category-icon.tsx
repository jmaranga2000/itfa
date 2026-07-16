import {
  Activity,
  Archive,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  FileText,
  Gauge,
  Landmark,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Users,
  UserCog,
  Workflow,
} from "lucide-react";
import { RiAdminLine } from "react-icons/ri";
import { cn } from "@/lib/utils";

const iconMap = {
  gauge: Gauge,
  users: Users,
  briefcase: BriefcaseBusiness,
  workflow: Workflow,
  staff: UserCog,
  shield: ShieldCheck,
  documents: FileText,
  finance: Landmark,
  services: BarChart3,
  message: MessageSquareText,
  bell: Bell,
  sparkles: Sparkles,
  templates: FileText,
  archive: Archive,
  audit: RiAdminLine,
  activity: Activity,
} as const;

export function ReportCategoryIcon({
  icon,
  className,
}: {
  icon: string;
  className?: string;
}) {
  const Icon = iconMap[icon as keyof typeof iconMap] ?? Activity;

  return <Icon aria-hidden="true" className={cn("h-4 w-4", className)} />;
}
