import {
  LockOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  LoginFormPage,
  ProConfigProvider,
  ProFormText,
} from '@ant-design/pro-components';
import { Button, Divider, Space, Tabs, message, theme } from 'antd';
import { useState } from 'react';
import './App.css';
import etsisiLogo from './assets/ETSISI_logo.png';
import customLogo from './assets/ETSISI_logo2.png';
import customLogo2 from './assets/UPM_logo.png';
import { Tag } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

// 全局配置 message，使其在页面顶部显示
message.config({
  top: 80,      // 弹窗距离页面顶部 100px
  duration: 2,   // 持续时间为2秒
  maxCount: 1,   // 同一时间最多显示1个弹窗
});

const App = () => {
  const [loginType, setLoginType] = useState('account');
  // 新增状态变量控制登录表单的显示与隐藏
  const [showLoginForm, setShowLoginForm] = useState(false);
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const location = useLocation();
  // 1. 使用 message.useMessage() 获取 messageApi
  const [messageApi, contextHolder] = message.useMessage();

  // 点击登录跳转至路由/login
  useEffect(() => {
    if (location.pathname === '/login') {
      setShowLoginForm(true);
    }
  }, [location]);

  // 连接后端调取函数以及错误信息弹窗
  const handleLogin = async (values) => {
    console.log('提交的表单数据：', values);
    try {
      const response = await fetch('http://localhost:4000/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      console.log('响应状态：', response.status);
      const data = await response.json();
      console.log('响应数据：', data);

      if (!response.ok) {
        // 登录失败，展示错误信息
        messageApi.error(data.message || '¡Inicio de sesión fallido!');
        return;
      }

      // 登录成功，保存 token 并解析角色
      const { token: jwtToken } = data;
      localStorage.setItem('token', jwtToken);
      let userRole = '';
      try {
        // 简单解析 JWT 获取角色
        const payload = JSON.parse(atob(jwtToken.split('.')[1]));
        userRole = payload.role;
      } catch (e) {
        console.error('解析 token 时出错：', e);
      }
      localStorage.setItem('role', userRole);

      // 根据角色跳转
      if (userRole === 'admin') {
        messageApi.success('¡Bienvenido, Administrador!');
        navigate('/login/admin', { replace: true });
      } else if (userRole === 'teacher') {
        messageApi.success('¡Bienvenido, Profesor!');
        navigate('/login/teacher', { replace: true });
      } else if (userRole === 'student') {
        messageApi.success('¡Bienvenido, Estudiante!');
        navigate('/login/student', { replace: true });
      } else {
        messageApi.success('¡Inicio de sesión exitoso!');
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      console.error('登录请求错误：', error);
      messageApi.error('Error de red, ¡por favor intenta de nuevo más tarde!');
    }
  };
  
  // 主界面的所有组件代码
  return (
    <ProConfigProvider dark>
      {contextHolder}
      <div style={{ backgroundColor: 'white', height: '100%' }}>
        <LoginFormPage
          
          onFinish={handleLogin}

          // 自带LOGIN IN按钮的样式修改代码
          submitter={{
            render: (_, dom) => {
              // showLoginForm 为 true 时显示提交按钮，否则不显示
              return showLoginForm ? dom : null;
            },
            searchConfig: {
              submitText: 'LOG IN',
            },
            resetButtonProps: false,
          }}
          
          // 去掉默认的 Logo
          logo={null}
          
          // 登录组件的代码
          title={
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* 1. 这一行用来放 Logo 和主标题并排 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12}}>
                <img
                  src={etsisiLogo}
                  alt="ETSISI"
                  style={{ width: 200, height: 'auto' }}
                />
                <h1 style={{ margin: 10, fontSize: 40, color: '#fff' }}>
                  ETSISI
                </h1>
              </div>
        
              {/* 2. 副标题放在下一行，并加大字号、增加 marginTop */}
              <p style={{ marginTop: 16, fontSize: 20, color: '#fff' }}>
                Sistema de selección de cursos del campus
              </p>
            </div>
          }
          
          // 背景视频代码
            backgroundVideoUrl="/videos/BackgroundVideo.mp4"
            containerStyle={{
              backgroundColor: 'rgba(20, 19, 19, 0.25)',
              backdropFilter: 'blur(1px)',
            }}

          // 注册组件代码
          activityConfig={{
            className: 'custom-activity-block',
            style: {
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 0 8px rgba(0, 0, 0, 0.2)',
              color: '#fff',
              borderRadius: '8px',
              backgroundColor: 'rgba(255,255,255,0.05)',
            },
            // 注册界面标题
            title: (
              <Tag
                color="blue"
                style={{
                  fontSize: '25px',
                  fontWeight: 'bold',
                  padding: '15px 20px',
                  borderRadius: '20px',
                }}
              >
                ¡Regístrate ahora!
              </Tag>
            ),
            subTitle: 'Registro de profesores, estudiantes y administradores',
            action: (
              // 注册界面按钮
              <Button
                className="hover-animate-button"
                size="large"
                style={{
                  borderRadius: '20px',
                  width: 120,
                  fontWeight: 'bold',
                }}
                onClick={() => navigate('/register')}
              >
                SIGN UP
              </Button>
            ),
          }}

          // 登录组件下面两个图标的代码
          actions={
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column',
              }}
            >
            {/* 两个图标的样式 */}
              {/* 图标和上方内容分割线 */}
              <Divider plain>
                <span
                  style={{
                    color: token.colorTextPlaceholder,
                    fontWeight: 'normal',
                    fontSize: 14,
                  }}
                >
                </span>
              </Divider>

              <Space align="center" size={24}>
                <div
                  style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: 60,
                        width: 60,
                        border: '1px solid ' + token.colorPrimaryBorder,
                        borderRadius: '50%',
                        overflow: 'hidden',
                  }}
                >
                    <img
                      src={customLogo}
                      alt="customLogo"
                      style={{ width: '100%', height: '100%' }} /* 图标大小调整 */
                    />
                </div>

                <div
                  style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: 60,
                        width: 60,
                        border: '1px solid ' + token.colorPrimaryBorder,
                        borderRadius: '50%',
                        overflow: 'hidden',
                  }}
                >
                    <img
                      src={customLogo2}
                      alt="customLogo2"
                      style={{ width: '100%', height: '100%' }} /* 图标大小调整 */
                    />
                </div>
              </Space>
            </div>
          }
          
          // 登录选项代码
          >
          <Tabs
            centered
            activeKey={loginType}
            onChange={(activeKey) => setLoginType(activeKey)}
          >
          <Tabs.TabPane
            key="account"
            tab={
              <span style={{ fontSize: '15px', color: '#1E90FF', fontWeight: 'bold' }}>
                Inicio de sesión con cuenta y contraseña
              </span>
              }
            />
          </Tabs>
          
          {/* 自带的登录组件框详细代码 */}
          {loginType === 'account' && (
            <>
            {showLoginForm ? (
              <div className="fade-in">
              <ProFormText
                name="email"
                fieldProps={{
                size: 'large',
                prefix: <UserOutlined />,
                }}
              placeholder="Usuario: "
              rules={[{ required: true, message: 'Por favor, ingrese el nombre de usuario!' }]}
            />
            <ProFormText.Password
              name="password"
              fieldProps={{
                size: 'large',
                prefix: <LockOutlined />,
              }}
              placeholder="Contraseña: "
              rules={[{ required: true, message: 'Por favor, ingrese la contraseña!' }]}
            />
            </div>
            ) 
            : (
            <Button
              className="hover-animate-button"
              size="large"
              style={{
                borderRadius: '20px',
                width: 120,
                fontWeight: 'bold',
              }}
              onClick={() => navigate('/login')}
            >
              LOG IN
            </Button>
              )}
              </>
          )}

        </LoginFormPage>
      </div>
    </ProConfigProvider>
  );
};

export default App;