import { Link } from "react-router-dom";

import SectionHeading from "../components/SectionHeading/SectionHeading";
import RoleCard from "../components/RoleCard/RoleCard";
import Reveal from "../components/Reveal/Reveal";
import { ROLES } from "../data/site";
import "./RoleSelection.css";

export default function RoleSelection() {
  return (
    <section className="roles u-section" id="get-started" aria-labelledby="roles-title">
      <div className="u-page">
        <SectionHeading
          id="roles-title"
          title="Which side of the market are you on?"
          lead="Registration takes a few minutes. Farmers are verified before their first listing goes live."
        />

        <div className="roles__grid">
          {ROLES.map((role, index) => (
            <Reveal key={role.id} stagger={index} step={90}>
              <RoleCard role={role} stagger={index} />
            </Reveal>
          ))}
        </div>

        <p className="roles__note">
          Already registered? <Link to="/login" className="roles__link">Log in instead</Link>.
        </p>
      </div>
    </section>
  );
}