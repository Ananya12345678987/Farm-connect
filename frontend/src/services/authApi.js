/**
 * TEMPORARY stand-in for the real auth service.
 *
 * It has the same function names the real one will have, so pages that call
 * `authApi.login(...)` do not change when we swap this file for the version
 * that talks to the backend.
 *
 * Fake rule so every dashboard can be reached while testing: an email that
 * contains "farmer" signs in as a farmer, "admin" as an admin, anything else
 * as a buyer.
 */

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function login({ email }) {
  await wait(700);

  const lower = email.toLowerCase();
  const role = lower.includes("farmer")
    ? "FARMER"
    : lower.includes("admin")
      ? "ADMIN"
      : "BUYER";

  return { user: { email, role } };
}