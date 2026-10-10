import { Outlet } from "react-router-dom";
import PageTransition from "../components/PageTransition/PageTransition";

/** For pages that bring their own chrome, such as the auth split screens. */
export default function PlainLayout() {
  return (
    <div className="app-shell">
      <PageTransition>
        <Outlet />
      </PageTransition>
    </div>
  );
}