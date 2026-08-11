export function AuthBrand({ mobile = false }: { mobile?: boolean }) {
  return (
    <div className={`${mobile ? "auth-mobile-brand mb-6 hidden max-[860px]:flex" : "auth-brand flex"} z-[1] items-center gap-[11px]`}>
      <div className="brand-mark grid size-[39px] shrink-0 -rotate-3 place-items-center rounded-xl bg-gradient-to-br from-[#9678ff] to-[#6540de] text-white shadow-[0_8px_20px_rgba(116,80,233,0.25)]"><span className="rotate-3 text-xl font-extrabold">M</span></div>
      <strong className="text-xl">MFlow</strong>
    </div>
  );
}
