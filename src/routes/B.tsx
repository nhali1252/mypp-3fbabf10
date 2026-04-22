import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Ticker } from "@/components/Ticker";
import { Footer } from "@/components/Footer";
import { AboutSection } from "@/components/sections/AboutSection";
import { EducationSection } from "@/components/sections/EducationSection";
import { SkillsSection } from "@/components/sections/SkillsSection";
import { ProjectsSection } from "@/components/sections/ProjectsSection";
import { ActivitiesSection } from "@/components/sections/ActivitiesSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { HireMeProvider } from "@/components/HireMeProvider";
import { useSmoothAnchors } from "@/hooks/useSmoothAnchors";

export const Route = createFileRoute("/B")({
  component: PageB,
  head: () => ({
    meta: [
      { title: "Ali Nur Hasan — Portfolio (Version B)" },
      { name: "description", content: "Original portfolio version of Ali Nur Hasan." },
    ],
  }),
});

function PageB() {
  useSmoothAnchors();
  return (
    <HireMeProvider>
      <div className="min-h-screen">
        <Nav showHireMe={false} />
        <Hero showHireMe={false} />
        <Ticker />
        <main className="max-w-[1320px] mx-auto px-3.5 md:px-7 pb-16">
          <AboutSection />
          <EducationSection />
          <SkillsSection />
          <ProjectsSection />
          <ActivitiesSection />
          <ContactSection />
        </main>
        <Footer />
      </div>
    </HireMeProvider>
  );
}
