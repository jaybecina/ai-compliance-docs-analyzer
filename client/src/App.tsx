import { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Container,
  CssBaseline,
  Typography,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  IconButton,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Chip,
  Divider,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { Logout } from "@mui/icons-material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LoginPage from "./LoginPage";
import UploadCard from "./UploadCard";
import DocumentList from "./DocumentList";
import QnABox from "./QnABox";
import CompareDocuments from "./CompareDocuments";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

type User = {
  username: string;
  name?: string;
  role?: string;
};

interface Doc {
  id: string;
  filename: string;
  size: number;
  summary: string;
  keyPoints?: string[];
}

interface DocDetail extends Doc {
  uploadDate?: string;
  fullText: string;
  keyPoints: string[];
}

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocDetail | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    // Check backend connection
    const checkBackendConnection = async () => {
      try {
        console.log("🔍 Checking backend connection...");
        const response = await axios.get(`${API_URL}/health`);
        console.log("✅ Backend connected successfully!", response.data);
        console.log("📡 Backend URL:", API_URL);
        console.log("⏰ Server Time:", response.data.timestamp);
      } catch (error) {
        console.error("❌ Backend connection failed!", error);
        console.error("🔌 Make sure backend is running: npm run dev:backend");
      }
    };

    checkBackendConnection();

    // Check authentication
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      setLoggedIn(true);
      setUser(JSON.parse(userData));
      console.log("👤 User logged in:", JSON.parse(userData).username);
    }
  }, []);

  useEffect(() => {
    if (!loggedIn) return;

    const loadDocuments = async () => {
      try {
        const res = await axios.get(`${API_URL}/documents`);
        const docs = Array.isArray(res.data?.documents)
          ? res.data.documents
          : [];
        setDocuments(docs);
      } catch (err) {
        console.error("❌ Failed to load documents", err);
      }
    };

    loadDocuments();
  }, [loggedIn]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setLoggedIn(false);
    setUser(null);
    setDocuments([]);
    setSelectedDoc(null);
  };

  const handleSelectDocument = async (doc: { id: string }) => {
    try {
      const res = await axios.get(`${API_URL}/documents/${doc.id}`);
      const fullDoc = res.data?.document;
      if (!fullDoc?.id) throw new Error("Unexpected document response");
      setSelectedDoc(fullDoc);
    } catch (err) {
      console.error("❌ Failed to load document details", err);
    }
  };

  if (!loggedIn) {
    return (
      <LoginPage
        onLogin={() => {
          setLoggedIn(true);
          const userData = localStorage.getItem("user");
          if (userData) setUser(JSON.parse(userData));
        }}
      />
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        width: "100%",
      }}
    >
      <CssBaseline />

      {/* Navbar */}
      <AppBar
        position="sticky"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
          <Typography
            variant={isMobile ? "h6" : "h5"}
            sx={{
              flexGrow: 1,
              fontWeight: 600,
              fontSize: { xs: "1rem", sm: "1.25rem", md: "1.5rem" },
            }}
          >
            AI Compliance Document Analyzer
          </Typography>
          {user && (
            <Typography
              variant="body2"
              sx={{
                mr: 2,
                display: { xs: "none", sm: "block" },
              }}
            >
              Welcome, {user.name || user.username}
            </Typography>
          )}
          <IconButton color="inherit" onClick={handleLogout} title="Logout">
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Main Content - Centered */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: { xs: 3, sm: 4, md: 6 },
          px: { xs: 2, sm: 3 },
          backgroundColor: "#f5f5f7",
        }}
      >
        <Container
          maxWidth="lg"
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          <Card sx={{ boxShadow: 2, borderRadius: 2 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography
                variant={isMobile ? "h6" : "h5"}
                sx={{ fontWeight: 700, mb: 1 }}
              >
                How to use this app
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Quick workflow: upload PDFs → select a document to review the
                summary → ask questions → compare documents.
              </Typography>

              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography variant="body2">
                  1. Upload a compliance PDF using “Upload PDF”.
                </Typography>
                <Typography variant="body2">
                  2. Click an uploaded document to view its summary and key
                  points.
                </Typography>
                <Typography variant="body2">
                  3. Use the Q&A box to ask questions about the selected
                  document.
                </Typography>
                <Typography variant="body2">
                  4. Upload at least 2 documents to enable “Compare Documents”
                  for gap analysis.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tip: If you don’t have credentials yet, use the Register flow
                  on the login screen (or ask your admin for a seeded account).
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <UploadCard
            onUploadSuccess={(doc) => {
              setDocuments((prev) => [doc, ...prev]);
            }}
          />

          <DocumentList
            documents={documents}
            onSelect={(doc) => handleSelectDocument(doc)}
          />

          <Card sx={{ boxShadow: 2, borderRadius: 2 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography
                variant={isMobile ? "h6" : "h5"}
                sx={{ fontWeight: 700, mb: 1 }}
              >
                Q&A
              </Typography>
              {selectedDoc ? (
                <>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Asking about: {selectedDoc.filename}
                  </Typography>
                  <QnABox docId={selectedDoc.id} />
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Select a document from “Uploaded Documents” to enable Q&A.
                </Typography>
              )}
            </CardContent>
          </Card>

          <CompareDocuments documents={documents} />

          {selectedDoc && (
            <Card
              sx={{
                boxShadow: 3,
                borderRadius: 2,
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography
                  variant={isMobile ? "h6" : "h5"}
                  sx={{ mb: 2, fontWeight: 600 }}
                >
                  {selectedDoc.filename}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {Math.round((selectedDoc.size || 0) / 1024)} KB
                </Typography>
                <Typography variant="subtitle1" sx={{ mb: 3 }}>
                  <strong>Summary:</strong> {selectedDoc.summary}
                </Typography>

                {selectedDoc.keyPoints?.length > 0 && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography
                      variant="subtitle1"
                      sx={{ mb: 1, fontWeight: 600 }}
                    >
                      Key Points
                    </Typography>
                    <Box
                      sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}
                    >
                      {selectedDoc.keyPoints.map((point, idx) => (
                        <Chip
                          key={`${selectedDoc.id}-kp-${idx}`}
                          label={point}
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </>
                )}

                {selectedDoc.fullText && (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Full Text
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography
                        variant="body2"
                        sx={{ whiteSpace: "pre-wrap", color: "text.secondary" }}
                      >
                        {selectedDoc.fullText}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                )}
              </CardContent>
            </Card>
          )}
        </Container>
      </Box>
    </Box>
  );
}

export default App;
