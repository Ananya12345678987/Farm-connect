import { Link } from "react-router-dom";

import AuthShell from "../components/AuthShell/AuthShell";
import Field from "../components/Field/Field";
import Button from "../components/Button/Button";
import useForm from "../hooks/useForm";
import { required, email, password, adminCode } from "../utils/validation";
import * as authApi from "../services/authApi";

const RULES = {
  fullName: required("Name"),
  email,
  password,
  adminCode,
};

export default function AdminRegister() {
  const form = useForm({
    initialValues: { fullName: "", email: "", password: "", adminCode: "" },
    rules: RULES,
    onSubmit: (values) => authApi.registerAdmin(values),
  });

  const success =
    form.status === "success"
      ? {
          title: "Administrator access granted",
          body: "You can now review farm verifications and flagged listings.",
          action: "Open the console",
          to: "/admin-dashboard",
        }
      : null;

  return (
    <AuthShell
      title="Administrator access"
      lead="Accounts are issued by the FarmConnect operations team. You will need the code you were sent."
      panelTitle="Verification is what makes the rest of this work."
      panelPoints={[
        "Review land records before a farm goes live.",
        "Watch listing quality and pricing outliers.",
        "Generate district reports.",
      ]}
      success={success}
      footer={
        <>
          Not an administrator? <Link to="/farmer-register">Register as a farmer</Link> or{" "}
          <Link to="/buyer-register">as a buyer</Link>.
        </>
      }
    >
      <form className="auth__form" onSubmit={form.handleSubmit} noValidate>
        {form.status === "error" && (
          <p className="auth__alert" role="alert">
            Access could not be granted. Check the code and submit again.
          </p>
        )}

        <Field
          label="Name"
          name="fullName"
          autoComplete="name"
          placeholder="Meera Rao"
          value={form.values.fullName}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
          error={form.errors.fullName}
        />

        <Field
          label="Work email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@farmconnect.in"
          value={form.values.email}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
          error={form.errors.email}
        />

        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters, with a letter and a number"
          value={form.values.password}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
          error={form.errors.password}
        />

        <Field
          label="Admin code"
          name="adminCode"
          autoComplete="one-time-code"
          hint="Issued by the operations team"
          value={form.values.adminCode}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
          error={form.errors.adminCode}
        />

        <div className="auth__actions">
          <Button type="submit" size="lg" fullWidth loading={form.submitting}>
            Request access
          </Button>
        </div>
      </form>
    </AuthShell>
  );
}