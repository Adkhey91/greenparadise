import { useEffect } from "react";
import { useLocation } from "react-router-dom";

type Theme = "garden" | "chalet";

const CHALET_ROUTES = ["/resto", "/lounge"];

export function useRouteTheme(): Theme {
  const location = useLocation();
  
  const theme: Theme = CHALET_ROUTES.some(route => 
    location.pathname.startsWith(route)
  ) ? "chalet" : "garden";
  
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    return () => {
      document.documentElement.removeAttribute("data-theme");
    };
  }, [theme]);
  
  return theme;
}

export function getThemeFromPath(pathname: string): Theme {
  return CHALET_ROUTES.some(route => pathname.startsWith(route)) ? "chalet" : "garden";
}
