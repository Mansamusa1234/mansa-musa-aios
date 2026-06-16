import LoginForm from "./LoginForm";
import { isMicrosoftConfigured, isAppleConfigured } from "@/lib/auth.providers";

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
