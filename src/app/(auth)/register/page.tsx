import RegisterForm from "./RegisterForm";
import { isMicrosoftConfigured, isAppleConfigured } from "@/lib/auth.providers";

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
