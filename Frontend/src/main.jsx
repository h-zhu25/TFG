import React from 'react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import App from './App.jsx'
import Register from '../log_up/src/logup.jsx'
import AdminPage from '../admin/src/adminPage.jsx'  // 管理员专用页面

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* 根路径，渲染登录组件 */}
        <Route path="/" element={<App />} />

        {/* 点击“登录”后也走同一个 App */}
        <Route path="/login" element={<App />} />

        {/* 注册页 */}
        <Route path="/register" element={<Register />} />

        {/* 管理员专用路由：登录成功后 role === 'admin' 会跳到这里 */}
        <Route path="/login/admin" element={<AdminPage />} />

        {/* 兜底：其它所有路径都重定向到登录页 */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
