const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const PDF_MARGIN_MM = 10;

function safeFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export async function createPdfFile(element: HTMLElement, name: string) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas-pro"),
    import("jspdf"),
  ]);
  const sourceId = `mflow-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const captureWidth = element.classList.contains("loan-report-print")
    ? 760
    : 1100;
  element.dataset.pdfSource = sourceId;

  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(element, {
      backgroundColor: "#ffffff",
      logging: false,
      scale: Math.min(window.devicePixelRatio || 1, 2),
      useCORS: true,
      windowWidth: 1280,
      ignoreElements: (node) => node.hasAttribute("data-pdf-ignore"),
      onclone: (documentClone) => {
        const source = documentClone.querySelector<HTMLElement>(
          `[data-pdf-source="${sourceId}"]`,
        );
        if (!source) return;
        source.style.width = `${captureWidth}px`;
        source.style.maxWidth = "none";
        source.style.height = "auto";
        source.style.minHeight = "0";
        source.style.overflow = "visible";

        source
          .querySelectorAll<HTMLElement>(
            ".report-grid, .report-chart-panel, .profitability-card",
          )
          .forEach((node) => {
            node.style.height = "auto";
            node.style.minHeight = "0";
            node.style.overflow = "visible";
          });
        source.querySelectorAll<HTMLElement>(".bar-chart").forEach((node) => {
          node.style.height = "245px";
          node.style.flex = "none";
        });
      },
    });
  } finally {
    delete element.dataset.pdfSource;
  }
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const contentWidth = A4_WIDTH_MM - PDF_MARGIN_MM * 2;
  const pageHeight = A4_HEIGHT_MM - PDF_MARGIN_MM * 2;
  const imageHeight = (canvas.height * contentWidth) / canvas.width;
  const image = canvas.toDataURL("image/jpeg", 0.88);

  let remaining = imageHeight;
  let position = PDF_MARGIN_MM;
  pdf.addImage(image, "JPEG", PDF_MARGIN_MM, position, contentWidth, imageHeight, undefined, "FAST");
  remaining -= pageHeight;

  while (remaining > 0) {
    pdf.addPage();
    position = PDF_MARGIN_MM - (imageHeight - remaining);
    pdf.addImage(image, "JPEG", PDF_MARGIN_MM, position, contentWidth, imageHeight, undefined, "FAST");
    remaining -= pageHeight;
  }

  const fileName = `${safeFileName(name) || "MFlow"}.pdf`;
  return new File([pdf.output("blob")], fileName, { type: "application/pdf" });
}

export async function sharePdfFile(file: File, title: string) {
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return "shared" as const;
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") {
        return "cancelled" as const;
      }
      throw caught;
    }
  }

  downloadFile(file);
  return "downloaded" as const;
}
