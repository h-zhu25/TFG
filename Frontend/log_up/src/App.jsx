// src/components/Register.jsx
import React from "react";
import "./app.css";

const Register = () => {
  return (
    <div className="register-container">
      <div className="register-form-wrapper">
        <h2>注册</h2>
        <form className="register-form">
          <input type="text" placeholder="用户名" required />
          <input type="email" placeholder="邮箱" required />
          <input type="password" placeholder="密码" required />
          <input type="password" placeholder="确认密码" required />
          <button type="submit">注册</button>
        </form>
      </div>
    </div>
  );
};

export default Register;
