import { BrowserRouter } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main id="main" className="u-page u-section" style={{ minHeight: "150vh", paddingTop: 140 }}>
        <h1 style={{ fontSize: "var(--fs-h1)", color: "var(--c-forest)" }}>
          Scroll down
        </h1>
      </main>
      <Footer />
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