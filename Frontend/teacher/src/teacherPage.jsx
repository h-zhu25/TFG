// teacher/src/teacherPage.jsx
import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Typography, message ,Button} from 'antd';
import { UserOutlined, LogoutOutlined} from '@ant-design/icons';
import CourseList from './CourseList';
import StudentList from './StudentList';
import './teacherPage.css';
import logoImg from './assets/ETSISI_logo2.png'; // 与 adminPage 使用同一 Logo
import { useNavigate } from 'react-router-dom'; 

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

export default function TeacherPage() {
  const [profile, setProfile]       = useState(null);
  const [courses, setCourses]       = useState([]);
  const [selectedCourse, setCourse] = useState(null);
  const [students, setStudents]     = useState([]);
  const token                         = localStorage.getItem('token');

  const navigate = useNavigate();    // <-- 声明路由导航

 // 登出处理：清空 token 并跳回登录页
  const handleLogout = () => {
   localStorage.removeItem('token');
    navigate('/login', { replace: true });
  };

  // 获取 profile + 课程列表
  useEffect(() => {
    if (!token) return;
    fetch('/api/users/profile', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(user => {
        setProfile(user);
        return fetch(`/api/teachers/${user._id}/courses`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      })
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(setCourses)
      .catch(() => message.error('Error al cargar asignaturas'));
  }, [token]);

  // 获取某门课学生列表
  useEffect(() => {
    if (!profile || !selectedCourse) return;
    fetch(
      `/api/teachers/${profile._id}/students/${selectedCourse._id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(setStudents)
      .catch(() => message.error('Error al cargar estudiantes'));
  }, [profile, selectedCourse, token]);

  // 构造侧边栏菜单
  const menuItems = courses.map(c => ({
    key: c._id,
    label: `${c.code} — ${c.name}`
  }));

  return (
    <Layout className="app-layout">
      <Header className="app-header">
        <div className="logo">
          <img src={logoImg} alt="Logo" />
          <span className="title">Panel de Profesor</span>
        </div>
        {profile && (
          <div className="user-info">
            <Avatar icon={<UserOutlined />} />
            <span className="user-name">{profile.name}</span>
            <Button
             type="link"
             icon={<LogoutOutlined />}
             onClick={handleLogout}
             style={{ color: '#fff', marginLeft: 16 }}
           >
             Exit
           </Button>
          </div>
        )}
      </Header>

      <Layout className="app-body">
        <Sider width={280} className="app-sider" theme="light">
          <Title level={5} style={{ padding: '16px' }}>Mis asignaturas</Title>
          <Menu
            mode="inline"
            items={menuItems}
            selectedKeys={selectedCourse ? [selectedCourse._id] : []}
             onClick={e => {                          
              if (selectedCourse?._id === e.key) {
                setCourse(null);
              } else {
                setCourse(courses.find(c => c._id === e.key));
              }
            }}
          />
        </Sider>

        <Layout className="app-content-wrapper">
          <Content className="app-content">
            {!selectedCourse ? (
              <div className="empty-state">
                Por favor, seleccione un curso para ver la lista de estudiantes.
              </div>
            ) : (
              <>
                <Title className="course-title" level={4}>
                  {selectedCourse.code} — {selectedCourse.name}
                </Title>
                <StudentList course={selectedCourse} students={students} />
              </>
            )}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}
