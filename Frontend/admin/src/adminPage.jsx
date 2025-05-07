import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import {
  UserOutlined,
  LaptopOutlined,
  NotificationOutlined,
} from '@ant-design/icons';
import { Layout, Menu, Avatar, theme } from 'antd';
import './adminPage.css';  // ← 引入新建的 CSS

const { Header, Sider, Content } = Layout;

// 侧边菜单数据（保持不变）
const items2 = [UserOutlined, LaptopOutlined, NotificationOutlined].map(
  (icon, index) => {
    const key = String(index + 1);
    return {
      key: `sub${key}`,
      icon: React.createElement(icon),
      label: `subnav ${key}`,
      children: new Array(4).fill(null).map((_, j) => ({
        key: index * 4 + j + 1,
        label: `option${index * 4 + j + 1}`,
      })),
    };
  }
);

const App = () => {
  const [user, setUser] = useState(null);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // 拉取 profile …（保持不变）
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

  return (
    <Layout
      className="app-layout"
      style={{
        '--bg-container': colorBgContainer,
        '--border-radius-lg': borderRadiusLG,
      }}
    >
      <Header className="app-header">
        <div className="demo-logo" />
        {user && (
          <div className="user-info">
            <Avatar size="large" icon={<UserOutlined />} />
            <div className="user-details">
              <div className="user-name">{user.name}</div>
              <div className="user-username">@{user.username}</div>
            </div>
          </div>
        )}
      </Header>

      <Layout>
        <Sider className="app-sider">
          <Menu
            mode="inline"
            defaultSelectedKeys={['1']}
            defaultOpenKeys={['sub1']}
            style={{ height: '100%', borderRight: 0 }}
            items={items2}
          />
        </Sider>
        <Layout className="app-content-wrapper">
          <Content className="app-content">
            {/* 你的主要内容放这里 */}
            这里才是你的主要内容
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default App;
