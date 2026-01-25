import LandingPage from "@/components/LandingPage";
import { Link, createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <LandingPage />;
}
