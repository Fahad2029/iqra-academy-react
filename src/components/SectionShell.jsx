export default function SectionShell({ title, subtitle, children }) {
  return (
    <section className="py-14 md:py-20 border-t border-white/5">
      <div className="container-max">
        <div className="max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-bold text-textMain">{title}</h2>
          {subtitle && <p className="mt-2 text-textMain">{subtitle}</p>}
        </div>

        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}
