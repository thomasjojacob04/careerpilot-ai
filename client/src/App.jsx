import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import ResumeBuilder from "./pages/ResumeBuilder";
import AtsAnalyzer from "./pages/AtsAnalyzer";
import SkillGap from "./pages/SkillGap";
import Careers from "./pages/Careers";
import Aptitude from "./pages/Aptitude";
import StudentDrives from "./pages/StudentDrives";
import InterviewResult from "./pages/InterviewResult";
import OfficerDashboard from "./pages/officer/OfficerDashboard";
import Companies from "./pages/officer/Companies";
import Drives from "./pages/officer/Drives";
import Students from "./pages/officer/Students";
import Analytics from "./pages/officer/Analytics";

// TensorFlow.js is large, so the interview pages load only when needed
const InterviewSetup = lazy(() => import("./pages/InterviewSetup"));
const InterviewRoom = lazy(() => import("./pages/InterviewRoom"));

const Home = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === "officer" ? "/officer" : "/dashboard"} replace />;
};

const student = (el) => (
  <ProtectedRoute role="student"><Suspense fallback={<p className="p-8 text-sm text-ink-soft">Loading...</p>}>{el}</Suspense></ProtectedRoute>
);
const officer = (el) => <ProtectedRoute role="officer">{el}</ProtectedRoute>;

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* The interview room is full-screen and deliberately has no sidebar */}
      <Route path="/interview/room/:id" element={student(<InterviewRoom />)} />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={student(<Dashboard />)} />
        <Route path="/profile" element={student(<Profile />)} />
        <Route path="/resume" element={student(<ResumeBuilder />)} />
        <Route path="/ats" element={student(<AtsAnalyzer />)} />
        <Route path="/skill-gap" element={student(<SkillGap />)} />
        <Route path="/careers" element={student(<Careers />)} />
        <Route path="/aptitude" element={student(<Aptitude />)} />
        <Route path="/drives" element={student(<StudentDrives />)} />
        <Route path="/interview" element={student(<InterviewSetup />)} />
        <Route path="/interview/result/:id" element={student(<InterviewResult />)} />

        <Route path="/officer" element={officer(<OfficerDashboard />)} />
        <Route path="/officer/students" element={officer(<Students />)} />
        <Route path="/officer/companies" element={officer(<Companies />)} />
        <Route path="/officer/drives" element={officer(<Drives />)} />
        <Route path="/officer/analytics" element={officer(<Analytics />)} />
      </Route>
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
