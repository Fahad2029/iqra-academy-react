import { useNavigate } from "react-router-dom";
import banner from "../assets/images/banner.jpg";

export default function Banner() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden">
      <div
        className="h-[78vh] w-full bg-cover bg-center"
        style={{ backgroundImage: `url(${banner})` }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

      <div className="absolute inset-0 flex items-center">
        <div className="container-max">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
              Online Classes • Tajweed • Flexible Timings
            </p>

            <h1 className="mt-4 text-4xl md:text-6xl font-extrabold leading-tight text-white">
              Learn Quran Online <span className="text-primary">with Confidence</span>
            </h1>

            <p className="mt-4 text-base md:text-lg text-white/80">
              Experienced teachers, structured courses, and one-to-one attention for better learning outcomes.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate("/register")}
                className="rounded-2xl bg-primary px-6 py-3 font-semibold text-darkBrown hover:bg-primaryDark hover:text-cream transition"
              >
                Register Now
              </button>

              <button
                onClick={() => navigate("/courses")}
                className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 font-semibold text-white hover:bg-white/10 transition"
              >
                View Courses
              </button>
            </div>

            <div className="mt-8 flex items-center gap-6 text-sm text-white/80">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Free Trial Class
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Female Teachers
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Kids & Adults
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
