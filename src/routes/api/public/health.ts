import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/health")({
  server: {
    handlers: {
      GET: async () =>
        Response.json({
          service: "domureva",
          status: "ok",
          agents: ["discover", "fund", "assess", "retrofit", "match", "verify", "learn"],
          integrations: ["leadlens", "dokuvera", "gabley", "gabley-retrofit", "craftvaro"],
        }),
    },
  },
});
