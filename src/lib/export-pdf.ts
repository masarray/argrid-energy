import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

export async function exportElementToPdf(
  el: HTMLElement,
  opts: { title: string; subtitle?: string; filename: string },
) {
  // Resolve theme colors from the live document for consistent branding.
  const styles = getComputedStyle(document.documentElement);
  const bg = styles.getPropertyValue("--color-background").trim() || "#0b0f14";
  const fg = styles.getPropertyValue("--color-foreground").trim() || "#e6edf3";
  const muted =
    styles.getPropertyValue("--color-muted-foreground").trim() || "#8b95a5";
  const primary = styles.getPropertyValue("--color-primary").trim() || "#22d3ee";

  const canvas = await html2canvas(el, {
    backgroundColor: bg,
    scale: 2,
    useCORS: true,
    logging: false,
    windowWidth: el.scrollWidth,
    windowHeight: el.scrollHeight,
  });

  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  const margin = 28;
  const headerH = 56;
  const footerH = 26;

  // Cover header on every page.
  const drawChrome = (pageNum: number, pageCount: number) => {
    pdf.setFillColor(bg);
    pdf.rect(0, 0, pageW, pageH, "F");

    // Header band
    pdf.setFillColor(primary);
    pdf.rect(0, 0, 3, headerH, "F");

    pdf.setTextColor(muted);
    pdf.setFontSize(8);
    pdf.text("ARGRID · ENERGY OS", margin, 20);

    pdf.setTextColor(fg);
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text(opts.title, margin, 38);

    if (opts.subtitle) {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(muted);
      pdf.text(opts.subtitle, margin, 50);
    }

    const stamp = new Date().toLocaleString("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    pdf.setFontSize(8);
    pdf.setTextColor(muted);
    pdf.text(`Generated ${stamp}`, pageW - margin, 20, { align: "right" });

    // Divider
    pdf.setDrawColor(muted);
    pdf.setLineWidth(0.3);
    pdf.line(margin, headerH, pageW - margin, headerH);

    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(muted);
    pdf.text(
      "Confidential · ArGrid Energy Management demo",
      margin,
      pageH - 12,
    );
    pdf.text(`Page ${pageNum} / ${pageCount}`, pageW - margin, pageH - 12, {
      align: "right",
    });
  };

  const contentW = pageW - margin * 2;
  const contentH = pageH - headerH - footerH - margin;

  const imgW = contentW;
  const imgH = (canvas.height * imgW) / canvas.width;

  // Slice the tall canvas into page-sized chunks.
  const pxPerPt = canvas.width / imgW;
  const sliceHpx = contentH * pxPerPt;
  const pageCount = Math.max(1, Math.ceil(canvas.height / sliceHpx));

  for (let i = 0; i < pageCount; i++) {
    if (i > 0) pdf.addPage();
    drawChrome(i + 1, pageCount);

    const sy = i * sliceHpx;
    const sh = Math.min(sliceHpx, canvas.height - sy);

    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    slice.height = sh;
    const ctx = slice.getContext("2d");
    if (!ctx) continue;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(canvas, 0, sy, canvas.width, sh, 0, 0, canvas.width, sh);

    const dataUrl = slice.toDataURL("image/jpeg", 0.92);
    const drawH = (sh * imgW) / canvas.width;
    pdf.addImage(dataUrl, "JPEG", margin, headerH + 12, imgW, drawH);
  }

  pdf.save(opts.filename);
}
