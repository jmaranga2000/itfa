import * as nextEnv from "@next/env";

const envLoader = nextEnv as typeof nextEnv & {
  default?: typeof nextEnv;
};

(envLoader.loadEnvConfig ?? envLoader.default?.loadEnvConfig)?.(process.cwd());

async function main() {
  console.log("Loading IFTA foundation seed...");
  const foundation = await import("@/lib/seed/foundation");
  const foundationModule = foundation as typeof foundation & {
    default?: typeof foundation;
  };
  const seedFoundation =
    foundation.seedFoundation ?? foundationModule.default?.seedFoundation;

  if (!seedFoundation) {
    throw new Error("Unable to load the foundation seed function.");
  }

  console.log("Connecting to MongoDB and upserting foundation data...");
  const result = await seedFoundation();
  console.log(
    `Seeded foundation: ${result.permissions} permissions, ${result.roles} roles, ${result.users} users, ${result.communication.conversations} communication conversation, ${result.workflows.workflows} workflow instances, ${result.templates.templates} templates, ${result.templates.versions} template versions, ${result.templates.usageRecords} template usage records, ${result.reports.savedReports} saved reports, ${result.reports.schedules} report schedule, ${result.reports.exports} report exports, ${result.archive.records} archive records, ${result.archive.policies} retention policies, ${result.archive.legalHolds} legal hold, ${result.archive.restoreRequests} restore request, ${result.archive.deletionRequests} deletion request.`,
  );
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
