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
      { title: "Ali Nur Hasan — Portfolio (Original)" },
      {
        name: "description",
        content:
          "The original portfolio of Ali Nur Hasan (TasTaj) — graphic designer with 7 years of experience in branding, logos, posters and basic web design.",
      },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Ali Nur Hasan — Portfolio (Original)" },
      {
        property: "og:description",
        content:
          "Graphic designer (TasTaj) — branding, logos, posters, product & basic web design.",
      },
      { property: "twitter:card", content: "summary_large_image" },
      { property: "twitter:title", content: "Ali Nur Hasan — Portfolio (Original)" },
      {
        property: "twitter:description",
        content:
          "Graphic designer (TasTaj) — branding, logos, posters, product & basic web design.",
      },
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
