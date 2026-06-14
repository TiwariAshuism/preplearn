import { readSyncMeta, formatSyncDate } from "../lib/sync-meta";
import type { NavNode } from "../lib/types";
import { MobileSidebar } from "./MobileSidebar";

type TemplatesShellProps = {
  navTree: NavNode[];
  children: React.ReactNode;
};

export function TemplatesShell({ navTree, children }: TemplatesShellProps) {
  const syncMeta = readSyncMeta();
  const syncLabel = syncMeta?.lastSyncedAt
    ? `Updated from Notion: ${formatSyncDate(syncMeta.lastSyncedAt)}`
    : null;

  return (
    <MobileSidebar navTree={navTree} syncLabel={syncLabel}>
      {children}
    </MobileSidebar>
  );
}
