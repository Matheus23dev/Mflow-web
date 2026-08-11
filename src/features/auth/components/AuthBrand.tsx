export function AuthBrand({ mobile = false }: { mobile?: boolean }) {
  return (
    <div className={mobile ? "auth-mobile-brand" : "auth-brand"}>
      <div className="brand-mark"><span>M</span></div>
      <strong>MFlow</strong>
    </div>
  );
}
