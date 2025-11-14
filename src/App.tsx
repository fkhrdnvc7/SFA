import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Jobs from "./pages/Jobs";
import JobDetails from "./pages/JobDetails";
import Operations from "./pages/Operations";
import Colors from "./pages/Colors";
import Sizes from "./pages/Sizes";
import Attendance from "./pages/Attendance";
import Users from "./pages/Users";
import Reports from "./pages/Reports";
import Payroll from "./pages/Payroll";
import MyEarnings from "./pages/MyEarnings";
import IncomingJobs from "./pages/IncomingJobs";
import OutgoingJobs from "./pages/OutgoingJobs";
import OutgoingJobsList from "./pages/OutgoingJobsList";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/:id" element={<JobDetails />} />
            <Route path="/operations" element={<Operations />} />
            <Route path="/colors" element={<Colors />} />
            <Route path="/sizes" element={<Sizes />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/users" element={<Users />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/payroll" element={<Payroll />} />
            <Route path="/my-earnings" element={<MyEarnings />} />
            <Route path="/incoming-jobs" element={<IncomingJobs />} />
            <Route path="/outgoing-jobs-list" element={<OutgoingJobsList />} />
            <Route path="/outgoing-jobs/:id" element={<OutgoingJobs />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
