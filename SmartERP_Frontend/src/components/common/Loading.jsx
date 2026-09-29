export default function Loading({ message = "Loading..." }) {
  return (
    <div className="state-container">
      <div style={{
        width: 32,
        height: 32,
        border: "3px solid #e2e8f0",
        borderTopColor: "#1e40af",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
        marginBottom: 12
      }} />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div className="state-title" style={{ fontSize: 14 }}>{message}</div>
    </div>
  );
}
