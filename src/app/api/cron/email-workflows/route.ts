import { processDeferredSteps } from "@/lib/email-automation";
import { withCron } from "@/lib/cronUtils";

export const GET = withCron(async () => {
  await processDeferredSteps();
  return { message: "Deferred email workflow steps processed" };
});
