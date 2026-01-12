import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import HomePage from "./pages/HomePage";
import ReservationPage from "./pages/ReservationPage";
import TicketPage from "./pages/TicketPage";
import TicketByTokenPage from "./pages/TicketByTokenPage";
import ServicesPage from "./pages/ServicesPage";
import RestoPage from "./pages/RestoPage";
import LoungePage from "./pages/LoungePage";
import GaleriePage from "./pages/GaleriePage";
import ContactPage from "./pages/ContactPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import { AdminLayout } from "./components/admin/AdminLayout";
import OverviewPage from "./pages/admin/OverviewPage";
import ReservationsPage from "./pages/admin/ReservationsPage";
import CheckInPage from "./pages/admin/CheckInPage";
import WalkInPage from "./pages/admin/WalkInPage";
import MessagesPage from "./pages/admin/MessagesPage";
import SettingsPage from "./pages/admin/SettingsPage";
import GardenManagementPage from "./pages/admin/GardenManagementPage";
import ContentManagementPage from "./pages/admin/ContentManagementPage";
import RestoManagementPage from "./pages/admin/RestoManagementPage";
import TablesPage from "./pages/admin/TablesPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/resto" element={<RestoPage />} />
            <Route path="/lounge" element={<LoungePage />} />
            <Route path="/reservation" element={<ReservationPage />} />
            <Route path="/ticket" element={<TicketByTokenPage />} />
            <Route path="/mon-ticket" element={<TicketPage />} />
            <Route path="/galerie" element={<GaleriePage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<OverviewPage />} />
              <Route path="garden" element={<GardenManagementPage />} />
              <Route path="resto" element={<RestoManagementPage />} />
              <Route path="content" element={<ContentManagementPage />} />
              <Route path="reservations" element={<ReservationsPage />} />
              <Route path="checkin" element={<CheckInPage />} />
              <Route path="walkin" element={<WalkInPage />} />
              <Route path="tables" element={<TablesPage />} />
              <Route path="messages" element={<MessagesPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
