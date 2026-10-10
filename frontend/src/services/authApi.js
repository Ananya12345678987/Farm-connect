import { get, post, patch } from "./api";

export const registerFarmer = (values) => post("/auth/register/farmer", values);
export const registerBuyer = (values) => post("/auth/register/buyer", values);
export const registerAdmin = (values) => post("/auth/register/admin", values);
export const login = (values) => post("/auth/login", values);
export const logout = () => post("/auth/logout");
export const me = () => get("/auth/me");
export const changePassword = (values) => patch("/auth/password", values);