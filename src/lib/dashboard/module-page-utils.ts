import type { DashboardModuleConfig } from "@/constants/dashboard-modules";

export function getModuleHeading(module: DashboardModuleConfig) {
  return `${module.title} workspace`;
}

export function getPrimaryAction(module: DashboardModuleConfig) {
  return module.actions[0] ?? "Review workspace";
}

export function getModuleCode(module: DashboardModuleConfig) {
  return `${module.portal.toUpperCase()}-${module.key.toUpperCase().replaceAll("-", "_")}`;
}
