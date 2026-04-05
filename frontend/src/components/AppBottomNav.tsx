import React from "react";
import { Paper, BottomNavigation, BottomNavigationAction } from "@mui/material";
import {
  HomeOutlined,
  LanguageOutlined,
  AddCircleOutline,
  PersonOutlined,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const NAV_ROUTES = ["/", "/feed", "/create", "/profile"];

interface AppBottomNavProps {
  activeIndex: number;
}

const AppBottomNav: React.FC<AppBottomNavProps> = ({ activeIndex }) => {
  const navigate = useNavigate();

  const navItemSx = (index: number) => ({
    "&.Mui-selected": { color: "#6344F5" },
    "&.Mui-selected .MuiBottomNavigationAction-label": {
      fontSize: "0.7rem",
      fontWeight: 600,
    },
    "& .MuiBottomNavigationAction-wrapper": {
      bgcolor: activeIndex === index ? "#EDE9FF" : "transparent",
      borderRadius: "12px",
      px: 1.5,
      py: 0.5,
    },
    color: "#9E9EB0",
    minWidth: 60,
  });

  return (
    <Paper
      elevation={0}
      sx={{ position: "fixed", bottom: 0, left: 0, right: 0, borderTop: "1px solid #EBEBF0" }}
    >
      <BottomNavigation
        value={activeIndex}
        onChange={(_, newValue) => navigate(NAV_ROUTES[newValue])}
        sx={{ bgcolor: "#fff", height: 64 }}
      >
        <BottomNavigationAction label="Home" icon={<HomeOutlined />} sx={navItemSx(0)} />
        <BottomNavigationAction label="Feed" icon={<LanguageOutlined />} sx={navItemSx(1)} />
        <BottomNavigationAction label="Add" icon={<AddCircleOutline />} sx={navItemSx(2)} />
        <BottomNavigationAction label="Profile" icon={<PersonOutlined />} sx={navItemSx(3)} />
      </BottomNavigation>
    </Paper>
  );
};

export default AppBottomNav;
