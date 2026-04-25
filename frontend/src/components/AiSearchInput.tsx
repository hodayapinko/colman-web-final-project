import React, { useCallback, useState } from "react";
import { Box, Button, TextField, Chip, Snackbar, Alert, CircularProgress } from "@mui/material";
import { Clear } from "@mui/icons-material";
import { aiService } from "../services/aiService";

interface AiSearchInputProps {
  onFilterChange?: (postIds: string[] | null) => void;
}

const AiSearchInput: React.FC<AiSearchInputProps> = ({ onFilterChange }) => {
  const [query, setQuery] = useState("");
  const [lastQuery, setLastQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [filterCount, setFilterCount] = useState(0);
  const [toast, setToast] = useState<{ message: string; severity: "info" | "error" } | null>(null);

  const runSearch = useCallback(async () => {
    const q = query.trim();
    if (!q || q.toLowerCase() === lastQuery) return;

    setLoading(true);
    setToast(null);
    setLastQuery(q.toLowerCase());

    try {
      const result = await aiService.search(q);

      const sources = result.sources ?? [];
      const postIds = sources.map((s) => s.postId);
      if (postIds.length > 0) {
        setIsFiltering(true);
        setFilterCount(sources.length);
        onFilterChange?.(postIds);
      } else {
        setIsFiltering(false);
        setToast({ message: result.answer || "No relevant hotel reviews found.", severity: "info" });
        onFilterChange?.(null);
      }
    } catch (e: any) {
      const message =
        e?.response?.data?.message ??
        e?.message ??
        "AI search failed. Please try again.";
      setToast({ message: String(message), severity: "error" });
    } finally {
      setLoading(false);
    }
  }, [query, onFilterChange]);

  const clearFilter = useCallback(() => {
    setIsFiltering(false);
    setFilterCount(0);
    setQuery("");
    setLastQuery("");
    setToast(null);
    onFilterChange?.(null);
  }, [onFilterChange]);

  return (
    <>
      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          label="Ask AI"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") runSearch();
          }}
          placeholder='e.g. "Best reviews in Paris"'
          autoComplete="off"
        />
        <Button
          variant="contained"
          onClick={runSearch}
          disabled={loading || !query.trim()}
          sx={{ bgcolor: "#6344F5", "&:hover": { bgcolor: "#512DC8" }, minWidth: 64 }}
        >
          {loading ? <CircularProgress size={20} sx={{ color: "white" }} /> : "Go"}
        </Button>
      </Box>

      {loading && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, color: "text.secondary" }}>
          <CircularProgress size={16} />
          AI is thinking...
        </Box>
      )}

      {isFiltering && (
        <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
          <Chip
            label={`Showing ${filterCount} AI result${filterCount !== 1 ? "s" : ""}`}
            onDelete={clearFilter}
            deleteIcon={<Clear />}
            color="primary"
            size="small"
          />
        </Box>
      )}

      <Snackbar
        open={toast !== null}
        autoHideDuration={5000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setToast(null)}
          severity={toast?.severity ?? "info"}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {toast?.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AiSearchInput;
