/* Pure, framework-free validators. Each returns an error string or null,
   so the same rules can be reused server-side later. */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_IN = /^[6-9]\d{9}$/;

export const required = (label) => (value) =>
  value && String(value).trim() ? null : `${label} is required`;

export const email = (value) => {
  if (!value || !String(value).trim()) return "Email is required";
  return EMAIL.test(value.trim()) ? null : "Enter a valid email address";
};

export const phone = (value) => {
  if (!value || !String(value).trim()) return "Phone number is required";
  const digits = String(value).replace(/[\s-]/g, "").replace(/^\+91/, "");
  return PHONE_IN.test(digits)
    ? null
    : "Enter a 10-digit Indian mobile number";
};

export const password = (value) => {
  if (!value) return "Password is required";
  if (value.length < 8) return "Use at least 8 characters";
  if (!/[a-zA-Z]/.test(value) || !/\d/.test(value))
    return "Include at least one letter and one number";
  return null;
};

export const adminCode = (value) => {
  if (!value || !value.trim()) return "Admin code is required";
  return value.trim().length >= 6 ? null : "Admin codes are 6 characters or more";
};

/**
 * Runs a {field: validator} map over values and returns {field: message}
 * for the fields that failed.
 */
export function validate(values, rules) {
  const errors = {};
  Object.entries(rules).forEach(([field, rule]) => {
    const message = rule(values[field]);
    if (message) errors[field] = message;
  });
  return errors;
}

export const hasErrors = (errors) => Object.keys(errors).length > 0;