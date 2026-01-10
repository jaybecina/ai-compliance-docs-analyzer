import { Router } from "express";
import { compareDocuments } from "../controllers/compare.controller";

const router = Router();

router.post("/", compareDocuments);

export default router;
