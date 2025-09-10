// web/src/components/TicketView.jsx
import React, { useEffect, useState, useRef } from "react";
import API from "../api";
import QR from "./QR";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

function fmtDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleString();
}

export default function TicketView({ token }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const ticketRef = useRef();

  useEffect(() => {
    if (!token) {
      setErr("Missing ticket token");
      setLoading(false);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await API.get(`/ticket?token=${encodeURIComponent(token)}`);
        if (!mounted) return;
        setData(res.data);
      } catch (e) {
        console.error("ticket fetch error", e);
        setErr(e?.response?.data?.error || e.message || "Failed to load ticket");
      } finally {
        setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [token]);

  async function downloadPNG() {
    if (!ticketRef.current) return;
    try {
      const canvas = await html2canvas(ticketRef.current, { scale: 2, useCORS: true, backgroundColor: null });
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${(data?.event?.title || "ticket").replace(/\s+/g, "_")}_${(data?.registration?._id || Date.now())}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("downloadPNG error", err);
      alert("Could not generate PNG: " + err.message);
    }
  }

  async function downloadPDF() {
    if (!ticketRef.current) return;
    try {
      const canvas = await html2canvas(ticketRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 40;
      const availableW = pageWidth - margin * 2;
      const availableH = pageHeight - margin * 2;

      const img = new Image();
      img.src = imgData;
      await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });

      const ratio = img.width / img.height;
      let drawW = availableW;
      let drawH = drawW / ratio;
      if (drawH > availableH) {
        drawH = availableH;
        drawW = drawH * ratio;
      }

      const x = (pageWidth - drawW) / 2;
      const y = (pageHeight - drawH) / 2;

      pdf.addImage(imgData, "JPEG", x, y, drawW, drawH, undefined, "FAST");
      pdf.save(`${(data?.event?.title || "ticket").replace(/\s+/g, "_")}_${(data?.registration?._id || Date.now())}.pdf`);
    } catch (err) {
      console.error("downloadPDF error", err);
      alert("Could not generate PDF: " + (err.message || err));
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading ticket...</div>;
  if (err) return <div className="min-h-screen flex items-center justify-center text-red-500">Error: {err}</div>;
  if (!data) return <div className="min-h-screen flex items-center justify-center">No data</div>;

  const { registration, event } = data;
  const tokenToShow = registration?.qrToken || token;

  return (
    <div className="min-h-screen p-6 bg-gray-100 dark:bg-gray-900 flex items-start justify-center py-12">
      <div className="w-full max-w-3xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Your e-Ticket</h1>
            <div className="text-sm text-gray-500">Present this at the event entrance</div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} className="px-3 py-2 bg-green-600 text-white rounded-md text-sm">Print</button>
            <button onClick={downloadPNG} className="px-3 py-2 bg-indigo-600 text-white rounded-md text-sm">Download PNG</button>
            <button onClick={downloadPDF} className="px-3 py-2 bg-green-600 text-white rounded-md text-sm">Download PDF</button>
          </div>
        </div>

        <div ref={ticketRef} className="bg-white rounded-lg shadow-md border p-6" style={{ color: "#111827", fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial" }}>
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="text-2xl font-bold">{event?.title || "Event"}</div>
              <div className="text-sm text-gray-600 mt-1">{fmtDate(event?.startAt)}</div>
            </div>

            {/* Event banner */}
            <div style={{ width: 110, height: 110, borderRadius: 8, overflow: "hidden", background: "#f3f4f6" }}>
              {event?.bannerUrl ? (
                <img src={event.bannerUrl} alt={event.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF" }}>No image</div>
              )}
            </div>
          </div>

          <div style={{ borderTop: "1px dashed #E5E7EB", margin: "8px 0 18px 0" }} />

          {/* Body fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-500">Name</div>
              <div className="text-lg font-medium">{registration?.userName || "—"}</div>
            </div>

            <div>
              <div className="text-xs text-gray-500">Email</div>
              <div className="text-lg font-medium">{registration?.email || "—"}</div>
            </div>

            <div>
              <div className="text-xs text-gray-500">Department</div>
              <div className="text-lg font-medium">{registration?.dept || "—"}</div>
            </div>

            <div>
              <div className="text-xs text-gray-500">Student Code</div>
              <div className="text-lg font-medium">{registration?.studentCode || "—"}</div>
            </div>
          </div>

          <div style={{ borderTop: "1px dashed #E5E7EB", margin: "18px 0" }} />

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Ticket ID: <span className="font-mono">{registration?._id}</span></div>
            <div>
              <div className={`inline-block px-3 py-1 rounded-md text-sm ${registration?.paid ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                {registration?.paid ? "Paid" : "Not paid"}
              </div>
            </div>
          </div>

          {/* QR always visible */}
          <div className="mt-6 flex justify-center">
            <div style={{ width: 160, height: 160, display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff", borderRadius: 8 }}>
              <QR value={tokenToShow} size={150} />
            </div>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-500">Tip: Use Print or Download to save your ticket. Keep it ready on arrival.</div>
      </div>
    </div>
  );
}