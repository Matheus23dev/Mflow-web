export function hideBrowserPrintMetadata() {
  const style = document.createElement("style");
  style.dataset.mflowPrint = "page";
  style.textContent = "@page { size: A4; margin: 0; }";
  document.head.appendChild(style);

  return () => style.remove();
}
