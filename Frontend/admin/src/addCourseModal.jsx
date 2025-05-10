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
  selectedGradoId,
  onCancel,
  onCourseAdded
}) => {
  const [form] = Form.useForm();
  const [teachers, setTeachers] = useState([]);

  // 拉取教师列表
  useEffect(() => {
    if (!visible || !token) return;
    axios
      .get('http://localhost:4000/api/users?role=teacher', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setTeachers(res.data))
      .catch(() => message.error('No se pudo cargar la lista de docentes'));
  }, [visible, token]);
  
  

  const handleFinish = async (values) => {
    const payload = {
      code: values.code.trim(),
      name: values.name.trim(),
      cuantrimestre: values.cuantrimestre.trim(),
      semester: values.semester,
      credits: values.credits,
      priority: values.priority,
      isSpecialElective: values.isSpecialElective,
      grados: [selectedGradoId],
      classTime: values.classTime.map(slot => ({
        day:       slot.day.trim(),
        start:     slot.start,
        end:       slot.end,
        classroom: slot.classroom.trim(),
        group:     slot.group?.trim() || '',
        teacher:   slot.teacher,       // 这里是 _id
        grados:    [selectedGradoId]
      }))
    };

    try {
      const res = await axios.post(
        'http://localhost:4000/api/courses',
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onCourseAdded(res.data);
      form.resetFields();
      onCancel();
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      if (msg.includes('E11000') || msg.includes('duplicate key')) {
        form.setFields([{ name: 'code', errors: ['El código del curso ya existe'] }]);
      } else {
        message.error('Error al agregar el curso, por favor verifique la información e inténtelo de nuevo');
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
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          priority: 4,
          isSpecialElective: false,
          classTime: [{ day: '', start: '', end: '', classroom: '', group: '', teacher: '' }]
        }}
      >
        <Form.Item name="code" label="Código del curso" rules={[{ required: true, message: 'Por favor, ingrese el código del curso' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="name" label="Nombre del curso" rules={[{ required: true, message: '请Por favor, ingrese el nombre del curso' }]}>
          <Input />
        </Form.Item>
        <Form.Item
          name="cuantrimestre"
          label="Año académico - semestre (por ejemplo, 2025-1)"
          rules={[{ required: true, message: 'Por favor, ingrese el año académico y el semestre' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="semester"
          label="Semestre (1 o 2)"
          rules={[{ required: true, message: 'Por favor, seleccione el semestre' }]}
        >
          <InputNumber min={1} max={2} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name="credits"
          label="Créditos"
          rules={[{ required: true, message: 'Por favor, ingrese los créditos' }]}
        >
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name="priority"
          label="Prioridad （1~4）"
          rules={[{ required: true, message: 'Por favor, ingrese la prioridad' }]}
        >
          <InputNumber min={1} max={4} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="isSpecialElective" valuePropName="checked">
          <Checkbox>¿Es un curso optativo?</Checkbox>
        </Form.Item>

        <Form.List name="classTime">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...rest }) => (
                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item
                    {...rest}
                    name={[name, 'day']}
                    rules={[{ required: true, message: 'Por favor, ingrese el día de la semana' }]}
                  >
                    <Input placeholder="Day (e.g. Mon)" />
                  </Form.Item>
                  <Form.Item
                    {...rest}
                    name={[name, 'start']}
                    rules={[
                      { required: true, message: 'Por favor, ingrese la hora de inicio' },
                      { pattern: /^([01]\d|2[0-3]):[0-5]\d$/, message: 'Formato HH:mm' }
                    ]}
                  >
                    <Input placeholder="Start (HH:mm)" />
                  </Form.Item>
                  <Form.Item
                    {...rest}
                    name={[name, 'end']}
                    rules={[
                      { required: true, message: 'Por favor, ingrese la hora de finalización' },
                      { pattern: /^([01]\d|2[0-3]):[0-5]\d$/, message: 'Formato HH:mm' }
                    ]}
                  >
                    <Input placeholder="End (HH:mm)" />
                  </Form.Item>
                  <Form.Item
                    {...rest}
                    name={[name, 'classroom']}
                    rules={[{ required: true, message: 'Por favor, ingrese el aula' }]}
                  >
                    <Input placeholder="Classroom" />
                  </Form.Item>
                  <Form.Item
                    {...rest}
                    name={[name, 'group']}
                  >
                    <Input placeholder="Group (Opcional)" />
                  </Form.Item>
                  <Form.Item
                    {...rest}
                    name={[name, 'teacher']}
                    rules={[{ required: true, message: 'Por favor, seleccione un profesor' }]}
                  >
                    <Select
                      showSearch
                      placeholder="seleccione un profesor"
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
                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}
              <Form.Item>
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                Agregar horario
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
