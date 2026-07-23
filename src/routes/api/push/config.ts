import { createFileRoute } from "@tanstack/react-router";

import { pushJsonResponse } from "@/lib/push/push-http.server";
import { getPushConfigurationStatus } from "@/lib/push/web-push.server";

export const Route = createFileRoute("/api/push/config")({
  server: {
    handlers: {
      GET: () => {
        const status = getPushConfigurationStatus();
        return pushJsonResponse({
          enabled: status.enabled,
          publicKey: status.publicKey,
        });
      },
    },
  },
});
