import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import Apple from "next-auth/providers/apple";

// Each array is empty (spreads to nothing) until the matching env vars are set --
// same inert-until-configured pattern used for every external credential this session.

export const microsoftEntraIdProvider =
  process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET
    ? [
        MicrosoftEntraID({
          clientId: process.env.MICROSOFT_CLIENT_ID,
          clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
          ...(process.env.MICROSOFT_TENANT_ID ? { issuer: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}/v2.0` } : {}),
        }),
      ]
    : [];

export const appleProvider =
  process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET
    ? [
        Apple({
          clientId: process.env.APPLE_CLIENT_ID,
          clientSecret: process.env.APPLE_CLIENT_SECRET,
        }),
      ]
    : [];

export const isMicrosoftConfigured = microsoftEntraIdProvider.length > 0;
export const isAppleConfigured = appleProvider.length > 0;
