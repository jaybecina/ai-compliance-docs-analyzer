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
        <List>
          {documents.map((doc, idx) => (
            <ListItem disablePadding key={doc.id || doc.filename + idx}>
              <ListItemButton
                onClick={() => onSelect({ id: doc.id, filename: doc.filename })}
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
