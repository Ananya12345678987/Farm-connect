import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import PageTransition from "../components/PageTransition/PageTransition";

/** Marketing shell: navbar, animated main, footer. */
export default function SiteLayout() {
  return (
    <div className="app-shell">
      <Navbar />
      <PageTransition>
        <Outlet />
      </PageTransition>
      <Footer />
    </div>
  );
}