import React, { useState, useEffect } from 'react';
import {jwtDecode} from 'jwt-decode';
import { UserOutlined } from '@ant-design/icons';
import { Layout, Menu, Avatar, theme } from 'antd';
import './adminPage.css';
import logoImg from './assets/ETSISI_logo2.png';

const { Header, Sider, Content } = Layout;

const App = () => {
  const [user, setUser] = useState(null);
  const [grados, setGrados] = useState([]);

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // 拉取用户信息
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const { id, role } = jwtDecode(token);
      if (role === 'admin') {
        fetch('http://localhost:4000/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then(res => {
            if (!res.ok) throw new Error('获取用户信息失败');
            return res.json();
          })
          .then(data => setUser(data.user))
          .catch(console.error);
      }
    } catch (err) {
      console.error('无效的 token:', err);
    }
  }, []);

  // 拉取 Grados 列表
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('http://localhost:4000/api/grados', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error('获取 Grados 失败');
        return res.json();
      })
      .then(data => setGrados(data))
      .catch(console.error);
  }, []);

  // 基于后端数据构造菜单项
  const menuItems = grados.map(grado => ({
    key: grado._id,
    icon: React.createElement(UserOutlined),
    label: grado.name,
    children: [
      { key: `${grado._id}-code`, label: `Código: ${grado.code}` },
      { key: `${grado._id}-department`, label: grado.department },
    ],
  }));

  return (
    <Layout
      className="app-layout"
      style={{
        '--bg-container': colorBgContainer,
        '--border-radius-lg': borderRadiusLG,
      }}
    >
      <Header className="app-header">
        <div className="logo-img">
          <img src={logoImg} alt="Logo" />
        </div>
        <div className="main-title">Sistema del Administrador</div>
        {user && (
          <div className="user-info">
            <Avatar size="large" icon={<UserOutlined />} />
            <div className="user-details">
              <div className="user-name">{user.name}</div>
            </div>
          </div>
        )}
      </Header>

      <Layout className="app-body">
        <Sider className="app-sider">
          <Menu
            mode="inline"
            defaultSelectedKeys={grados.length ? [grados[0]._id] : []}
            defaultOpenKeys={grados.map(g => g._id)}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
          />
        </Sider>
        <Layout className="app-content-wrapper">
          <Content className="app-content">
            这里才是你的主要内容
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default App;
