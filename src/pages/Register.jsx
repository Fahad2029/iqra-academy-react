import { useState } from "react";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    course: "Quran with Tajweed"
  });

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const API_URL = import.meta.env.VITE_BACKEND_URL + "/api/enroll";
  console.log(API_URL);


const onSubmit = async (e) => {
  e.preventDefault();

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form), // ✅ real form state
    });

    const data = await response.json();

    if (response.ok) {
      alert("✅ Registration successful!");
      console.log("Saved:", data);

      setForm({
        name: "",
        phone: "",
        email: "",
        course: "Quran with Tajweed",
      });
    } else {
      alert(data.message || "❌ Failed to register");
    }
  } catch (error) {
    console.error(error);
    alert("❌ Server error. Please check backend.");
  }
};



  return (
    <div className="container-max py-14 md:py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 ">
        {/* Register Form */}
        <div className="rounded-3xl border border-lightBrown bg-gray-50 p-6 md:p-10">
          <h1 className="text-3xl md:text-4xl font-bold text-textMain">Register</h1>
          <p className="mt-3 text-textMain/80">
            Fill the form and we will contact you for a free trial class.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <label className="text-sm text-textMain/70">Full Name</label>
              <input
                name="name"
                value={form.name}
                onChange={onChange}
                required
                className="mt-2 w-full rounded-2xl border border-lightBrown bg-white px-4 py-3 text-textMain outline-none focus:border-softBlue"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="text-sm text-textMain/70">Phone</label>
              <input
                name="phone"
                value={form.phone}
                onChange={onChange}
                required
                className="mt-2 w-full rounded-2xl border border-lightBrown bg-white px-4 py-3 text-textMain outline-none focus:border-softBlue"
                placeholder="+92..."
              />
            </div>

            <div>
              <label className="text-sm text-textMain/70">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={onChange}
                className="mt-2 w-full rounded-2xl border border-lightBrown bg-white px-4 py-3 text-textMain outline-none focus:border-softBlue"
                placeholder="example@gmail.com"
              />
            </div>

            <div>
              <label className="text-sm text-textMain/70">Select Course</label>
              <select
                name="course"
                value={form.course}
                onChange={onChange}
                className="mt-2 w-full rounded-2xl border border-lightBrown bg-white px-4 py-3 text-textMain outline-none focus:border-softBlue"
              >
                <option>Quran with Tajweed</option>
                <option>Noorani Qaida</option>
                <option>Hifz Program</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-accent text-textMain font-semibold px-6 py-3 text-white hover:bg-green-700 transition"
            >
              Submit Registration
            </button>
          </form>
        </div>

        {/* Info Section */}
        <div className="rounded-3xl border border-softBlue bg-gray-50 p-6 md:p-10">
          <h2 className="text-xl font-semibold text-textMain">What happens next?</h2>
          <ul className="mt-4 space-y-3 text-textMain/80">
            <li className="flex gap-3">
              <span className="mt-2 h-2 w-2 rounded-full bg-primary" />
              We confirm your details
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-2 w-2 rounded-full bg-primary" />
              Schedule a free trial class
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-2 w-2 rounded-full bg-primary" />
              Start your learning journey
            </li>
          </ul>

          <div className="mt-8 rounded-2xl border border-softBlue bg-cream p-4 text-sm text-textMain/60">
            Later we will connect this form to Node.js / Laravel API and save data in MySQL.
          </div>
        </div>
      </div>
    </div>
  );
}
