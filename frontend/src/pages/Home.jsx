import Hero from "../components/Hero/Hero";
import ValueStatement from "../sections/ValueStatement";
import WhyFarmConnect from "../sections/WhyFarmConnect";
import HowItWorks from "../sections/HowItWorks";
import FarmerSection from "../sections/FarmerSection";
import BuyerSection from "../sections/BuyerSection";
import Stats from "../sections/Stats";
import PlatformFeatures from "../sections/PlatformFeatures";
import RoleSelection from "../sections/RoleSelection";
import CallToAction from "../sections/CallToAction";

/**
 * Home is composition only — every section owns its own content and layout,
 * so this file stays readable and sections can be reordered or reused.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <ValueStatement />
      <WhyFarmConnect />
      <HowItWorks />
      <FarmerSection />
      <BuyerSection />
      <Stats />
      <PlatformFeatures />
      <RoleSelection />
      <CallToAction />
    </>
  );
}