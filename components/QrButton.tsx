'use client';

import { useState } from 'react';
import QRCode from 'qrcode';

/** Generates a QR code for a URL in the browser, with a PNG download. */
export default function QrButton({
  url,
  filename = 'qr',
}: {
  url: string;
  filename?: string;
}) {
  const [open, setOpen] = useState(false);
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  async function toggle() {
    if (!open && !dataUrl) {
      try {
        const d = await QRCode.toDataURL(url, {
          width: 640,
          margin: 2,
          errorCorrectionLevel: 'M',
        });
        setDataUrl(d);
      } catch {
        return;
      }
    }
    setOpen((v) => !v);
  }

  return (
    <div>
      <button type="button" onClick={toggle} className="btn-ghost">
        {open ? 'ซ่อน QR' : 'QR code'}
      </button>

      {open && dataUrl && (
        <div className="mt-3 inline-block rounded-card bg-white p-4 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={dataUrl} alt="QR code" width={200} height={200} className="mx-auto" />
          <a
            href={dataUrl}
            download={`${filename}.png`}
            className="mt-3 block text-sm font-medium text-brand-goldDark"
          >
            ดาวน์โหลด PNG
          </a>
        </div>
      )}
    </div>
  );
}
