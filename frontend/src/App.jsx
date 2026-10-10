import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import SiteLayout from "./layouts/SiteLayout";
import PlainLayout from "./layouts/PlainLayout";
import ScrollManager from "./components/PageTransition/ScrollManager";
import RouteFallback from "./components/RouteFallback/RouteFallback";

import Home from "./pages/Home";
import "./App.css";

/**
 * Routing.
 *
 * Home is imported eagerly because it is the entry point for almost every
 * visit. Everything else is lazy: the browser downloads a page's code only
 * when someone navigates to it, and <Suspense> shows RouteFallback meanwhile.
 *
 * The catch-all path="*" matches any URL no other route claims, so an unknown
 * address shows NotFound instead of a blank screen.
 */

const About = lazy(() => import("./pages/About"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Login = lazy(() => import("./pages/Login"));

function App() {
  return (
    <BrowserRouter>
      <ScrollManager />

      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Auth pages bring their own chrome */}
          <Route element={<PlainLayout />}>
            <Route path="/login" element={<Login />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;