import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import {
  FiGrid,
  FiPackage,
  FiShoppingBag,
  FiActivity,
  FiUsers,
  FiFlag,
  FiFileText,
  FiBell,
  FiSearch,
  FiArrowLeft,
  FiBookmark,
} from "react-icons/fi";

import Logo from "../components/Logo/Logo";
import EmptyState from "../components/EmptyState/EmptyState";
import { FARMER, BUYER, ADMIN } from "../data/dashboards";
import cn from "../utils/cn";
import "./DashboardLayout.css";

/**
 * Dashboard shell.
 *
 * The sidebar links are in-page anchors to sections that exist on the screen,
 * not routes that have not been built. A navigation item that goes nowhere is
 * worse than no navigation item, so there are none here.
 */

const CONFIG = {
  "/farmer-dashboard": {
    title: "Farm overview",
    user: FARMER.user,
    subtitle: FARMER.user.farm,
    nav: [
      { id: "overview", label: "Overview", Icon: FiGrid },
      { id: "listings", label: "Listings", Icon: FiPackage },
      { id: "orders", label: "Orders", Icon: FiShoppingBag },
      { id: "activity", label: "Activity", Icon: FiActivity },
    ],
    notifications: FARMER.activity,
  },
  "/buyer-dashboard": {
    title: "Sourcing overview",
    user: BUYER.user,
    subtitle: BUYER.user.business,
    nav: [
      { id: "overview", label: "Overview", Icon: FiGrid },
      { id: "marketplace", label: "Marketplace", Icon: FiPackage },
      { id: "orders", label: "Orders", Icon: FiShoppingBag },
      { id: "saved", label: "Saved", Icon: FiBookmark },
      { id: "connections", label: "Farms", Icon: FiUsers },
    ],
    notifications: [],
  },
  "/admin-dashboard": {
    title: "Platform overview",
    user: ADMIN.user,
    subtitle: ADMIN.user.role,
    nav: [
      { id: "overview", label: "Overview", Icon: FiGrid },
      { id: "verification", label: "Verification", Icon: FiUsers },
      { id: "flagged", label: "Flagged", Icon: FiFlag },
      { id: "reports", label: "Reports", Icon: FiFileText },
    ],
    notifications: ADMIN.activity,
  },
};

export default function DashboardLayout() {
  const { pathname } = useLocation();
  const config = CONFIG[pathname] ?? CONFIG["/farmer-dashboard"];

  /* Both pieces of state remember which URL they belong to. Moving to another
     dashboard makes the remembered URL stale, so the active section falls back
     to the first item and the bell closes — no effect needed to reset them. */
  const [picked, setPicked] = useState({ path: null, id: null });
  const [bellPath, setBellPath] = useState(null);

  const section =
    picked.path === pathname ? picked.id : config.nav[0].id;
  const bellOpen = bellPath === pathname;

  const bellRef = useRef(null);
  const panelRef = useRef(null);

  /* Escape and outside clicks close the notification panel. */
  useEffect(() => {
    if (!bellOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setBellPath(null);
        bellRef.current?.focus();
      }
    };
    const onPointerDown = (event) => {
      if (
        !panelRef.current?.contains(event.target) &&
        !bellRef.current?.contains(event.target)
      ) {
        setBellPath(null);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [bellOpen]);

  const goTo = (id) => {
    setPicked({ path: pathname, id });
    const target = document.getElementById(`db-${id}`);
    if (target) target.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  const count = config.notifications.length;

  return (
    <div className="db">
      <a className="u-skip" href="#main">
        Skip to content
      </a>

      <aside className="db__side">
        <div className="db__side-head">
          <Logo />
        </div>

        <nav className="db__nav" aria-label="Dashboard sections">
          <ul>
            {config.nav.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={cn("db__nav-item", section === item.id && "is-active")}
                  aria-current={section === item.id ? "true" : undefined}
                  onClick={() => goTo(item.id)}
                >
                  <item.Icon aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <Link className="db__back" to="/">
          <FiArrowLeft aria-hidden="true" />
          <span>Back to FarmConnect</span>
        </Link>
      </aside>

      <div className="db__body">
        <header className="db__top">
          <div className="db__top-title">
            {/* The sidebar (and its logo and exit link) is hidden on small
                screens, so both reappear here. */}
            <div className="db__brand">
              <Logo />
              <Link className="db__brand-back" to="/">
                <FiArrowLeft aria-hidden="true" />
                <span className="u-sr">Back to FarmConnect</span>
              </Link>
            </div>
            <h1>{config.title}</h1>
            <p>{config.subtitle}</p>
          </div>

          <div className="db__top-tools">
            <div className="db__search">
              <FiSearch aria-hidden="true" />
              <input
                type="search"
                placeholder="Search listings, orders, farms"
                aria-label="Search this dashboard"
              />
            </div>

            <div className="db__bell-wrap">
              <button
                ref={bellRef}
                type="button"
                className="db__bell"
                aria-expanded={bellOpen}
                aria-haspopup="true"
                onClick={() => setBellPath(bellOpen ? null : pathname)}
              >
                <FiBell aria-hidden="true" />
                {count > 0 && <span className="db__bell-dot" aria-hidden="true" />}
                <span className="u-sr">
                  {count > 0 ? `Notifications, ${count} new` : "Notifications, none new"}
                </span>
              </button>

              {bellOpen && (
                <div className="db__panel" ref={panelRef}>
                  <h2 className="db__panel-title">Notifications</h2>

                  {count === 0 ? (
                    <EmptyState
                      size="sm"
                      title="Nothing new"
                      body="Order updates and listing activity will appear here."
                    />
                  ) : (
                    <ul className="db__panel-list">
                      {config.notifications.map((item) => (
                        <li key={item.id}>
                          <p>{item.text}</p>
                          <span>{item.time}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="db__user">
              <span className="db__avatar" aria-hidden="true">
                {config.user.initials}
              </span>
              <span className="db__user-name">{config.user.name}</span>
            </div>
          </div>
        </header>

        {/* Below the sidebar breakpoint the same sections become a scrollable
            tab row, so they stay reachable without a second drawer. */}
        <nav className="db__tabs" aria-label="Dashboard sections">
          {config.nav.map((item) => (
            <button
              key={item.id}
              type="button"
              className={cn("db__tab", section === item.id && "is-active")}
              aria-current={section === item.id ? "true" : undefined}
              onClick={() => goTo(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <main className="db__main" id="main" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}