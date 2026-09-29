import { useEffect, useRef } from "react";

export default function Input({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder = "",
  required = false,
  autoFocus = false,
  disabled = false,
  error = "",
  helperText = "",
  min,
  max,
  step,
  className = "",
  style = {},
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <div className={`form-group ${className}`} style={style}>
      {label && (
        <label htmlFor={name}>
          <span>{label}</span>
          {required && <span className="required" title="Required">*</span>}
        </label>
      )}
      <input
        ref={inputRef}
        id={name}
        name={name}
        type={type}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        className={`form-control ${error ? "is-invalid" : ""}`}
      />
      {error ? (
        <div style={{ color: "var(--danger)", fontSize: 12, marginTop: 2 }}>{error}</div>
      ) : helperText ? (
        <div style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 2 }}>{helperText}</div>
      ) : null}
    </div>
  );
}
