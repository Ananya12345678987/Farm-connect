import { Link } from "react-router-dom";

import AuthShell from "../components/AuthShell/AuthShell";
import Field from "../components/Field/Field";
import Button from "../components/Button/Button";
import useForm from "../hooks/useForm";
import { required, email, phone, password } from "../utils/validation";
import * as authApi from "../services/authApi";

const RULES = {
  fullName: required("Full name"),
  email,
  phone,
  password,
  businessName: required("Business name"),
  location: required("Location"),
};

export default function BuyerRegister() {
  const form = useForm({
    initialValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      businessName: "",
      location: "",
    },
    rules: RULES,
    onSubmit: (values) => authApi.registerBuyer(values),
  });

  const success =
    form.status === "success"
      ? {
          title: "You are in",
          body: "Your buyer account is active. Start with the listings ready in your region this week.",
          action: "Open your dashboard",
          to: "/buyer-dashboard",
        }
      : null;

  return (
    <AuthShell
      title="Source produce straight from the farm"
      lead="Free to join. You will need your business name and the district you collect from."
      panelTitle="Every listing names the farm that grew it."
      panelPoints={[
        "Grade, moisture and harvest date on every lot.",
        "Filter to districts you can actually collect from.",
        "Save farms and reorder next season.",
      ]}
      success={success}
      footer={
        <>
          Already registered? <Link to="/login">Log in</Link>. Selling instead?{" "}
          <Link to="/farmer-register">Register as a farmer</Link>.
        </>
      }
    >
      <form className="auth__form" onSubmit={form.handleSubmit} noValidate>
        {form.status === "error" && (
          <p className="auth__alert" role="alert">
            Registration did not go through. Check your connection and submit again.
          </p>
        )}

        <Field
          label="Full name"
          name="fullName"
          autoComplete="name"
          placeholder="Anand Kulkarni"
          value={form.values.fullName}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
          error={form.errors.fullName}
        />

        <div className="field-row">
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
            label="Phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="numeric"
            placeholder="98XXXXXXXX"
            hint="Used for order alerts"
            value={form.values.phone}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            error={form.errors.phone}
          />
        </div>

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

        <div className="field-row">
          <Field
            label="Business name"
            name="businessName"
            autoComplete="organization"
            placeholder="Anand Traders"
            value={form.values.businessName}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            error={form.errors.businessName}
          />
          <Field
            label="Location"
            name="location"
            placeholder="Hubballi, Karnataka"
            value={form.values.location}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            error={form.errors.location}
          />
        </div>

        <div className="auth__actions">
          <Button type="submit" size="lg" fullWidth loading={form.submitting}>
            Create buyer account
          </Button>
        </div>
      </form>
    </AuthShell>
  );
}