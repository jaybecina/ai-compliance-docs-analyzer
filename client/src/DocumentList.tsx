import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from "@mui/material";

interface DocumentListProps {
  documents: {
    id: string;
    filename: string;
    size?: number;
    summary?: string;
  }[];
  onSelect: (doc: { id: string; filename: string }) => void;
}

export default function DocumentList({
  documents,
  onSelect,
}: DocumentListProps) {
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Uploaded Documents
        </Typography>
        <List sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {documents.map((doc, idx) => (
            <ListItem
              disablePadding
              key={doc.id || doc.filename + idx}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                overflow: "hidden",
                transition: "all 0.2s",
                "&:hover": {
                  borderColor: "primary.main",
                  boxShadow: 1,
                },
              }}
            >
              <ListItemButton
                onClick={() => onSelect({ id: doc.id, filename: doc.filename })}
                sx={{ py: 2 }}
              >
                <ListItemText
                  primary={doc.filename}
                  secondary={
                    doc.summary
                      ? doc.summary
                      : doc.size
                      ? `${Math.round(doc.size / 1024)} KB`
                      : undefined
                  }
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
