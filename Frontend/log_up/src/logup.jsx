import React, { useState } from "react";
import axios from "axios";
import { Button, Modal } from "antd";
import "antd/dist/reset.css";
import "./logup.css";
import "antd/dist/reset.css";
import { useNavigate } from "react-router-dom";

const Register = () => {
  // 用来控制角色和弹窗显示状态
  const [role, setRole] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);

  // 注册表单数据状态
  const [userData, setUserData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    teacherID: "",
    studentID: "",
    grade: ""
  });

  const navigate = useNavigate();

  const roleNameMap = {
    admin: "Administrador / Administradora",
    teacher: "Profesor / Profesora",
    student: "Estudiante"
  };

  // 处理输入框内容的变化
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // 选择角色并弹出注册表单的 Modal
  const handleRegister = (selectedRole) => {
    setRole(selectedRole);
    setIsModalVisible(true);
    console.log(`注册账户：${selectedRole}`);
  };

  // 提交注册表单
  const handleConfirmRegistration = async (event) => {
    event.preventDefault();

    if (userData.password !== userData.confirmPassword) {
      alert("¡Las contraseñas no coinciden, por favor verifica!");
      return;
    }

    const payload = {
      email: userData.email,
      username: userData.username,
      name: userData.username,
      password: userData.password,
      role: role
    };

    if (role === "teacher") {
      payload.teacherID = userData.teacherID;
    } else if (role === "student") {
      payload.studentID = userData.studentID;
      payload.grade = userData.grade;
    }

    try {
      const response = await axios.post("http://localhost:4000/api/users/register", payload);
      if (response.status === 201) {
        alert("¡Registro exitoso!");
        console.log(response.data);
        setIsModalVisible(false);
        setIsModalVisible(false);
        navigate("/login");
      }
    } catch (error) {
      console.error("注册失败：", error);
      alert("Registro fallido. Por favor, verifica la información ingresada o inténtalo de nuevo más tarde.");
    }
  };

  return (
    <div className="register-container">
      <video className="background-video" autoPlay loop muted>
        <source src="/videos/BackgroundVideo.mp4" type="video/mp4" />
        您的浏览器不支持该视频标签。
      </video>

      <div className="welcome-message">
        Bienvenido a ETSISI Sistema de Selección de Cursos
      </div>

      {/* 角色按钮独立放置，当点击时弹出相应的注册 Modal */}
      <div className="role-buttons">
        <Button type="primary" onClick={() => handleRegister("admin")}>
          Administrador / Administradora
        </Button>
        <Button type="primary" onClick={() => handleRegister("teacher")}>
          Profesor / Profesora
        </Button>
        <Button type="primary" onClick={() => handleRegister("student")}>
          Estudiante
        </Button>
      </div>

      {/* 弹出框 Modal 内部包含注册表单 */}
      <Modal
        visible={isModalVisible}
        title={role ? `${roleNameMap[role]} Registrarse` : "Registrarse"}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        centered
      >
        <div className="register-form-wrapper">
          <form id="registerForm" className="register-form" onSubmit={handleConfirmRegistration}>
            <input
              type="text"
              name="username"
              placeholder="Usuario"
              required
              onChange={handleInputChange}
            />
            <input
              type="email"
              name="email"
              placeholder="Correo electrónico"
              required
              onChange={handleInputChange}
            />
            <input
              type="password"
              name="password"
              placeholder="Contraseña"
              required
              onChange={handleInputChange}
            />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirmar contraseña"
              required
              onChange={handleInputChange}
            />

            {/* 根据不同角色显示额外输入项 */}
            {role === "teacher" && (
              <input
                type="text"
                name="teacherID"
                placeholder="ProfesorID"
                required
                onChange={handleInputChange}
              />
            )}

            {role === "student" && (
              <>
                <input
                  type="text"
                  name="studentID"
                  placeholder="EstudianteID"
                  required
                  onChange={handleInputChange}
                />
                <input
                  type="text"
                  name="grade"
                  placeholder=""
                  required
                  onChange={handleInputChange}
                />
              </>
            )}

            <Button type="primary" htmlType="submit" className="big-button">
              Confirmar registro
            </Button>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default Register;
