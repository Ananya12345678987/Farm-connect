import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi";

import Logo from "../Logo/Logo";
import Button from "../Button/Button";
import { NAV_LINKS } from "../../data/site";
import useScrolled from "../../hooks/useScrolled";
import useLockBodyScroll from "../../hooks/useLockBodyScroll";
import useSectionSpy from "../../hooks/useSectionSpy";
import cn from "../../utils/cn";
import "./Navbar.css";

const SPY_IDS = ["how-it-works", "for-farmers", "for-buyers"];

export default function Navbar() {
  const { pathname, hash } = useLocation();
  const scrolled = useScrolled(20);
  const toggleRef = useRef(null);
  const drawerRef = useRef(null);

  /* The drawer remembers the URL it was opened on. If the URL changes, the
     two no longer match, so it counts as closed — no effect needed. */
  const locationKey = pathname + hash;
  const [openKey, setOpenKey] = useState(null);
  const open = openKey === locationKey;

  const onHome = pathname === "/";
  const activeSection = useSectionSpy(SPY_IDS, { enabled: onHome });

  useLockBodyScroll(open);

  const close = useCallback(() => setOpenKey(null), []);

  /* Escape closes it and hands focus back to the control that opened it. */
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpenKey(null);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  /* Focus moves into the drawer on open. */
  useEffect(() => {
    if (!open) return;
    const first = drawerRef.current?.querySelector("a, button");
    if (first) first.focus();
  }, [open]);

  const isActive = (link) => {
    if (link.to === "/about") return pathname === "/about";
    if (link.id === "home") return onHome && !activeSection;
    if (!onHome) return false;
    return Boolean(link.hash) && activeSection === link.hash.slice(1);
  };

  const hrefFor = (link) =>
    link.hash && link.hash !== "#top" ? `/${link.hash}` : link.to;

  return (
    <header className={cn("nav", scrolled && "is-scrolled", open && "is-open")}>
      <a className="u-skip" href="#main">
        Skip to content
      </a>

      <nav className="nav__bar" aria-label="Main">
        <Logo />

        <ul className="nav__links">
          {NAV_LINKS.map((link) => (
            <li key={link.id}>
              <Link
                to={hrefFor(link)}
                className="nav__link"
                aria-current={isActive(link) ? "page" : undefined}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="nav__actions">
          <Button variant="ghost" size="sm" to="/login">
            Log in
          </Button>
          <Button variant="primary" size="sm" to="/#get-started">
            Get started
          </Button>
        </div>

        <button
          ref={toggleRef}
          type="button"
          className="nav__toggle"
          aria-expanded={open}
          aria-controls="nav-drawer"
          onClick={() => setOpenKey(open ? null : locationKey)}
        >
          {open ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
          <span className="u-sr">{open ? "Close menu" : "Open menu"}</span>
        </button>
      </nav>

      {/* The drawer stays mounted so it can animate, but `inert` takes it out
          of the tab order and the accessibility tree while it is closed. */}
      <div className="nav__scrim" onClick={close} hidden={!open} aria-hidden="true" />

      <div id="nav-drawer" ref={drawerRef} className="nav__drawer" inert={!open}>
        <ul className="nav__drawer-links">
          {NAV_LINKS.map((link, index) => (
            <li key={link.id} style={{ "--i": index }}>
              <Link
                to={hrefFor(link)}
                className="nav__drawer-link"
                aria-current={isActive(link) ? "page" : undefined}
                onClick={close}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="nav__drawer-actions">
          <Button variant="secondary" size="lg" fullWidth to="/login" onClick={close}>
            Log in
          </Button>
          <Button variant="primary" size="lg" fullWidth to="/#get-started" onClick={close}>
            Get started
          </Button>
        </div>
      </div>
    </header>
  );
}