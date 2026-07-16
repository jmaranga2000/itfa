import {
  BarChart3,
  Bell,
  FileCheck2,
  FileQuestion,
  FileText,
  Mail,
  MessageSquareText,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap = {
  document: FileText,
  workflow: Workflow,
  shield: ShieldCheck,
  fileRequest: FileQuestion,
  invoice: ReceiptText,
  mail: Mail,
  bell: Bell,
  message: MessageSquareText,
  sparkles: Sparkles,
  chart: BarChart3,
  fileCheck: FileCheck2,
} as const;

export function TemplateCategoryIcon({
  icon,
  className,
}: {
  icon: keyof typeof iconMap;
  className?: string;
}) {
  const Icon = iconMap[icon];

  return <Icon aria-hidden="true" className={cn("h-4 w-4", className)} />;
}
