import type { Metadata } from "next";
import LoginForm from "./LoginForm";
import { isMicrosoftConfigured, isAppleConfigured } from "@/lib/auth.providers";

export const metadata: Metadata = {
  title: "Sign In | MansaMusaAI",
  description: "Sign in to your MansaMusaAI account — AI-powered business automation at your fingertips.",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <LoginForm
      showGithub={!!process.env.GITHUB_CLIENT_ID}
      showGoogle={!!process.env.GOOGLE_CLIENT_ID}
      showMicrosoft={isMicrosoftConfigured}
      showApple={isAppleConfigured}
    />
  );
}
