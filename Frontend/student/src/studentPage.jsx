// src/studentPage.jsx
import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
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
  theme,
  Spin,
  Alert,
  Pagination,
  message,
} from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './studentPage.css';
import './TimetableGrid.css';
import TimetableGrid from './TimetableGrid.jsx';
import logoImg from './assets/ETSISI_logo2.png';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

export default function StudentPage() {
  // — Estados originales —
  const [usuario, setUsuario] = useState(null);
  const [especialidades, setEspecialidades] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [cursoModal, setCursoModal] = useState(null);
  const [cursosSeleccionados, setCursosSeleccionados] = useState([]);

  // — Estados nuevos: resultados y UI —
  const [horarios, setHorarios] = useState([]);
  const [noRecomendados, setNoRecomendados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  // — Paginación de propuestas —
  const [page, setPage] = useState(1);
  const pageSize = 1;
  const maxPropuestas = 15;

  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // 处理取消选课：调用后端并更新本地 state
  const handleRemoveCourse = async courseId => {
    try {
      await axios.delete(
        'http://localhost:4000/api/users/select-courses',
        {
          headers: { Authorization: `Bearer ${token}` },
          data:    { selectedCourses: [courseId] },
        }
      );
      setCursosSeleccionados(prev =>
        prev.filter(c => c._id !== courseId)
      );
      message.success('Curso eliminado de tu selección');
      generarHorarios();
    } catch (err) {
      console.error(err);
      message.error('No se pudo eliminar el curso. Intenta de nuevo.');
    }
  };

  // 1. Verificar token y obtener perfil
  useEffect(() => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const { role } = jwtDecode(token);
      if (role !== 'student') return navigate('/login', { replace: true });
      fetch('http://localhost:4000/api/users/profile', { headers })
        .then(res => res.ok ? res.json() : Promise.reject())
        .then(setUsuario)
        .catch(() => navigate('/login', { replace: true }));
    } catch {
      navigate('/login', { replace: true });
    }
  }, [token, navigate]);

  // 2. Obtener especialidades y cursos
  useEffect(() => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    fetch('http://localhost:4000/api/grados', { headers })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(setEspecialidades)
      .catch(console.error);
    fetch('http://localhost:4000/api/courses', { headers })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(setCursos)
      .catch(console.error);
  }, [token]);

  // 3. Inicializar selección desde perfil
  useEffect(() => {
    if (
      usuario &&
      cursos.length > 0 &&
      Array.isArray(usuario.selectedCourses)
    ) {
      const inicial = cursos.filter(c =>
        usuario.selectedCourses.includes(c._id)
      );
      setCursosSeleccionados(inicial);
    }
  }, [usuario, cursos]);

  // Construir menú lateral
  const elementosMenu = especialidades.map(e => {
    const relacionados = cursos.filter(c =>
      c.grados.some(g => g._id === e._id)
    );
    const regulares = relacionados.filter(c => !c.isSpecialElective);
    const optativas = relacionados.filter(c => c.isSpecialElective);

    const semestres = [1, 2].map(s => ({
      key: `${e._id}-sem${s}`,
      label: `Semestre ${s}`,
      children: regulares
        .filter(c => c.semester === s)
        .sort((a, b) => a.priority - b.priority)
        .map(c => ({
          key: `${e._id}-sem${s}-${c._id}`,
          label: `${c.code} – ${c.name}`,
        })),
    }));

    return {
      key: e._id,
      icon: <UserOutlined />,
      label: e.name,
      children: [
        ...semestres,
        {
          key: `${e._id}-optativas`,
          label: 'Optativas',
          children: optativas
            .sort((a, b) => a.priority - b.priority)
            .map(c => ({
              key: `${e._id}-optativas-${c._id}`,
              label: `${c.code} – ${c.name}`,
            })),
        },
      ],
    };
  });

  // Handlers de selección
  const manejarClickMenu = ({ key }) => {
    const parts = key.split('-');
    if (parts.length === 3) {
      const curso = cursos.find(c => c._id === parts[2]);
      setCursoModal(curso);
      setModalVisible(true);
    }
  };
  const confirmarSeleccion = () => {
    if (
      cursoModal &&
      !cursosSeleccionados.some(c => c._id === cursoModal._id)
    ) {
      setCursosSeleccionados(prev => [...prev, cursoModal]);
      
    }
    setModalVisible(false);
    setCursoModal(null);
  };
  const cancelarSeleccion = () => setModalVisible(false);

  // 4. Generar propuestas
  const generarHorarios = async () => {
    if (!cursosSeleccionados.length) {
      setError('Debes seleccionar al menos un curso.');
      return;
    }
    setCargando(true);
    setError(null);
    try {
      const resp = await axios.post(
        'http://localhost:4000/api/schedule',
        { selectedCourseIds: cursosSeleccionados.map(c => c._id) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setHorarios(resp.data.schedules);
      setNoRecomendados(resp.data.doNotRecommend);
      setPage(1);
    } catch {
      setError('Error al generar el horario. Por favor, inténtalo de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  // Paginación: solo mostrar hasta maxPropuestas
  const displayHorarios = horarios.slice(0, maxPropuestas);
  const total = displayHorarios.length;
  const propuestaActual = displayHorarios[page - 1];

  return (
    <Layout
      style={{
        '--bg-container': colorBgContainer,
        '--border-radius-lg': borderRadiusLG,
      }}
      className="app-layout"
    >
      <Header className="app-header">
        <div className="logo-img">
          <img src={logoImg} alt="Logo ETSISI" />
        </div>
        <div className="main-title">Sistema de Selección de Cursos</div>
        {usuario && (
          <div className="user-info">
            <Avatar size="large" icon={<UserOutlined />} />
            <span style={{ margin: '0 12px' }}>{usuario.name}</span>
            <Button
              type="link"
              icon={<LogoutOutlined />}
              onClick={() => {
                localStorage.removeItem('token');
                navigate('/login', { replace: true });
              }}
            >
              Cerrar sesión
            </Button>
          </div>
        )}
      </Header>

      <Layout className="app-body">
        <Sider
          className="app-sider"
          style={{ background: colorBgContainer }}
        >
          <Menu
            mode="inline"
            items={elementosMenu}
            onClick={manejarClickMenu}
            style={{ height: '100%', borderRight: 0 }}
          />
        </Sider>

        <Layout className="app-content-wrapper">
          <Content className="app-content">
            {/* Cursos seleccionados */}
            <div className="selected-courses">
              <Title level={4}>Cursos Seleccionados</Title>
              {cursosSeleccionados.length ? (
                cursosSeleccionados.map(c => (
                  <Tag
                    key={c._id}
                    closable
                    onClose={() => handleRemoveCourse(c._id)}
                  >
                    {c.code} – {c.name}
                  </Tag>
                ))
              ) : (
                <span className="no-selection">
                  No has seleccionado ningún curso
                </span>
              )}
            </div>

            <div style={{ margin: '16px 0' }}>
              <Button
                type="primary"
                disabled={cargando || !cursosSeleccionados.length}
                onClick={generarHorarios}
              >
                {cargando ? <Spin /> : 'Generar Horario'}
              </Button>
            </div>

            {error && (
              <Alert
                type="error"
                message={error}
                style={{ marginBottom: 16 }}
              />
            )}

            {noRecomendados.length > 0 && (
              <Tag color="warning" style={{ marginBottom: 16 }}>
                Cursos con conflicto fuerte:{' '}
                {noRecomendados
                  .map(id => {
                    const c = cursos.find(x => x._id === id);
                    return c ? c.code : id;
                  })
                  .join(' • ')}
              </Tag>
            )}

            {/* Paginación de propuestas */}
             {cursosSeleccionados.length > 0 && !cargando && horarios.length > 0 && (
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <Title level={5}>
                  Propuesta {page} de {total}
                </Title>
                <TimetableGrid clases={propuestaActual} />

                <Pagination
                  current={page}
                  pageSize={pageSize}
                  total={total}
                  onChange={p => setPage(p)}
                  showSizeChanger={false}
                  style={{ marginTop: 16 }}
                />
              </div>
            )}
            {cargando && <Spin style={{ marginTop: 24 }} />}

            <Modal
              open={modalVisible}
              title="Confirmar Selección"
              onOk={confirmarSeleccion}
              onCancel={cancelarSeleccion}
              okText="Confirmar"
              cancelText="Cancelar"
            >
              {cursoModal && (
                <div>
                  <p>
                    <strong>Código:</strong> {cursoModal.code}
                  </p>
                  <p>
                    <strong>Nombre:</strong> {cursoModal.name}
                  </p>
                  <p>
                    <strong>Créditos:</strong> {cursoModal.credits}
                  </p>
                </div>
              )}
            </Modal>

           {!cursosSeleccionados.length && !cargando && horarios.length === 0 && (
            <div className="placeholder">
              Haz clic en la barra lateral para añadir cursos
            </div>
           )}
            <FloatButton.BackTop
              className="custom-backtop"
              visibilityHeight={200}
            />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}
