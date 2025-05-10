import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { UserOutlined } from '@ant-design/icons';
import {
  Layout,
  Menu,
  Avatar,
  theme,
  Card,
  Descriptions,
  Divider,
  Typography,
  Table,
  Button,
  message,
} from 'antd';
import AddCourseModal from './addCourseModal';
import './adminPage.css';
import logoImg from './assets/ETSISI_logo2.png';
import { useNavigate } from 'react-router-dom';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [grados, setGrados] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedGradoId, setSelectedGradoId] = useState(null);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const token = localStorage.getItem('token');

  // 退出登录
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate(-1);
  };

  // 拉取用户信息
  useEffect(() => {
    if (!token) return;
    try {
      const { role } = jwtDecode(token);
      if (role === 'admin') {
        fetch('http://localhost:4000/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then(res => (res.ok ? res.json() : Promise.reject('Error al obtener la información del usuario')))
          .then(data => setUser(data.user))
          .catch(console.error);
      }
    } catch (err) {
      console.error('无效的 token:', err);
    }
  }, [token]);

  // 拉取所有 Grados
  useEffect(() => {
    if (!token) return;
    fetch('http://localhost:4000/api/grados', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => (res.ok ? res.json() : Promise.reject('Error al obtener los grados')))
      .then(data => setGrados(data))
      .catch(console.error);
  }, [token]);

  // 拉取所有 Courses
  useEffect(() => {
    if (!token) return;
    fetch('http://localhost:4000/api/courses', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => (res.ok ? res.json() : Promise.reject('Error al obtener los cursos')))
      .then(data => setCourses(data))
      .catch(console.error);
  }, [token]);

  // 构造侧边菜单
  const menuItems = grados.map(grado => {
    const related = courses.filter(course =>
      course.grados.some(g => g._id === grado._id)
    );

    const sem1 = related
      .filter(c => c.semester === 1)
      .map(c => ({ key: `${grado._id}-1-${c._id}`, label: `${c.code} - ${c.name}` }));

    const sem2 = related
      .filter(c => c.semester === 2)
      .map(c => ({ key: `${grado._id}-2-${c._id}`, label: `${c.code} - ${c.name}` }));

    return {
      key: grado._id,
      icon: <UserOutlined />,
      label: grado.name,
      children: [
        { key: `${grado._id}-sem1`, label: 'Semestre 1', children: sem1.length ? sem1 : [{ key: `${grado._id}-1-empty`, label: 'Sin cursos' }] },
        { key: `${grado._id}-sem2`, label: 'Semestre 2', children: sem2.length ? sem2 : [{ key: `${grado._id}-2-empty`, label: 'Sin cursos' }] },
      ],
    };
  });

  // 侧边菜单点击处理
  const handleMenuClick = e => {
    const parts = e.key.split('-');
    const gradoId = parts[0];
    setSelectedGradoId(gradoId);
    const courseId = parts[2];
    if (courseId) {
      const course = courses.find(c => c._id === courseId);
      setSelectedCourse(course || null);
    } else {
      setSelectedCourse(null);
    }
  };

  // 子菜单展开时选中对应 grado
  const handleOpenChange = openKeys => {
    const last = openKeys[openKeys.length - 1];
    setSelectedGradoId(last || null);
  };

  // 打开/关闭添加课程模态框
  const handleOpenAddModal = () => {
    if (!selectedGradoId) {
      message.warning('Por favor, seleccione una carrera primero');
      return;
    }
    setIsAddModalVisible(true);
  };
  const handleCloseAddModal = () => setIsAddModalVisible(false);

  // 添加课程后更新列表并关闭模态框
  const handleCourseAdded = newCourse => {
    setCourses(prev => [...prev, newCourse]);
    setIsAddModalVisible(false);
  };

  return (
    <Layout style={{ '--bg-container': colorBgContainer, '--border-radius-lg': borderRadiusLG }} className="app-layout">
      <Header className="app-header">
        <div className="logo-img"><img src={logoImg} alt="Logo" /></div>
        <div className="main-title">Sistema del Administrador</div>
        {user && (
          <div className="user-info">
            <Avatar size="large" icon={<UserOutlined />} />
            <div className="user-details">
              <div className="user-name">{user.name}</div>
              <Button type="link" className="logout-btn" onClick={handleLogout} style={{ marginLeft: 16 }}>Cerrar sesión</Button>
            </div>
          </div>
        )}
      </Header>

      <Layout className="app-body">
        <Sider className="app-sider" style={{ background: colorBgContainer }}>
          <Button
            type="primary"
            ghost
            size="middle"                  // 小号按钮
            style={{ margin: '14px', width: 150 }}  // 固定 100px 宽度
            onClick={handleOpenAddModal}
            disabled={!selectedGradoId}
          >
            Agregar curso
         </Button>
          <Menu
            mode="inline"
            items={menuItems}
            onClick={handleMenuClick}
            onOpenChange={handleOpenChange}
            style={{ height: '100%', borderRight: 0 }}
          />
        </Sider>

        <Layout className="app-content-wrapper">
          <Content className="app-content">
            {selectedCourse ? (
              <Card
                  className="course-card"
                  title={`${selectedCourse.code} – ${selectedCourse.name}`}
                  bordered={false}
                  extra={
                    <Button
                      danger
                      onClick={async () => {
                        if (!window.confirm('¿Seguro que quieres eliminar este curso?')) return;
                        try {
                          const res = await fetch(
                            `http://localhost:4000/api/courses/${selectedCourse._id}`,
                            {
                              method: 'DELETE',
                              headers: { Authorization: `Bearer ${token}` },
                            }
                          );
                          if (!res.ok) throw new Error();
                          setCourses(prev => prev.filter(c => c._id !== selectedCourse._id));
                          setSelectedCourse(null);
                          message.success('Curso eliminado correctamente');
                        } catch {
                          message.error('No se pudo eliminar el curso');
                        }
                      }}
                    >
                      Eliminar curso
                    </Button>
                  }
                >
                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label="Código">{selectedCourse.code}</Descriptions.Item>
                  <Descriptions.Item label="Nombre">{selectedCourse.name}</Descriptions.Item>
                  <Descriptions.Item label="Cuatrimestre">{selectedCourse.cuantrimestre}</Descriptions.Item>
                  <Descriptions.Item label="Semestre">{selectedCourse.semester}</Descriptions.Item>
                  <Descriptions.Item label="Créditos">{selectedCourse.credits}</Descriptions.Item>
                  <Descriptions.Item label="Prioridad">{selectedCourse.priority}</Descriptions.Item>
                  <Descriptions.Item label="Electiva">{selectedCourse.isSpecialElective ? 'Sí' : 'No'}</Descriptions.Item>
                </Descriptions>

                <Divider />

                <Title level={4}>Horarios</Title>
                <Table
                  dataSource={
                    selectedCourse.classTime.map((ct, idx) => ({
                      key: idx,
                      día: ct.day,
                      inicio: ct.start,
                      fin: ct.end,
                      grupo: ct.group,
                      aula: ct.classroom,  
                      profesor: ct.teacher?.name || '—',
                    }))
                  }
                  columns={[
                    { title: 'Día', dataIndex: 'día', key: 'día' },
                    { title: 'Inicio', dataIndex: 'inicio', key: 'inicio' },
                    { title: 'Fin', dataIndex: 'fin', key: 'fin' },
                    { title: 'Aula', dataIndex: 'aula', key: 'aula' },
                    { title: 'Grupo', dataIndex: 'grupo', key: 'grupo' },
                    { title: 'Profesor', dataIndex: 'profesor', key: 'profesor' },
                  ]}
                  pagination={false}
                  size="small"
                  bordered
                />
              </Card>
            ) : (
              <div style={{ textAlign: 'center', color: '#888', padding: '40px' }}>
                Por favor, selecciona un curso para ver los detalles。
              </div>
            )}
          </Content>
        </Layout>
      </Layout>

      <AddCourseModal
        visible={isAddModalVisible}
        onCancel={handleCloseAddModal}
        onCourseAdded={handleCourseAdded}
        selectedGradoId={selectedGradoId}
        token={token}
      />
    </Layout>
  );
}