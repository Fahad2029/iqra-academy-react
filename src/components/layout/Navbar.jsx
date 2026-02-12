import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
//import logo from "../assets/images/iqra-logo.png";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/about", label: "About" },
  { to: "/courses", label: "Courses" },
  { to: "/register", label: "Register" },
  { to: "/contact", label: "Contact" }
];

export default function Navbar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-white/80 backdrop-blur">
      <div className="container-max py-3 flex items-center justify-between gap-3">
         

        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
           {/* <img
          src={logo}  
          alt="Iqra Logo"
          className="h-10 w-10 rounded-xl object-cover border border-primaryDark/30"
        /> */}
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white border border-primaryDark/30">
            IQA
          </span>
          <span className="text-xl font-bold tracking-wide text-textMain">
            Iqra Quran Academy
          </span>
        </button>

        {/* Desktop links */}
        <nav className="hidden md:flex items-center gap-6 rounded-xl bg-primary px-6 py-3 shadow">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `text-sm transition ${
                  isActive
                    ? "text-yellow-200 font-semibold"
                    : "text-white/90 hover:text-yellow-100"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop Register Button */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => navigate("/register")}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition"
          >
            Register Now
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden rounded-xl border border-black/10 px-3 py-2 text-sm text-textMain hover:bg-black/5 transition"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle Menu"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden border-t border-black/10 bg-white">
          <div className="container-max py-3 flex flex-col gap-2">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-xl px-3 py-2 text-sm transition ${
                    isActive
                      ? "bg-primary text-white font-semibold"
                      : "text-textMain hover:bg-black/5"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}

            <button
              onClick={() => {
                setOpen(false);
                navigate("/register");
              }}
              className="mt-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition"
            >
              Register Now
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
