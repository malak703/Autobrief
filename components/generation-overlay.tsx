"use client";

interface GenerationOverlayProps {
  message: string;
  subMessage?: string;
}

export function GenerationOverlay({ message, subMessage }: GenerationOverlayProps) {
  return (
    <div className="generation-overlay">
      <div className="generation-overlay-card">
        {/* Animated spinner */}
        <div className="generation-spinner">
          <div className="generation-spinner-ring" />
          <div className="generation-spinner-ring generation-spinner-ring-delay" />
          <div className="generation-spinner-dot" />
        </div>

        <p className="generation-overlay-message">{message}</p>

        {subMessage && (
          <p className="generation-overlay-sub">{subMessage}</p>
        )}

        {/* Animated dots */}
        <div className="generation-dots">
          <span className="generation-dot" style={{ animationDelay: "0s" }} />
          <span className="generation-dot" style={{ animationDelay: "0.2s" }} />
          <span className="generation-dot" style={{ animationDelay: "0.4s" }} />
        </div>
      </div>
    </div>
  );
}
