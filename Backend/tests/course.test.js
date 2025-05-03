// tests/course.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

const app    = require('../app');
const User   = require('../Models/User');
const Course = require('../Models/Course');

let mongoServer;
let adminToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  const admin = await User.create({
    name:     'Test Admin',
    email:    'admin@test.com',
    password: 'password123',
    role:     'admin'
  });
  adminToken = jwt.sign(
    { id: admin._id, role: admin.role },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1d' }
  );
});

beforeEach(async () => {
  await Course.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Course CRUD API', () => {

  it('should create a course (POST /api/courses)', async () => {
    const payload = {
      name:          'Course A',
      code:          'A100',                  // 写给后端可选字段，实际模型中会被丢弃
      cuantrimestre: '2025-1',                // 模型必填 :contentReference[oaicite:0]{index=0}:contentReference[oaicite:1]{index=1}
      credits:       3,                      // 模型必填 :contentReference[oaicite:2]{index=2}:contentReference[oaicite:3]{index=3}
      classTime:     'Mon 08:00-10:00',       // 模型定义为 String :contentReference[oaicite:4]{index=4}:contentReference[oaicite:5]{index=5}
      teacher:       new mongoose.Types.ObjectId()
    };

    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    // 状态码 201，且直接在 res.body 拿到保存后的课程对象
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      name:          'Course A',
      cuantrimestre: '2025-1',
      credits:       3
    });
  });

  it('should retrieve the list of courses (GET /api/courses)', async () => {
    await Course.create([
      {
        name:          'X',
        cuantrimestre: '2025-1',
        credits:       2,
        classTime:     'Tue 10:00-12:00',
        teacher:       new mongoose.Types.ObjectId()
      },
      {
        name:          'Y',
        cuantrimestre: '2025-1',
        credits:       4,
        classTime:     'Wed 14:00-16:00',
        teacher:       new mongoose.Types.ObjectId()
      }
    ]);

    const res = await request(app)
      .get('/api/courses')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it('should update a course (PUT /api/courses/:id)', async () => {
    const course = await Course.create({
      name:          'Old Name',
      cuantrimestre: '2025-1',
      credits:       5,
      classTime:     'Thu 08:00-10:00',
      teacher:       new mongoose.Types.ObjectId()
    });

    const res = await request(app)
      .put(`/api/courses/${course._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'New Name', credits: 6 });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('New Name');
    expect(res.body.credits).toBe(6);
  });

  it('should delete a course (DELETE /api/courses/:id)', async () => {
    const toDelete = await Course.create({
      name:          'To Delete',
      cuantrimestre: '2025-1',
      credits:       1,
      classTime:     'Fri 12:00-14:00',
      teacher:       new mongoose.Types.ObjectId()
    });

    const res = await request(app)
      .delete(`/api/courses/${toDelete._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('DELETED SUCCEFUL');
  });

  it('should forbid non-admin users (403)', async () => {
    const student = await User.create({
      name:     'Student',
      email:    'student@test.com',
      password: 'password',
      role:     'student'
    });
    const studentToken = jwt.sign(
      { id: student._id, role: student.role },
      process.env.JWT_SECRET || 'test-secret'
    );

    const res = await request(app)
      .get('/api/courses')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Falta Permission');
  });

});
