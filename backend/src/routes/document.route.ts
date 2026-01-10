import { Router } from "express";
import { upload } from "../middleware/upload.middleware";
import {
  uploadDocument,
  getAllDocuments,
  getDocumentById,
} from "../controllers/document.controller";

const router = Router();

router.post("/upload", upload.single("file"), uploadDocument);
router.get("/", getAllDocuments);
router.get("/:id", getDocumentById);

export default router;
