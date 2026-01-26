import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginUp from '../auth/LoginPage'
import SignUp from '../auth/SignUp'
import DashboardIndex from '../modules/dashboard/DashboardPage'
import MainLayout from '../layout/MainLayout'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/loginUp" element={<LoginUp />} />
          <Route path="/signUp" element={<SignUp />} />
          <Route path="/index" element={<DashboardIndex />} />
          <Route path="/" element={<Navigate to="/loginUp" replace />} />
          {/* Add more routes as needed */}
          <Route path="/work-orders" element={<DashboardIndex />} />
          <Route path="/scheduling" element={<DashboardIndex />} />
          <Route path="/resources" element={<DashboardIndex />} />
          <Route path="/materials" element={<DashboardIndex />} />
          <Route path="/stock-levels" element={<DashboardIndex />} />
          <Route path="/suppliers" element={<DashboardIndex />} />
          <Route path="/inspections" element={<DashboardIndex />} />
          <Route path="/metrics" element={<DashboardIndex />} />
          <Route path="/compliance" element={<DashboardIndex />} />
          <Route path="/masters/*" element={<DashboardIndex />} />
          <Route path="/receipts/*" element={<DashboardIndex />} />
          <Route path="/issues/*" element={<DashboardIndex />} />
          <Route path="/reports/*" element={<DashboardIndex />} />
          <Route path="/users/*" element={<DashboardIndex />} />
          <Route path="/settings" element={<DashboardIndex />} />
          <Route path="/profile" element={<DashboardIndex />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  )
}
