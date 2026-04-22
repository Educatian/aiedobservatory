import { useEffect, useState } from "react";
import type { ReleaseNote } from "../data/releaseNotes";

interface WhatsNewModalProps {
  release: ReleaseNote;
  open: boolean;
  onClose: () => void;
}

function spotlight(selector: string) {
  const el = document.querySelector(selector) as HTMLElement | null;
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.classList.add("whatsnew-spotlight-target");
  window.setTimeout(() => el.classList.remove("whatsnew-spotlight-target"), 4200);
}

export function WhatsNewModal({ release, open, onClose }: WhatsNewModalProps) {
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleShowMe = (selector?: string) => {
    if (!selector) return;
    setClosing(true);
    window.setTimeout(() => {
      onClose();
      spotlight(selector);
      setClosing(false);
    }, 220);
  };

  return (
    <div
      className={`whatsnew-backdrop ${closing ? "whatsnew-closing" : ""}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="whatsnew-title"
    >
      <div className="whatsnew-modal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="whatsnew-close"
          onClick={onClose}
          aria-label="Close what's new"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
        <header className="whatsnew-header">
          <span className="whatsnew-badge">New · {release.date}</span>
          <h2 id="whatsnew-title">{release.title}</h2>
          <p>{release.summary}</p>
        </header>
        <ol className="whatsnew-list">
          {release.highlights.map((h) => (
            <li key={h.title} className="whatsnew-item">
              <span className="material-symbols-outlined whatsnew-icon">{h.icon}</span>
              <div className="whatsnew-body">
                <h3>{h.title}</h3>
                <p>{h.body}</p>
                {h.spotlightSelector && (
                  <button
                    type="button"
                    className="whatsnew-show-btn"
                    onClick={() => handleShowMe(h.spotlightSelector)}
                  >
                    <span className="material-symbols-outlined">arrow_outward</span>
                    Show me
                  </button>
                )}
              </div>
            </li>
          ))}
        </ol>
        <footer className="whatsnew-footer">
          <span className="whatsnew-version">v{release.version}</span>
          <button type="button" className="whatsnew-primary" onClick={onClose}>
            Got it
          </button>
        </footer>
      </div>
    </div>
  );
}
