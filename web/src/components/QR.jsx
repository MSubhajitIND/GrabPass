// src/components/QR.jsx
import React, { useEffect, useState } from "react";
import QRCodeLib from "qrcode";

export default function QR({ value, size = 220 }) {
  const [dataUrl, setDataUrl] = useState(null);
  useEffect(() => {
    let mounted = true;
    if (!value) { setDataUrl(null); return; }
    QRCodeLib.toDataURL(value, { width: size, margin: 1 })
      .then(url => { if (mounted) setDataUrl(url); })
      .catch(err => console.error("QR gen error:", err));
    return () => { mounted = false; };
  }, [value, size]);
  if (!value) return null;
  if (!dataUrl) return <div style={{width:size, height:size, display:"flex", alignItems:"center", justifyContent:"center"}}>Generating...</div>;
  return <img src={dataUrl} alt="QR code" style={{ width: size, height: size, objectFit: "contain" }} />;
}