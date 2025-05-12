import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App.jsx';                    // 登录页
import Register from '../log_up/src/logup.jsx'; // 注册页
import AdminPage from '../admin/src/adminPage.jsx';
import TeacherPage from '../teacher/src/teacherPage.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<App />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login/admin" element={<AdminPage />} />
        <Route path="/login/teacher" element={<TeacherPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
