import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <LoginForm
      showGithub={!!process.env.GITHUB_CLIENT_ID}
      showGoogle={!!process.env.GOOGLE_CLIENT_ID}
    />
  );
}
