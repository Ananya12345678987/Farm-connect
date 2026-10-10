import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import AuthShell from "../components/AuthShell/AuthShell";
import Field from "../components/Field/Field";
import Button from "../components/Button/Button";
import useForm from "../hooks/useForm";
import { email, required } from "../utils/validation";
import * as authApi from "../services/authApi";
import "./Login.css";

const RULES = {
  email,
  password: required("Password"),
};




/**
 * Login.
 *
 * On success, redirects to the dashboard matching the signed-in user's role.
 * The backend has no password-reset endpoint yet, so the reset view below
 * only explains that — it does not submit anywhere.
 */
export default function Login() {
  const [mode, setMode] = useState("login");
  const navigate = useNavigate();

  const form = useForm({
    initialValues: { email: "", password: "", remember: true },
    rules: RULES,
    onSubmit: (values) => authApi.login(values),
  });

  useEffect(() => {
    if (form.status === "success" && form.data) {
      const role = form.data.user?.role;
      const target =
        role === "FARMER"
          ? "/farmer-dashboard"
          : role === "ADMIN"
            ? "/admin-dashboard"
            : "/buyer-dashboard";
      navigate(target);
    }
  }, [form.status, form.data, navigate]);

  if (mode === "reset") {
    return (
      <AuthShell
        title="Reset your password"
        lead="Password reset isn't available yet — contact support for now."
        panelTitle="Your listings are still live while you are away."
        panelPoints={[
          "Buyers can find your farm by name.",
          "Orders and enquiries wait for you in one place.",
          "Rates stay exactly where you set them.",
        ]}
      >
        <p className="auth__alert" role="alert">
          Password reset by email isn't set up on this server yet. Contact
          support, or go back and log in if you remember your password.
        </p>

        <p className="login__roles">
          <button type="button" className="login__switch" onClick={() => setMode("login")}>
            Back to log in
          </button>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Welcome back"
      lead="Log in to manage your listings, orders and connections."
      panelTitle="Your listings are still live while you are away."
      panelPoints={[
        "Buyers can find your farm by name.",
        "Orders and enquiries wait for you in one place.",
        "Rates stay exactly where you set them.",
      ]}
      footer={
        <>
          New here? <Link to="/farmer-register">Register as a farmer</Link> or{" "}
          <Link to="/buyer-register">as a buyer</Link>.
        </>
      }
    >
      <form className="auth__form" onSubmit={form.handleSubmit} noValidate>
        {form.status === "error" && (
          <p className="auth__alert" role="alert">
            Log in did not go through. Check your connection and try again.
          </p>
        )}

        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          value={form.values.email}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
          error={form.errors.email}
        />

        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={form.values.password}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
          error={form.errors.password}
        />

        <div className="auth__aside-row">
          <label className="auth__check" htmlFor="login-remember">
            <input
              id="login-remember"
              name="remember"
              type="checkbox"
              checked={form.values.remember}
              onChange={form.handleChange}
            />
            <span>Keep me logged in</span>
          </label>

          <button
            type="button"
            className="auth__minor-link login__switch"
            onClick={() => setMode("reset")}
          >
            Forgot your password?
          </button>
        </div>

        <div className="auth__actions">
          <Button type="submit" size="lg" fullWidth loading={form.submitting}>
            Log in
          </Button>
        </div>

        <p className="login__roles">
          Looking for the administrator console?{" "}
          <Link to="/admin-register">Request access</Link>.
        </p>
      </form>
    </AuthShell>
  );
}