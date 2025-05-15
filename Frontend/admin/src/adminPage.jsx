// src/pages/AdminPage.jsx
import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import {UserOutlined,PlusOutlined,MinusCircleOutlined, LogoutOutlined} from '@ant-design/icons';
import {Layout,Menu,Avatar,theme,Card,Descriptions,Divider,Typography,Table,Button,message,Form,Input,InputNumber,Switch,Space,Select,BackTop} from 'antd';
import AddCourseModal from './addCourseModal';
import './adminPage.css';
import logoImg from './assets/ETSISI_logo2.png';
import { useNavigate } from 'react-router-dom';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;
const { Option } = Select;

export default function AdminPage() {
  

  const [user, setUser] = useState(null);
  const [grados, setGrados] = useState([]);
  const [teachers, setTeachers] = useState([]);            // ← 新增：教师列表
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedGradoId, setSelectedGradoId] = useState(null);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

  // 编辑相关
  const [isEditing, setIsEditing] = useState(false);
  const [editForm] = Form.useForm();
  const {token: { colorBgContainer, borderRadiusLG }} = theme.useToken();
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  // —— 获取当前用户 & 登出 ——  
  useEffect(() => {
    if (!token) return;
    try {
      const { role } = jwtDecode(token);
      if (role === 'admin') {
        fetch('http://localhost:4000/api/users/profile', {headers: { Authorization: `Bearer ${token}` }})
          .then(r => (r.ok ? r.json() : Promise.reject()))
          .then(data => setUser(data))
          .catch(console.error);
      }
    } catch (err) {

     console.error('JWT parse error:', err);
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login', { replace: true });
  };

  // —— 拉取 Grados & 教师 & 课程 ——  
  useEffect(() => {
    if (!token) return;
    fetch('http://localhost:4000/api/grados', {headers: { Authorization: `Bearer ${token}` }})
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(setGrados)
      .catch(console.error);

    // 假设后端提供：GET /api/users?role=teacher
    fetch('http://localhost:4000/api/users?role=teacher', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(data => setTeachers(data))
      .catch(console.error);

    fetch('http://localhost:4000/api/courses', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(setCourses)
      .catch(console.error);
  }, [token]);

  // —— 构造侧边栏菜单 ——  
  const menuItems = grados.map(g => {
    // 1. 找出属于当前 grado 的所有课程
    const related = courses.filter(c =>
      c.grados.some(x => x._id === g._id)
    );

    // 2. 普通课程 vs 选修课程
    const regular = related.filter(c => !c.isSpecialElective);
    const electives = related.filter(c => c.isSpecialElective);

    // 3. 按 semester 分组，并在每组内部按 priority 排序
    const semesters = [1, 2].map(s => {
      const cs = regular
        .filter(c => c.semester === s)
        .sort((a, b) => a.priority - b.priority);
      return {
        key: `${g._id}-sem${s}`,
        label: `Semestre ${s}`,
        children: cs.length
          ? cs.map(c => ({
              key: `${g._id}-${s}-${c._id}`,
              label: `${c.code} - ${c.name}`
            }))
          : [{ key: `${g._id}-${s}-empty`, label: 'Sin cursos' }]
      };
    });

  // 4. 构造选修课菜单
  const electiveMenu = {
    key: `${g._id}-electivas`,
    label: 'Optativa',
    children: electives.length
      ? electives
          .sort((a, b) => a.priority - b.priority)
          .map(c => ({
            key: `${g._id}-electivas-${c._id}`,
            label: `${c.code} - ${c.name}`
          }))
      : [{ key: `${g._id}-electivas-empty`, label: 'Sin electivas' }]
  };

  // 5. 最终返回：grado 顶级菜单项，子节点依次是 Semestre 1、Semestre 2、Electivas
  return {
    key: g._id,
    icon: <UserOutlined />,
    label: g.name,
    children: [...semesters, electiveMenu]
  };
});

  const onMenuClick = e => {
    const [gId, , cId] = e.key.split('-');
    setSelectedGradoId(gId);
    if (cId) {
      setSelectedCourse(courses.find(c => c._id === cId) || null);
      setIsEditing(false);
    } else {
      setSelectedCourse(null);
    }
  };

  // —— 新增课程 ——  
  const openAdd = () => {
    setIsAddModalVisible(true);
  };
  const closeAdd = () => setIsAddModalVisible(false);
  const onCourseAdded = nc => {
    setCourses(cs => [...cs, nc]);
    setIsAddModalVisible(false);
  };

  // —— 删除课程 ——  
  const handleDelete = async () => {
    if (!selectedCourse) return;
    if (!window.confirm('¿Eliminar este curso de este grado?')) return;
    try {
         // 如果课程在多个 grado 下，就只移除该 grado；否则删整条课程
          const url =
            selectedCourse.grados.length > 1
              ? `http://localhost:4000/api/courses/${selectedCourse._id}?grado=${selectedGradoId}`
              : `http://localhost:4000/api/courses/${selectedCourse._id}`;
      
          const res = await fetch(url, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!res.ok) throw new Error();
      
         const data = await res.json();
         if (selectedCourse.grados.length > 1) {
           // 仅移除关联：更新本地 state
           setCourses(cs =>
             cs.map(c => (c._id === data._id ? data : c))
           );
           // 如果移除后，这门课已不属于当前 grado，就取消选择；否则刷新详情
           const stillHas = data.grados.some(g => g._id === selectedGradoId);
           setSelectedCourse(stillHas ? data : null);
           message.success('Curso eliminado de este grado');
         } else {
           // 真删课程
           setCourses(cs =>
             cs.filter(c => c._id !== selectedCourse._id)
           );
           setSelectedCourse(null);
           message.success('Curso eliminado');
         }
        } catch {
          message.error('Error al eliminar');
        }
      };

  // —— 开始编辑：初始化表单 ——  
  const handleStartEdit = () => {
    if (!selectedCourse) return message.warning('Selecciona un curso');
    // 把 selectedCourse 的 classTime 映射成 { day, start, end, classroom, group, teacher: <id>, grados: [<id>] }
    const initSlots = selectedCourse.classTime.map(ts => ({
      day: ts.day,
      start: ts.start,
      end: ts.end,
      classroom: ts.classroom,
      group: ts.group,
      teacher: ts.teacher._id,      // ← 后端要求 ObjectId
      grados: Array.isArray(ts.grados)
      ? ts.grados.map(g => g.toString()) // 确保是 string[] 
      : []  
    }));
    editForm.setFieldsValue({
      code: selectedCourse.code,
      name: selectedCourse.name,
      cuantrimestre: selectedCourse.cuantrimestre,
      semester: selectedCourse.semester,
      credits: selectedCourse.credits,
      priority: selectedCourse.priority,
      isSpecialElective: selectedCourse.isSpecialElective,
      grados: selectedCourse.grados.map(g => g._id.toString()),
      classTime: initSlots
    });
    setIsEditing(true);
  };

  // —— 取消编辑 ——  
  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  // —— 提交保存 ——  
  const handleSaveEdit = async values => {
    try {
      const res = await fetch(
        `http://localhost:4000/api/courses/${selectedCourse._id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(values)
        }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      const updated = await res.json();
      setCourses(cs => cs.map(c => (c._id === updated._id ? updated : c)));
      setSelectedCourse(updated);
      message.success('Curso actualizado');
      setIsEditing(false);
    } catch (err) {
      message.error(`Error: ${err.message}`);
    }
  };

  return (
    <>
    <Layout
      style={{'--bg-container': colorBgContainer,'--border-radius-lg': borderRadiusLG}}
      className="app-layout"
    >
      <Header className="app-header">
        <div className="logo-img">
          <img src={logoImg} alt="Logo" />
        </div>
        <div className="main-title">Sistema del Administrador</div>
        {user && (
          <div className="user-info">
            <Avatar size="large" icon={<UserOutlined />} />
            <span style={{ margin: '0 12px' }}>{user.name}</span>
            <Button
              type="link"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
            >
              Cerrar sesión
            </Button>
          </div>
        )}
      </Header>

      <Layout className="app-body">
        <Sider className="app-sider" style={{ background: colorBgContainer }}>
          <Button
            type="primary"
            ghost
            style={{ margin: 16, width: 140 }}
            onClick={openAdd}
          >
            Agregar curso
          </Button>
          <Menu
            mode="inline"
            items={menuItems}
            onClick={onMenuClick}
            style={{ height: '100%', borderRight: 0 }}
          />
        </Sider>

        <Layout className="app-content-wrapper">
          <Content className="app-content">
            {!selectedCourse ? (
              <div style={{ textAlign: 'center', color: '#888', padding: 40 }}>
                Selecciona un curso para ver detalles
              </div>
            ) : (
              <Card
                title={`${selectedCourse.code} – ${selectedCourse.name}`}
                extra={
                  isEditing ? (
                    <>
                      <Button type="primary" onClick={() => editForm.submit()}>
                        Guardar
                      </Button>
                      <Button style={{ marginLeft: 8 }} onClick={handleCancelEdit}>
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button type="primary" onClick={handleStartEdit}>
                        Editar
                      </Button>
                      <Button danger style={{ marginLeft: 8 }} onClick={handleDelete}>
                        Eliminar curso
                      </Button>
                    </>
                  )
                }
                bordered={false}
              >
                {isEditing ? (

                  <Form form={editForm} layout="vertical" onFinish={handleSaveEdit}>
                    <Form.Item name="grados" label="Grados" rules={[{ required: true, message: 'Por favor, seleccione al menos un grado' }]}>
                      <Select mode="multiple" placeholder="Selecciona grados">
                        {grados.map(g => (
                          <Option key={g._id} value={g._id}>
                            {g.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>

                    {/* —— 课程主字段 —— */}
                    <Form.Item name="code" label="Código" rules={[{ required: true }]}>
                      <Input />
                    </Form.Item>
                    <Form.Item name="name" label="Nombre" rules={[{ required: true }]}>
                      <Input />
                    </Form.Item>
                    <Form.Item
                      name="cuantrimestre"
                      label="Cuatrimestre"
                      rules={[{ required: true }]}
                    >
                      <Input />
                    </Form.Item>
                    <Form.Item name="semester" label="Semestre" rules={[{ required: true }]}>
                      <InputNumber min={1} max={2} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="credits" label="Créditos" rules={[{ required: true }]}>
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="priority" label="Prioridad">
                      <InputNumber min={1} max={4} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item
                      name="isSpecialElective"
                      label="Electiva"
                      valuePropName="checked"
                    >
                      <Switch checkedChildren="Sí" unCheckedChildren="No" />
                    </Form.Item>

                    <Divider />
                    <Title level={5}>Horarios</Title>
                    {/* —— Form.List 编辑时段 —— */}
                    <Form.List name="classTime">
                      {(fields, { add, remove }) => (
                        <>
                          {fields.map(({ key, name, ...restField }) => (
                            <Space
                              key={key}
                              align="baseline"
                              style={{ display: 'flex', marginBottom: 8 }}
                            >
                              <Form.Item
                                {...restField}
                                name={[name, 'day']}
                                label="Día"
                                rules={[{ required: true }]}
                              >
                                <Input placeholder="e.g. Thu" />
                              </Form.Item>
                              <Form.Item
                                {...restField}
                                name={[name, 'start']}
                                label="Inicio"
                                rules={[{ required: true }]}
                              >
                                <Input placeholder="HH:mm" />
                              </Form.Item>
                              <Form.Item
                                {...restField}
                                name={[name, 'end']}
                                label="Fin"
                                rules={[{ required: true }]}
                              >
                                <Input placeholder="HH:mm" />
                              </Form.Item>
                              <Form.Item
                                {...restField}
                                name={[name, 'classroom']}
                                label="Aula"
                                rules={[{ required: true }]}
                              >
                                <Input placeholder="CIC-2" />
                              </Form.Item>
                              <Form.Item
                                {...restField}
                                name={[name, 'group']}
                                label="Grupo"
                              >
                                <Input placeholder="siw33" />
                              </Form.Item>
                              <Form.Item
                                {...restField}
                                name={[name, 'teacher']}
                                label="Profesor"
                                rules={[{ required: true }]}
                              >
                                <Select placeholder="Selecciona profesor">
                                  {teachers.map(t => (
                                    <Option key={t._id} value={t._id}>
                                      {t.name}
                                    </Option>
                                  ))}
                                </Select>
                              </Form.Item>
                              <Form.Item {...restField} name={[name, 'grados']} label="Grados" rules={[{ required: true, message: 'Selecciona al menos un grado' }]} style={{ flex: 1, minWidth: 200 }}>
                                <Select mode="multiple" placeholder="Selecciona grados" style={{ width: 250 }}>
                                  {grados.map(g => (
                                    <Option key={g._id} value={g._id}>
                                      {g.name}
                                    </Option>
                                  ))}
                                </Select>
                              </Form.Item>
                              <MinusCircleOutlined onClick={() => remove(name)} />
                            </Space>
                          ))}
                          <Form.Item>
                            <Button
                              type="dashed"
                              onClick={() => add()}
                              block
                              icon={<PlusOutlined />}
                            >
                              Añadir Horario
                            </Button>
                          </Form.Item>
                        </>
                      )}
                    </Form.List>
                  </Form>
                ) : (
                  <>
                    {/* —— 阅读模式 —— */}
                    <Descriptions bordered column={1} size="small">
                      <Descriptions.Item label="Código">
                        {selectedCourse.code}
                      </Descriptions.Item>
                      <Descriptions.Item label="Nombre">
                        {selectedCourse.name}
                      </Descriptions.Item>
                      <Descriptions.Item label="Cuatrimestre">
                        {selectedCourse.cuantrimestre}
                      </Descriptions.Item>
                      <Descriptions.Item label="Semestre">
                        {selectedCourse.semester}
                      </Descriptions.Item>
                      <Descriptions.Item label="Créditos">
                        {selectedCourse.credits}
                      </Descriptions.Item>
                      <Descriptions.Item label="Prioridad">
                        {selectedCourse.priority}
                      </Descriptions.Item>
                      <Descriptions.Item label="Electiva">
                        {selectedCourse.isSpecialElective ? 'Sí' : 'No'}
                      </Descriptions.Item>
                    </Descriptions>

                    <Divider />
                    <Title level={4}>Horarios</Title>
                    <Table
                      dataSource={selectedCourse.classTime.map((ct, i) => ({
                        key: i,
                        día: ct.day,
                        inicio: ct.start,
                        fin: ct.end,
                        aula: ct.classroom,
                        grupo: ct.group,
                        profesor: ct.teacher.name
                      }))}
                      columns={[{ title: 'Día', dataIndex: 'día', key: 'día' },{ title: 'Inicio', dataIndex: 'inicio', key: 'inicio' },{ title: 'Fin', dataIndex: 'fin', key: 'fin' },{ title: 'Aula', dataIndex: 'aula', key: 'aula' },{ title: 'Grupo', dataIndex: 'grupo', key: 'grupo' },{ title: 'Profesor', dataIndex: 'profesor', key: 'profesor' }
                      ]}
                      pagination={false}
                      size="small"
                      bordered
                    />
                  </>
                )}
              </Card>
            )}
          </Content>
        </Layout>
      </Layout>

      {/* 新增课程弹窗 */}
      <AddCourseModal
        visible={isAddModalVisible}
        onCancel={closeAdd}
        onCourseAdded={onCourseAdded}
        selectedGradoId={selectedGradoId}
        token={token}
        grados={grados}
      />
    </Layout>

     <BackTop
        visibilityHeight={0}
        style={{ right: 40, bottom: 40 }}
        target={() => document.querySelector('.app-sider')}
      />
    </>
  );
}
