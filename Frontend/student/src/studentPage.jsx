// src/pages/StudentPage.jsx
import React, { useState, useEffect } from 'react';
import {jwtDecode} from 'jwt-decode';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import {
  Layout,
  Menu,
  Avatar,
  Button,
  Typography,
  Modal,
  Tag,
  FloatButton,
  theme
} from 'antd';
import { useNavigate } from 'react-router-dom';
import './studentPage.css';
import logoImg from './assets/ETSISI_logo2.png';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

export default function StudentPage() {
  const [user, setUser] = useState(null);
  const [grados, setGrados] = useState([]);
  const [courses, setCourses] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalCourse, setModalCourse] = useState(null);
  const [selectedCourses, setSelectedCourses] = useState([]);

  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  // 获取用户 & 权限检查
  useEffect(() => {
    if (!token) return;
    try {
      const { role } = jwtDecode(token);
      if (role !== 'student') return navigate('/login', { replace: true });
      fetch('http://localhost:4000/api/users/profile', { headers })
        .then(r => (r.ok ? r.json() : Promise.reject()))
        .then(setUser)
        .catch(() => navigate('/login', { replace: true }));
    } catch {
      navigate('/login', { replace: true });
    }
  }, [token, navigate]);

  // 拉取专业 & 课程
  useEffect(() => {
    if (!token) return;
    fetch('http://localhost:4000/api/grados', { headers })
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(setGrados)
      .catch(console.error);
    fetch('http://localhost:4000/api/courses', { headers })
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(setCourses)
      .catch(console.error);
  }, [token]);

  // 从数据库初始化已选课程
  useEffect(() => {
    if (user && courses.length > 0 && Array.isArray(user.selectedCourses)) {
      const initial = courses.filter(c => user.selectedCourses.includes(c._id));
      setSelectedCourses(initial);
    }
  }, [user, courses]);

  // 构造侧边栏菜单
  const menuItems = grados.map(g => {
    const related = courses.filter(c => c.grados.some(x => x._id === g._id));
    const regular = related.filter(c => !c.isSpecialElective);
    const electives = related.filter(c => c.isSpecialElective);

    const semesters = [1, 2].map(s => {
      const cs = regular
        .filter(c => c.semester === s)
        .sort((a, b) => a.priority - b.priority);
      return {
        key: `${g._id}-sem${s}`,
        label: `Semestre ${s}`,
        children: cs.length
          ? cs.map(c => ({ key: `${g._id}-sem${s}-${c._id}`, label: `${c.code} - ${c.name}` }))
          : [{ key: `${g._id}-sem${s}-empty`, label: 'Sin cursos' }]
      };
    });

    const electiveMenu = {
      key: `${g._id}-electivas`,
      label: 'Optativa',
      children: electives.length
        ? electives.sort((a, b) => a.priority - b.priority).map(c => ({ key: `${g._id}-electivas-${c._id}`, label: `${c.code} - ${c.name}` }))
        : [{ key: `${g._id}-electivas-empty`, label: 'Sin optativas' }]
    };

    return { key: g._id, icon: <UserOutlined />, label: g.name, children: [...semesters, electiveMenu] };
  });

  // 菜单点击
  const onMenuClick = ({ key }) => {
    const parts = key.split('-');
    if (parts.length === 3) {
      const courseId = parts[2];
      const course = courses.find(c => c._id === courseId);
      if (course) {
        setModalCourse(course);
        setModalVisible(true);
      }
    }
  };

  // 确认选择课程
  const handleOk = () => {
    if (modalCourse && !selectedCourses.some(c => c._id === modalCourse._id)) {
      setSelectedCourses(prev => [...prev, modalCourse]);
    }
    setModalVisible(false);
    setModalCourse(null);
  };

  // 取消弹窗
  const handleCancel = () => {
    setModalVisible(false);
    setModalCourse(null);
  };

  // 取消已选课程
  const handleDeselect = (courseId) => {
    setSelectedCourses(prev => prev.filter(c => c._id !== courseId));
  };

  return (
    <Layout
      style={{ '--bg-container': colorBgContainer, '--border-radius-lg': borderRadiusLG }}
      className="app-layout"
    >
      <Header className="app-header">
        <div className="logo-img"><img src={logoImg} alt="Logo" /></div>
        <div className="main-title">Sistema de selección de cursos por estudiantes</div>
        {user && (
          <div className="user-info">
            <Avatar size="large" icon={<UserOutlined />} />
            <span style={{ margin: '0 12px' }}>{user.name}</span>
            <Button
              type="link"
              icon={<LogoutOutlined />}
              onClick={() => { localStorage.removeItem('token'); navigate('/login', { replace: true }); }}
            >
              Cerrar sesión
            </Button>
          </div>
        )}
      </Header>

      <Layout className="app-body">
        <Sider className="app-sider" style={{ background: colorBgContainer }}>
          <Menu mode="inline" items={menuItems} onClick={onMenuClick} style={{ height: '100%', borderRight: 0 }} />
        </Sider>

        <Layout className="app-content-wrapper">
          <Content className="app-content">
            {/* 已选课程区域 */}
            <div className="selected-courses">
              <Title level={4}>已选课程</Title>
              {selectedCourses.length > 0 ? (
                selectedCourses.map(c => (
                  <Tag
                    key={c._id}
                    closable
                    onClose={() => handleDeselect(c._id)}
                    className="selected-tag"
                  >
                    {c.code} - {c.name}
                  </Tag>
                ))
              ) : (
                <span className="no-selection">尚未选择课程</span>
              )}
            </div>

            {/* 选择确认弹窗 */}
            <Modal
              open={modalVisible}
              title="确认选择课程"
              onOk={handleOk}
              onCancel={handleCancel}
              okText="确认选择"
              cancelText="取消"
            >
              {modalCourse && (
                <div>
                  <p><strong>代码：</strong>{modalCourse.code}</p>
                  <p><strong>名称：</strong>{modalCourse.name}</p>
                  <p><strong>学分：</strong>{modalCourse.credits}</p>
                </div>
              )}
            </Modal>

            {/* 默认提示 */}
            <div className="placeholder">点击侧边菜单选择课程</div>
            {/* 回到顶部按钮 */}
            <FloatButton.BackTop className="custom-backtop" visibilityHeight={200} />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}
