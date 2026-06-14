import LandingPage from "@/components/landing/LandingPage";
import { PLANS } from "@/lib/stripe";

export default function HomePage() {
  return <LandingPage plans={PLANS} />;
}
