export default function Button({
  children,
  type = "button",
  variant = "primary", // 'primary' | 'secondary' | 'danger'
  size = "md", // 'sm' | 'md'
  loading = false,
  disabled = false,
  onClick,
  icon = null,
  style = {},
  className = "",
  title,
}) {
  const baseClass = `btn btn-${variant} ${size === "sm" ? "btn-sm" : ""} ${className}`;

  return (
    <button
      type={type}
      className={baseClass}
      onClick={onClick}
      disabled={disabled || loading}
      style={style}
      title={title}
    >
      {loading ? (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{
            width: 14,
            height: 14,
            border: "2px solid currentColor",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 0.6s linear infinite"
          }} />
          Loading...
        </span>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
}
