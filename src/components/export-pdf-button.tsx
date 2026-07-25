import { useState, type RefObject } from "react";
import { Download, Loader2 } from "lucide-react";
import { exportElementToPdf } from "@/lib/export-pdf";

export function ExportPdfButton({
  targetRef,
  title,
  subtitle,
  filename,
  label = "Export PDF",
}: {
  targetRef: RefObject<HTMLElement | null>;
  title: string;
  subtitle?: string;
  filename: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    if (!targetRef.current || busy) return;
    setBusy(true);
    try {
      await exportElementToPdf(targetRef.current, { title, subtitle, filename });
    } catch (err) {
      console.error("PDF export failed", err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="h-8 px-2.5 rounded-md border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary text-[12px] flex items-center gap-1.5 disabled:opacity-60"
    >
      {busy ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Download className="size-3.5" />
      )}
      {busy ? "Rendering…" : label}
    </button>
  );
}
