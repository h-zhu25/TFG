import React from 'react';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';

const AdminPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: 24 }}>
      <h1>欢迎，管理员！</h1>
      {/* 根据需要渲染管理员功能菜单 */}
      <Button type="primary" onClick={() => navigate('/dashboard')}>
        返回主面板
      </Button>
    </div>
  );
};

export default AdminPage;