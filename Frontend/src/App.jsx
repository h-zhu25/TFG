import {
  LockOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  LoginFormPage,
  ProConfigProvider,
  ProFormCaptcha,
  ProFormCheckbox,
  ProFormText,
} from '@ant-design/pro-components';
import { Button, Divider, Space, Tabs, message, theme } from 'antd';
import { useState } from 'react';
import './App.css';
import etsisiLogo from './assets/ETSISI_logo.png';
import customLogo from './assets/ETSISI_logo2.png';
import customLogo2 from './assets/UPM_logo.png';
import { Tag } from 'antd';

const App = () => {
  const [loginType, setLoginType] = useState('account');
  const { token } = theme.useToken();

  // 登录提交函数示例：可在此调用后端API
  const handleLogin = async (values) => {
    console.log('提交的表单数据：', values);
    // 假设你的后端接口是 POST /api/login
    // try {
    //   const response = await fetch('http://localhost:3001/api/login', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(values),
    //   });
    //   const result = await response.json();
    //   if (result.success) {
    //     message.success('登录成功！');
    //     // 后续操作：跳转页面 / 存储token等
    //   } else {
    //     message.error(result.message || '登录失败');
    //   }
    // } catch (error) {
    //   console.error('请求错误：', error);
    //   message.error('网络错误，请稍后重试！');
    // }

    // 这里先模拟登录成功提示
    message.success('模拟：登录成功');
    return true;
  };


  return (
    <ProConfigProvider dark>
      <div style={{ backgroundColor: 'white', height: '100%' }}>
        <LoginFormPage
          onFinish={handleLogin}

          submitter={{
            // 方式1：只修改默认按钮文字
            searchConfig: {
              submitText: 'LOG IN', // 你想要显示的文字
            },
          }}

          logo={null}
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
          
        
          backgroundVideoUrl="/videos/BackroundVideo.mp4"
          containerStyle={{
            backgroundColor: 'rgba(20, 19, 19, 0.25)',
            backdropFilter: 'blur(1px)',
          }}


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
              <Button
                className="hover-animate-button"
                size="large"
                style={{
                  borderRadius: '20px',
                  width: 120,
                  fontWeight: 'bold',
                }}
              >
                LOG UP
              </Button>
            ),
          }}
          


          actions={
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column',
              }}
            >

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
                      style={{ width: '100%', height: '100%' }} // 可能是 80%
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
                      style={{ width: '100%', height: '100%' }} // 可能是 80%
                    />
                </div>
              </Space>
            </div>
          }
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

          {loginType === 'account' && (
            <>
              <ProFormText
                name="username"
                fieldProps={{
                  size: 'large',
                  prefix: <UserOutlined />,
                }}
                placeholder="Usuario: admin or user"
                rules={[{ required: true, message: 'Por favor, ingrese el nombre de usuario!' }]}
              />
              <ProFormText.Password
                name="password"
                fieldProps={{
                  size: 'large',
                  prefix: <LockOutlined />,
                }}
                placeholder="Contraseña: ant.design"
                rules={[{ required: true, message: 'Por favor, ingrese la contraseña!' }]}
              />
            </>
          )}
        </LoginFormPage>
      </div>
    </ProConfigProvider>
  );
};

export default App;
