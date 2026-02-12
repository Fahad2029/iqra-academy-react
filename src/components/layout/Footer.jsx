export default function Footer() {
  return (
   <footer className="border-t border-black/10 bg-primary px-6 py-3 shadow">
  <div className="container-max flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-sm text-white/90">
    <p>© {new Date().getFullYear()} Iqra Academy. All rights reserved.</p>
    <p className="text-white/70">Built with React + Tailwind</p>
  </div>
</footer>

  );
}
