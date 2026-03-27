import {
  Box,
  Typography,
  IconButton,
  Button,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
} from "@mui/material";
import {
  HomeOutlined,
  AddCircleOutline,
  PersonOutlined,
  LogoutOutlined,
  StarOutline,
  Add,
  LanguageOutlined,
} from "@mui/icons-material";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const NAV_ROUTES = ["/", "/feed", "/create", "/profile"];

export default function Reviews() {
  const [navValue, setNavValue] = useState(0);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate("/login");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#F7F7FB",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Inter', 'Roboto', sans-serif",
        pb: "70px",
      }}
    >
      {/* Top Bar */}
      <Box
        sx={{
          bgcolor: "#fff",
          px: 2,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #F0F0F0",
        }}
      >
        {/* Home icon */}
        <Box
          sx={{
            bgcolor: "#EDE9FF",
            borderRadius: "10px",
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <HomeOutlined sx={{ color: "#6344F5", fontSize: 20 }} />
        </Box>

        {/* Title */}
        <Box sx={{ textAlign: "center" }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: "#1A1A2E", fontSize: "1rem", lineHeight: 1.2 }}
          >
            My Reviews
          </Typography>
          <Typography sx={{ color: "#9E9EB0", fontSize: "0.75rem" }}>
            0 reviews
          </Typography>
        </Box>

        {/* Logout */}
        <IconButton onClick={handleLogout} sx={{ color: "#9E9EB0" }} size="small">
          <LogoutOutlined fontSize="small" />
        </IconButton>
      </Box>

      {/* Main Content — Empty State */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          px: 3,
          gap: 3,
        }}
      >
        {/* Illustration circle */}
        <Box
          sx={{
            width: 160,
            height: 160,
            borderRadius: "50%",
            bgcolor: "#EDE9FF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <StarOutline sx={{ fontSize: 72, color: "#6344F5", strokeWidth: 1 }} />
        </Box>

        {/* Heading */}
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, color: "#1A1A2E", textAlign: "center", fontSize: "1.3rem" }}
        >
          No Reviews Yet
        </Typography>

        {/* Description */}
        <Typography
          sx={{
            color: "#9E9EB0",
            textAlign: "center",
            fontSize: "0.9rem",
            lineHeight: 1.7,
            maxWidth: 300,
          }}
        >
          Start your journey by sharing your first hotel experience. Your reviews
          help others make better travel decisions!
        </Typography>

        {/* CTA Button */}
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate("/create")}
          sx={{
            bgcolor: "#6344F5",
            borderRadius: "50px",
            px: 4,
            py: 1.5,
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.95rem",
            boxShadow: "0 4px 16px rgba(99, 68, 245, 0.35)",
            "&:hover": { bgcolor: "#512DC8" },
          }}
        >
          Add Your First Review
        </Button>
      </Box>

      {/* Bottom Navigation */}
      <Paper
        elevation={0}
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          borderTop: "1px solid #EBEBF0",
        }}
      >
        <BottomNavigation
          value={navValue}
          onChange={(_, newValue) => {
            setNavValue(newValue);
            navigate(NAV_ROUTES[newValue]);
          }}
          sx={{ bgcolor: "#fff", height: 64 }}
        >
          <BottomNavigationAction
            label="Home"
            icon={<HomeOutlined />}
            sx={{
              "&.Mui-selected": { color: "#6344F5" },
              "&.Mui-selected .MuiBottomNavigationAction-label": {
                fontSize: "0.7rem",
                fontWeight: 600,
              },
              "& .MuiBottomNavigationAction-wrapper": {
                bgcolor: navValue === 0 ? "#EDE9FF" : "transparent",
                borderRadius: "12px",
                px: 1.5,
                py: 0.5,
              },
              minWidth: 60,
            }}
          />
          <BottomNavigationAction
            label="Feed"
            icon={<LanguageOutlined />}
            sx={{
              "&.Mui-selected": { color: "#6344F5" },
              color: "#9E9EB0",
              minWidth: 60,
            }}
          />
          <BottomNavigationAction
            label="Add"
            icon={<AddCircleOutline />}
            sx={{
              "&.Mui-selected": { color: "#6344F5" },
              color: "#9E9EB0",
              minWidth: 60,
            }}
          />
          <BottomNavigationAction
            label="Profile"
            icon={<PersonOutlined />}
            sx={{
              "&.Mui-selected": { color: "#6344F5" },
              color: "#9E9EB0",
              minWidth: 60,
            }}
          />
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
