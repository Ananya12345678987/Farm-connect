import { useCallback, useState } from "react";
import { validate, hasErrors } from "../utils/validation";

/**
 * Form state, validation and submission.
 *
 * Fields validate on blur and on submit, never on every keystroke — telling
 * someone their email is invalid while they are still typing the @ is noise,
 * not help. Once a field has an error it re-validates as they fix it, so the
 * message clears the moment it stops being true.
 */
export default function useForm({ initialValues, rules, onSubmit }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [data, setData] = useState(null);

  const runField = useCallback(
    (name, value) => {
      const rule = rules[name];
      return rule ? rule(value) : null;
    },
    [rules]
  );

  const handleChange = useCallback(
    (event) => {
      const { name, value, type, checked } = event.target;
      const next = type === "checkbox" ? checked : value;
      setValues((current) => ({ ...current, [name]: next }));

      setErrors((current) => {
        if (!current[name]) return current;
        const message = runField(name, next);
        const updated = { ...current };
        if (message) updated[name] = message;
        else delete updated[name];
        return updated;
      });
    },
    [runField]
  );

  const handleBlur = useCallback(
    (event) => {
      const { name, value } = event.target;
      setTouched((current) => ({ ...current, [name]: true }));
      const message = runField(name, value);
      setErrors((current) => {
        const updated = { ...current };
        if (message) updated[name] = message;
        else delete updated[name];
        return updated;
      });
    },
    [runField]
  );

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      const found = validate(values, rules);
      setErrors(found);
      setTouched(
        Object.keys(rules).reduce((acc, key) => ({ ...acc, [key]: true }), {})
      );

      if (hasErrors(found)) {
        /* Send focus to the first field that failed, so a long form does not
           leave the user hunting for the problem. */
        const firstName = Object.keys(rules).find((key) => found[key]);
        const node = document.querySelector(`[name="${firstName}"]`);
        if (node) node.focus();
        return;
      }

      setStatus("submitting");
      try {
        const result = await onSubmit(values);
        setData(result);
        setStatus("success");
      } catch {
        setStatus("error");
      }
    },
    [values, rules, onSubmit]
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setStatus("idle");
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    status,
    data,
    submitting: status === "submitting",
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
  };
}