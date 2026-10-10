import { forwardRef } from "react";
import { Link } from "react-router-dom";
import cn from "../../utils/cn";
import "./Button.css";

/**
 * The only button in the app.
 *
 * variant: "primary" | "secondary" | "ghost" | "lime"
 * size:    "sm" | "md" | "lg"
 *
 * Renders <Link> when given `to`, <a> when given `href`, otherwise <button>.
 * Keeping one component means one focus style, one height, one hover.
 */
const Button = forwardRef(function Button(
  {
    children,
    variant = "primary",
    size = "md",
    to,
    href,
    icon = null,
    iconPosition = "end",
    loading = false,
    fullWidth = false,
    className,
    type = "button",
    disabled,
    ...rest
  },
  ref
) {
  const classes = cn(
    "btn",
    `btn--${variant}`,
    `btn--${size}`,
    fullWidth && "btn--full",
    loading && "is-loading",
    className
  );

  const inner = (
    <>
      {loading && <span className="btn__spinner" aria-hidden="true" />}
      {icon && iconPosition === "start" && (
        <span className="btn__icon btn__icon--start" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="btn__label">{children}</span>
      {icon && iconPosition === "end" && (
        <span className="btn__icon btn__icon--end" aria-hidden="true">
          {icon}
        </span>
      )}
    </>
  );

  if (to && !disabled && !loading) {
    return (
      <Link ref={ref} to={to} className={classes} {...rest}>
        {inner}
      </Link>
    );
  }

  if (href && !disabled && !loading) {
    return (
      <a ref={ref} href={href} className={classes} {...rest}>
        {inner}
      </a>
    );
  }

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {inner}
    </button>
  );
});

export default Button;