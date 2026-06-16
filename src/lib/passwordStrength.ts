const COMMON_PASSWORDS = new Set([
  "password", "password1", "123456", "12345678", "123456789", "qwerty",
  "letmein", "welcome", "monkey", "dragon", "master", "abc123", "iloveyou",
  "admin", "football", "baseball", "trustno1", "sunshine", "princess",
  "qwerty123", "111111", "123123", "654321", "superman", "1qaz2wsx",
]);

export interface StrengthResult {
  score: 0 | 1 | 2 | 3 | 4;
  label: "Very weak" | "Weak" | "Fair" | "Strong" | "Very strong";
  feedback: string[];
}

/** Lightweight, dependency-free password strength scorer. Client-safe -- pure JS, no Node APIs. */
export function scorePasswordStrength(password: string): StrengthResult {
  const feedback: string[] = [];

  if (!password) return { score: 0, label: "Very weak", feedback: ["Enter a password"] };

  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return { score: 0, label: "Very weak", feedback: ["This is one of the most commonly used passwords"] };
  }

  let points = 0;
  if (password.length >= 8) points += 1;
  if (password.length >= 12) points += 1;
  if (password.length >= 16) points += 1;

  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((re) => re.test(password)).length;
  points += Math.max(0, classes - 1);

  if (/(.)\1\1/.test(password)) { points -= 1; feedback.push("Avoid repeating the same character 3+ times"); }
  if (/^[0-9]+$/.test(password)) { points -= 1; feedback.push("Avoid all-digit passwords"); }
  if (password.length < 8) feedback.push("Use at least 8 characters");
  if (classes < 3) feedback.push("Mix uppercase, lowercase, numbers, and symbols");

  const score = Math.max(0, Math.min(4, points)) as StrengthResult["score"];
  const labels: StrengthResult["label"][] = ["Very weak", "Weak", "Fair", "Strong", "Very strong"];
  return { score, label: labels[score], feedback };
}

export function meetsMinimumRequirements(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (password.length > 100) return "Password must be under 100 characters.";
  if (COMMON_PASSWORDS.has(password.toLowerCase())) return "This password is too common. Please choose another.";
  return null;
}
