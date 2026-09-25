import { MODEL_CATALOG } from "@/lib/modelRouter";
import { abacusConfigured } from "./abacus";
import { aiGatewayConfigured } from "./aiGateway";

function has(name: string) {
  return Boolean(process.env[name]);
}

export function orchestratorStatus() {
  const providers = Array.from(
    new Set(
      MODEL_CATALOG.filter((model) => {
        try {
          return model.available();
        } catch {
          return false;
        }
      }).map((model) => model.provider),
    ),
  );

  return {
    abacus: { configured: abacusConfigured() },
    aiGateway: {
      configured: aiGatewayConfigured(),
      modelRoutingConfigured: Boolean(
        process.env.AI_GATEWAY_MODEL_DEFAULT ||
          process.env.AI_GATEWAY_MODEL_REASONING ||
          process.env.AI_GATEWAY_MODEL_JUDGE,
      ),
    },
    modelHub: {
      configured: providers.length > 0,
      providers,
    },
    integrations: [
      { id: "github", label: "GitHub", configured: has("GITHUB_CLIENT_ID") || has("GITHUB_REPO_TOKEN") },
      { id: "vercel", label: "Vercel", configured: has("VERCEL_API_TOKEN") || Boolean(process.env.VERCEL) },
      { id: "stripe", label: "Stripe", configured: has("STRIPE_SECRET_KEY") },
      { id: "resend", label: "Email / Resend", configured: has("RESEND_API_KEY") },
      { id: "twilio", label: "Twilio / WhatsApp", configured: has("TWILIO_ACCOUNT_SID") },
      { id: "instagram", label: "Instagram", configured: has("INSTAGRAM_ACCESS_TOKEN") },
      { id: "pinterest", label: "Pinterest", configured: has("PINTEREST_ACCESS_TOKEN") },
      { id: "linkedin", label: "LinkedIn", configured: has("LINKEDIN_ACCESS_TOKEN") },
      { id: "youtube", label: "YouTube", configured: has("YOUTUBE_REFRESH_TOKEN") },
    ],
  };
}
