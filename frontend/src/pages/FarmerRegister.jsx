import { Link } from "react-router-dom";

import AuthShell from "../components/AuthShell/AuthShell";
import Field from "../components/Field/Field";
import Button from "../components/Button/Button";
import useForm from "../hooks/useForm";
import { required, email, phone, password } from "../utils/validation";
import * as authApi from "../services/authApi";

const FARM_TYPES = [
  { value: "vegetables", label: "Vegetables" },
  { value: "fruits", label: "Fruit orchard" },
  { value: "grains", label: "Grains and pulses" },
  { value: "spices", label: "Spices" },
  { value: "mixed", label: "Mixed cropping" },
];

const RULES = {
  fullName: required("Full name"),
  email,
  phone,
  password,
  farmName: required("Farm name"),
  location: required("Location"),
  farmType: required("Farm type"),
};

export default function FarmerRegister() {
  const form = useForm({
    initialValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      farmName: "",
      location: "",
      farmType: "",
    },
    rules: RULES,
    onSubmit: (values) => authApi.registerFarmer(values),
  });

  /* On success the form is swapped for a confirmation screen, so the user
     sees that registration worked before moving on to the dashboard. */
  const success =
    form.status === "success"
      ? {
          title: "Your farm is registered",
          body: "A field officer will verify your land details within two working days. You can set up your first listing now — it goes live once verification clears.",
          action: "Open your dashboard",
          to: "/farmer-dashboard",
        }
      : null;

  return (
    <AuthShell
      title="Sell your harvest direct"
      lead="Registration is free. You will need your phone number and the village your farm is registered in."
      panelTitle="500+ farms across 25 districts already sell here."
      panelPoints={[
        "You set the rate. It stays up until you change it.",
        "Verification takes two working days.",
        "No commission on anything you sell.",
      ]}
      success={success}
      footer={
        <>
          Already registered? <Link to="/login">Log in</Link>. Buying instead?{" "}
          <Link to="/buyer-register">Register as a buyer</Link>.
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
          placeholder="Shivamma Gowda"
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
            label="Farm name"
            name="farmName"
            placeholder="Gowda Thota"
            value={form.values.farmName}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            error={form.errors.farmName}
          />
          <Field
            label="Location"
            name="location"
            placeholder="Kolar, Karnataka"
            value={form.values.location}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            error={form.errors.location}
          />
        </div>

        <Field
          label="What do you mainly grow?"
          name="farmType"
          as="select"
          options={FARM_TYPES}
          value={form.values.farmType}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
          error={form.errors.farmType}
        />

        <div className="auth__actions">
          <Button type="submit" size="lg" fullWidth loading={form.submitting}>
            Create farmer account
          </Button>
        </div>
      </form>
    </AuthShell>
  );
}