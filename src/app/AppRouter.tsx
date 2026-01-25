import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginUp from '../auth/LoginPage'
import SignUp from '../auth/SignUp'
import DashboardIndex from '../modules/dashboard/DashboardPage'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/loginUp" element={<LoginUp />} />
        <Route path="/signUp" element={<SignUp />} />
        <Route path="/index" element={<DashboardIndex />} />
        <Route path="/" element={<Navigate to="/loginUp" replace />} />
      </Routes>
    </BrowserRouter>
  )
}