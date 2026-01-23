import Banner from "../components/Banner.jsx";
import SectionShell from "../components/SectionShell.jsx";

export default function Home() {
  return (
    <>
      {/* 1) Banner */}
      <Banner />

      {/* 2) Information Section */}
      <SectionShell
        title="Why choose Iqra Academy?"
        subtitle="A clean and expandable structure — you can add more sections easily."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          <div className="rounded-3xl border border-black/10 bg-white p-6 md:p-8 shadow-sm">
            <h3 className="text-xl font-semibold text-textMain">
              Professional Learning System
            </h3>

            <p className="mt-3 text-textSoft leading-relaxed">
              We focus on structured lessons, clear milestones, and supportive teaching
              to help students learn faster and better.
            </p>

            <ul className="mt-6 space-y-3 text-textSoft">
              <li className="flex gap-3">
                <span className="mt-2 h-2 w-2 rounded-full bg-primary" />
                Daily / Weekend classes available
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-2 w-2 rounded-full bg-primary" />
                One-to-one and group options
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-2 w-2 rounded-full bg-primary" />
                Regular progress tracking
              </li>
            </ul>
          </div>

          {/* Placeholder for image or content */}
          <div className="rounded-3xl border border-black/10 bg-gray-50 p-6 md:p-8 flex items-center justify-center shadow-sm">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 rounded-2xl border border-black/10 bg-white flex items-center justify-center text-primary font-bold shadow-sm">
                IMG
              </div>
              <p className="mt-4 text-textSoft">
                Image / Card section placeholder <br />
                (You can replace this later)
              </p>
            </div>
          </div>
        </div>
      </SectionShell>

      {/* 3) Extra Section (Expandable) */}
      <SectionShell
        title="Popular Courses"
        subtitle="Add course cards here later — structure already ready."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {["Noorani Qaida", "Quran with Tajweed", "Hifz Program"].map((c) => (
            <div
              key={c}
              className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition"
            >
              <h4 className="text-lg font-semibold text-textMain">{c}</h4>
              <p className="mt-2 text-sm text-textSoft">
                Short description placeholder. Replace with real details anytime.
              </p>

              <button className="mt-4 inline-flex items-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primaryDark transition">
                View Details
              </button>
            </div>
          ))}
        </div>
      </SectionShell>
    </>
  );
}
