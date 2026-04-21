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

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen">
      <Nav />
      <Hero />
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
  );
}
