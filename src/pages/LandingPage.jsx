import React from 'react';
import { Loader } from "@/components/Loader";
import { Cursor } from "@/components/Cursor";
import { MouseGlow } from "@/components/MouseGlow";
import { Particles } from "@/components/Particles";
import { ScrollProgress } from "@/components/ScrollProgress";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import LeaderboardPage from "@/pages/shared/LeaderboardPage";
import { Stats } from "@/components/Stats";
import { Workflow } from "@/components/Workflow";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { ProjectShowcase } from "@/components/ProjectShowcase";
import SelectionFormSection from "@/components/SelectionFormSection";

export default function LandingPage() {
  return (
    <div className="relative noise">
      <Loader />
      <Cursor />
      <MouseGlow />
      <Particles />
      <ScrollProgress />
      <Navbar />
      <main className="relative z-10">
        <Hero />
        <Features />
        <ProjectShowcase />
        <LeaderboardPage limit={5} />
        <Stats />
        <Workflow />
        <SelectionFormSection />
        <Footer />
      </main>
      <BackToTop />
    </div>
  );
}
