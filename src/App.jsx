import { Routes, Route } from "react-router-dom";
import Navbar from "./components/layout/Navbar.jsx";
import Footer from "./components/layout/Footer.jsx";

import Home from "./pages/home/Home.jsx";
import About from "./pages/about/About.jsx";
import Courses from "./pages/courses/Courses.jsx";
import Register from "./pages/auth/Register.jsx";
import Contact from "./pages/Contact.jsx";
import NotFound from "./pages/NotFound.jsx";
import VideoCall from "./components/VideoCall";


export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/register" element={<Register />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/video-call" element={<VideoCall />} />
          <Route path="*" element={<NotFound />} />
          
        <Route
          path="*"
          element={
            <div style={{ padding: 20 }}>
              <h2>Page not found</h2>
              <p>
                Go to <a href="/teacher">Teacher</a> or <a href="/student">Student</a>
              </p>
            </div>
          }
        />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}
