import { useId, useState } from "react";
import { FiEye, FiEyeOff, FiAlertCircle } from "react-icons/fi";
import cn from "../../utils/cn";
import "./Field.css";

/**
 * One input component for the whole app.
 *
 * Accessibility handled here once, so no form can get it wrong:
 *  - label is a real <label for>, never a placeholder standing in for one
 *  - hint and error are linked through aria-describedby
 *  - aria-invalid is set from the error, not from a CSS class
 *  - the password toggle is a real button with state in its label
 *  - "Optional" is written out rather than marking required fields with *
 */
export default function Field({
  label,
  name,
  type = "text",
  value,
  onChange,
  onBlur,
  error,
  hint,
  optional = false,
  autoComplete,
  placeholder,
  inputMode,
  as = "input",
  options = [],
  rows = 3,
  className,
  ...rest
}) {
  const reactId = useId();
  const id = `f-${name}-${reactId}`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const [revealed, setRevealed] = useState(false);

  const isPassword = type === "password";
  const resolvedType = isPassword && revealed ? "text" : type;

  const describedBy = [hint ? hintId : null, error ? errorId : null]
    .filter(Boolean)
    .join(" ");

  const shared = {
    id,
    name,
    value,
    onChange,
    onBlur,
    placeholder,
    autoComplete,
    inputMode,
    "aria-invalid": error ? "true" : undefined,
    "aria-describedby": describedBy || undefined,
    className: "field__input",
    ...rest,
  };

  return (
    <div className={cn("field", error && "field--invalid", className)}>
      <label className="field__label" htmlFor={id}>
        {label}
        {optional && <span className="field__optional"> (optional)</span>}
      </label>

      <div className="field__control">
        {as === "select" ? (
          <select {...shared}>
            <option value="">Choose one</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : as === "textarea" ? (
          <textarea {...shared} rows={rows} />
        ) : (
          <input {...shared} type={resolvedType} />
        )}

        {isPassword && (
          <button
            type="button"
            className="field__toggle"
            onClick={() => setRevealed((v) => !v)}
            aria-pressed={revealed}
            aria-controls={id}
          >
            {revealed ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
            <span className="u-sr">
              {revealed ? "Hide password" : "Show password"}
            </span>
          </button>
        )}
      </div>

      {hint && !error && (
        <p className="field__hint" id={hintId}>
          {hint}
        </p>
      )}

      {error && (
        <p className="field__error" id={errorId}>
          <FiAlertCircle aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}