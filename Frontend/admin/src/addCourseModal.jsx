// src/components/AddCourseModal.jsx
import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Button,
  Checkbox,
  Space,
  message,
  Select
} from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

const AddCourseModal = ({
  visible,
  token,
  grados,                 // ← 父组件传入的所有 grado 列表
  selectedGradoId,        // ← 可选，用于默认选中
  onCancel,
  onCourseAdded
}) => {
  const [form] = Form.useForm();
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    // 加载所有教师供下拉选择
    axios
      .get('http://localhost:4000/api/users?role=teacher', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setTeachers(res.data))
      .catch(err => message.error(err.message));
  }, [token]);

  const handleFinish = async (values) => {
    const gradoIds = values.grados.map(id => id.toString());
    const payload = {
      code: values.code.trim(),
      name: values.name.trim(),
      cuantrimestre: values.cuantrimestre.trim(),
      semester: values.semester,
      credits: values.credits,
      priority: values.priority,
      isSpecialElective: values.isSpecialElective,
      // 顶层关联所有选中的 grados
      grados: gradoIds,
      classTime: values.classTime.map(slot => ({
        day:       slot.day.trim(),
        start:     slot.start,
        end:       slot.end,
        classroom: slot.classroom.trim(),
        group:     slot.group?.trim() || '',
        teacher:   slot.teacher,
      }))
    };

    try {
      const res = await axios.post(
        'http://localhost:4000/api/courses',
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onCourseAdded(res.data);
      window.location.reload();
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      if (msg.includes('E11000') || msg.includes('duplicate key')) {
        form.setFields([{ name: 'code', errors: ['El código del curso ya existe'] }]);
      } else {
        message.error(msg);
      }
    }
  };

  return (
    <Modal
      title="Agregar curso"
      visible={visible}
      onCancel={() => { form.resetFields(); onCancel(); }}
      footer={null}
      destroyOnClose
      width={1300}
      bodyStyle={{ maxHeight: '80vh', overflowY: 'auto' }} // （可选）让内容区在太高时滚动
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          priority: 4,
          isSpecialElective: false,
          classTime: [{ day: '', start: '', end: '', classroom: '', group: '', teacher: '' }],
          // 如果有初始选中的 grado，就默认带入
          grados: selectedGradoId ? [selectedGradoId] : []
        }}
      >
        {/* 新增：Grados 多选 */}
        <Form.Item
          name="grados"
          label="Grados"
          rules={[{ required: true, message: 'Por favor, seleccione al menos un grado' }]}
        >
          <Select mode="multiple" placeholder="Seleccione grados">
            {grados.map(g => (
              <Option
                key={g._id}
                /** 强制取 `.toString()`，确保是纯字符串 **/
                value={g._id.toString()}
              >
                {g.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="code"
          label="Código del curso"
          rules={[{ required: true, message: 'Por favor, ingrese el código del curso' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="name"
          label="Nombre del curso"
          rules={[{ required: true, message: 'Por favor, ingrese el nombre del curso' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="cuantrimestre"
          label="Año académico - semestre (ej. 2025-1)"
          rules={[{ required: true, message: 'Por favor, ingrese el año académico y semestre' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="semester"
          label="Semestre"
          rules={[{ required: true, message: 'Por favor, seleccione el semestre' }]}
        >
          <Select placeholder="Seleccione semestre">
            <Option value={1}>1</Option>
            <Option value={2}>2</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="credits"
          label="Créditos"
          rules={[{ required: true, message: 'Por favor, ingrese los créditos' }]}
        >
          <InputNumber min={1} />
        </Form.Item>

        <Form.Item
          name="priority"
          label="Prioridad"
          rules={[{ required: true, message: 'Por favor, ingrese la prioridad' }]}
        >
          <InputNumber min={1} max={5} />
        </Form.Item>

        <Form.Item name="isSpecialElective" valuePropName="checked">
          <Checkbox>Electivo especial</Checkbox>
        </Form.Item>

        {/* 课程时段列表 */}
        <Form.List name="classTime">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...rest }) => (
                <Space key={key} align="baseline" style={{ display: 'flex', marginBottom: 8 }}>
                  <Form.Item
                    {...rest}
                    name={[name, 'day']}
                    rules={[{ required: true, message: 'Seleccione el día' }]}
                  >
                    <Select placeholder="Día">
                      <Option value="Lunes">Lunes</Option>
                      <Option value="Martes">Martes</Option>
                      <Option value="Miércoles">Miércoles</Option>
                      <Option value="Jueves">Jueves</Option>
                      <Option value="Viernes">Viernes</Option>
                    </Select>
                  </Form.Item>
                  
                  <Form.Item
                    {...rest}
                    name={[name, 'start']}
                    rules={[{ required: true, message: 'Ingrese hora de inicio' }]}
                  >
                    <Input type="time" />
                  </Form.Item>

                  <Form.Item
                    {...rest}
                    name={[name, 'end']}
                    rules={[{ required: true, message: 'Ingrese hora de fin' }]}
                  >
                    <Input type="time" />
                  </Form.Item>

                  <Form.Item
                    {...rest}
                    name={[name, 'classroom']}
                    rules={[{ required: true, message: 'Ingrese aula' }]}
                  >
                    <Input placeholder="Aula" />
                  
                  </Form.Item>

                  <Form.Item
                    {...rest}
                    name={[name, 'group']}
                    rules={[
                      { required: true, message: 'Por favor, ingresa el grupo' }
                    ]}
                  >
                    <Input placeholder="Grupo" />
                  </Form.Item>

                  <Form.Item
                    {...rest}
                    name={[name, 'teacher']}
                    rules={[{ required: true, message: 'Seleccione un profesor' }]}
                  >
                    <Select
                      showSearch
                      placeholder="Seleccione profesor"
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        option.children.toLowerCase().includes(input.toLowerCase())
                      }
                    >
                      {teachers.map(t => (
                        <Option key={t._id} value={t._id}>
                          {t.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                {/* —— 新增 —— */}
                  <Form.Item
                  >
                    <Select mode="multiple" placeholder="Seleccione grados">
                      {grados.map(g => (
                        <Option key={g._id} value={g._id.toString()}>
                          {g.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                          
                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}
              <Form.Item>
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  Añadir horario
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            Enviar
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddCourseModal;
