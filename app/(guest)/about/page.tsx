import type { Metadata } from "next";
import StorySection from "@/components/about/story-section";
import ContactMap from "@/components/about/contact-map";

export const metadata: Metadata = {
  title: "من نحن | About Us — Sewar AlAndalus",
  description:
    "اكتشف قصة سوار الأندلس، رؤيتنا ومهمتنا وقيمنا، وتواصل معنا في الرياض. Discover the Sewar AlAndalus story, vision, mission and values, and find us in Riyadh.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 md:py-16">
      <StorySection />
      <ContactMap />
    </main>
  );
}
