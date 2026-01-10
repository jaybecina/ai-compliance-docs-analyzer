import { useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  FormControl,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Divider,
  Chip,
} from "@mui/material";
import { CompareArrows } from "@mui/icons-material";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

interface Doc {
  id: string;
  filename: string;
  summary: string;
}

interface CompareProps {
  documents: Doc[];
}

interface GapAnalysis {
  comparison: {
    documentA: { id: string; filename: string };
    documentB: { id: string; filename: string };
    analysis: string;
  };
}

export default function CompareDocuments({ documents }: CompareProps) {
  const [docA, setDocA] = useState<string>("");
  const [docB, setDocB] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GapAnalysis | null>(null);
  const [error, setError] = useState("");

  const handleCompare = async () => {
    if (!docA || !docB) {
      setError("Please select both documents");
      return;
    }

    if (docA === docB) {
      setError("Please select different documents");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await axios.post(`${API_URL}/compare`, {
        docIdA: docA,
        docIdB: docB,
      });

      setResult(response.data);
    } catch (err: unknown) {
      const maybeAxiosErr = err as { response?: { data?: { error?: string } } };
      setError(
        maybeAxiosErr.response?.data?.error || "Failed to compare documents"
      );
    } finally {
      setLoading(false);
    }
  };

  if (documents.length < 2) {
    return (
      <Card sx={{ boxShadow: 3, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            Compare Documents
          </Typography>
          <Alert severity="info">
            Upload at least 2 documents to enable comparison
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ boxShadow: 3, borderRadius: 2 }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <CompareArrows sx={{ mr: 1, fontSize: 32 }} />
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Gap Analysis & Document Comparison
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Compare two documents to identify compliance gaps, missing
          requirements, and get recommendations. Perfect for comparing site
          procedures against legislation or standards.
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            mb: 3,
          }}
        >
          <FormControl fullWidth>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Document A (e.g., Site Procedures)
            </Typography>
            <Select
              value={docA}
              onChange={(e) => setDocA(e.target.value)}
              displayEmpty
            >
              <MenuItem value="" disabled>
                Select first document
              </MenuItem>
              {documents.map((doc) => (
                <MenuItem key={doc.id} value={doc.id}>
                  {doc.filename}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Document B (e.g., Legislation/Standards)
            </Typography>
            <Select
              value={docB}
              onChange={(e) => setDocB(e.target.value)}
              displayEmpty
            >
              <MenuItem value="" disabled>
                Select second document
              </MenuItem>
              {documents.map((doc) => (
                <MenuItem key={doc.id} value={doc.id}>
                  {doc.filename}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Button
          variant="contained"
          color="primary"
          onClick={handleCompare}
          disabled={loading || !docA || !docB}
          fullWidth
          size="large"
          sx={{ mb: 2 }}
        >
          {loading ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
              Analyzing...
            </>
          ) : (
            "Analyze Gap & Compare"
          )}
        </Button>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {result && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 3 }}>
              <Chip label="Analysis Results" color="primary" />
            </Divider>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                📊 Comparison Summary
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  p: 2,
                  bgcolor: "grey.50",
                  borderRadius: 1,
                  whiteSpace: "pre-wrap",
                }}
              >
                {result.comparison.analysis}
              </Typography>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
