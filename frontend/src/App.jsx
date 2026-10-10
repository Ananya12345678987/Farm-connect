import { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import SiteLayout from "./layouts/SiteLayout";
import ScrollManager from "./components/PageTransition/ScrollManager";
import RouteFallback from "./components/RouteFallback/RouteFallback";

import Home from "./pages/Home";
import "./App.css";

/**
 * Routing.
 *
 * Home is imported directly because it is the entry point for almost every
 * visit. Later pages are loaded lazily, so the first load does not carry
 * dashboards and forms the visitor may never open.
 */
function App() {
  return (
    <BrowserRouter>
      <ScrollManager />

      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Marketing */}
          <Route element={<SiteLayout />}>
            <Route path="/" element={<Home />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;











// function App() {
//   return (
//     <main className="u-page u-section">
//       <p className="u-eyebrow">Farmers and buyers, trading direct</p>
//       <h1 style={{ fontSize: "var(--fs-h1)", color: "var(--c-forest)" }}>
//         FarmConnect
//       </h1>
//       <p className="u-lead">
//         List your harvest, source it directly, and skip the extra middle layer.
//       </p>
//       <hr className="u-rule" style={{ margin: "var(--sp-8) 0" }} />
//       <span className="u-chip u-chip--green">Verified farmer</span>{" "}
//       <span className="u-chip u-chip--amber">Pending</span>
//     </main>
//   );
// }

// export default App;