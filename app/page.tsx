"use client";

import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Vision from "@/components/Vision";
import Stats from "@/components/Stats";
import Destinations from "@/components/Destinations";
import Experiences from "@/components/Experiences";
import Values from "@/components/Values";
import Testimonials from "@/components/Testimonials";
import News from "@/components/News";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import Intro from "@/components/Intro";

export default function Home() {
  return (
    <>
      <Intro />
      <div className="grain" aria-hidden />

      <main>
        <Navbar />
        <Hero />
        <About />
        <Vision />
        <Stats />
        <Destinations />
        <Experiences />
        <Values />
        <Testimonials />
        <News />
        <Contact />
        <Footer />
      </main>
    </>
  );
}
