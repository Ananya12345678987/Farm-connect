import { Link } from "react-router-dom";
import { FiGithub, FiLinkedin, FiTwitter, FiMail } from "react-icons/fi";

import Logo from "../Logo/Logo";
import { FOOTER_LINKS } from "../../data/site";
import "./Footer.css";

const YEAR = new Date().getFullYear();

const SOCIAL = [
  { id: "email", label: "Email FarmConnect", href: "mailto:hello@farmconnect.in", Icon: FiMail },
  { id: "twitter", label: "FarmConnect on X", href: "https://x.com/", Icon: FiTwitter },
  { id: "linkedin", label: "FarmConnect on LinkedIn", href: "https://www.linkedin.com/", Icon: FiLinkedin },
  { id: "github", label: "FarmConnect on GitHub", href: "https://github.com/", Icon: FiGithub },
];

export default function Footer() {
  return (
    <footer className="foot">
      <div className="u-page foot__inner">
        <div className="foot__brand">
          <Logo tone="invert" />
          <p className="foot__pitch">
            A marketplace where the person who grew the crop is the person who
            names its price.
          </p>

          <ul className="foot__social">
            {SOCIAL.map(({ id, label, href, Icon }) => (
              <li key={id}>
                <a
                  href={href}
                  className="foot__social-link"
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noreferrer noopener" : undefined}
                >
                  <Icon aria-hidden="true" />
                  <span className="u-sr">{label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="foot__cols">
          {FOOTER_LINKS.map((group) => (
            <nav className="foot__col" key={group.id} aria-label={group.heading}>
              <h2 className="foot__heading">{group.heading}</h2>
              <ul>
                {group.items.map((item) => (
                  <li key={item.label}>
                    <Link className="foot__link" to={item.to}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      <div className="u-page foot__base">
        <p>© {YEAR} FarmConnect</p>
        <p>Built for farmers in Karnataka, Maharashtra, Gujarat, Punjab and Tamil Nadu.</p>
      </div>
    </footer>
  );
}