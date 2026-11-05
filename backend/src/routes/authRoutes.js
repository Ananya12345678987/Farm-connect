import { Router } from "express";
import { ok } from "../utils/ApiResponse.js";

const router = Router();

router.post("/register/buyer", (req, res) =>
  ok(res, { message: "route works", data: req.body })
);

export default router;