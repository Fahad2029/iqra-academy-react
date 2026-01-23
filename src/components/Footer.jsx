export default function Footer() {
  return (
    <footer className="border-t border-white/10">
      <div className="container-max py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-sm text-slate-200/70">
        <p>© {new Date().getFullYear()} Iqra Academy. All rights reserved.</p>
        <p className="text-slate-200/60">
          Built with React + Tailwind
        </p>
      </div>
    </footer>
  );
}
