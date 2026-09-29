export default function ErrorMessage({ message, onDismiss }) {
  if (!message) return null;

  return (
    <div className="alert alert-danger" role="alert">
      <span style={{ fontWeight: 600, flexShrink: 0 }}>Error:</span>
      <span style={{ flex: 1 }}>{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          style={{
            background: "transparent",
            border: "none",
            color: "inherit",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 14,
            padding: "0 4px"
          }}
          title="Dismiss"
        >
          ✕
        </button>
      )}
    </div>
  );
}
