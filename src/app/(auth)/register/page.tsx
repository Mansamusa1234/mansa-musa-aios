import type { Metadata } from "next";
import RegisterForm from "./RegisterForm";
import { isMicrosoftConfigured, isAppleConfigured } from "@/lib/auth.providers";

export const metadata: Metadata = {
  title: "Create Account | MansaMusaAI",
  description: "Create your free MansaMusaAI account and unlock 41 AI agents for your business.",
  robots: { index: false },
};

export default function RegisterPage() {
  return (
    <RegisterForm
      showGithub={!!process.env.GITHUB_CLIENT_ID}
      showGoogle={!!process.env.GOOGLE_CLIENT_ID}
      showMicrosoft={isMicrosoftConfigured}
      showApple={isAppleConfigured}
    />
  );
}
