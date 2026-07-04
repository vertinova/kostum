import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { isAuthed } from "./api";
import Landing from "./pages/Landing.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminProductForm from "./pages/AdminProductForm.jsx";

function Protected({ children }) {
  const location = useLocation();
  if (!isAuthed()) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <Protected>
            <AdminDashboard />
          </Protected>
        }
      />
      <Route
        path="/admin/produk/baru"
        element={
          <Protected>
            <AdminProductForm />
          </Protected>
        }
      />
      <Route
        path="/admin/produk/:id"
        element={
          <Protected>
            <AdminProductForm />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
