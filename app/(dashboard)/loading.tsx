export default function DashboardLoading() {
  return (
    <div className="page-fade-in brief-loading-skeleton" style={{ minHeight: "70vh" }}>
      <div className="generation-spinner">
        <div className="generation-spinner-ring" />
        <div className="generation-spinner-ring generation-spinner-ring-delay" />
        <div className="generation-spinner-dot" />
      </div>
      <p
        style={{
          color: "var(--muted)",
          fontSize: "16px",
          fontWeight: 500,
        }}
      >
        Loading…
      </p>
      <div style={{ width: "100%", maxWidth: "400px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div className="skeleton-pulse" style={{ height: "14px", width: "100%" }} />
        <div className="skeleton-pulse" style={{ height: "14px", width: "75%" }} />
        <div className="skeleton-pulse" style={{ height: "14px", width: "50%" }} />
      </div>
    </div>
  );
}
