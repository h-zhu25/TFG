// tests/course.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

const app    = require('../app');
const User   = require('../Models/User');
const Course = require('../Models/Course');

let mongoServer;
let adminToken, studentToken;

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
    process.env.JWT_SECRET || 'test-secret'
  );

  const student = await User.create({
    name:     'Test Student',
    email:    'student@test.com',
    password: 'password123',
    role:     'student'
  });
  studentToken = jwt.sign(
    { id: student._id, role: student.role },
    process.env.JWT_SECRET || 'test-secret'
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
      code:          'A100',
      cuantrimestre: '2025-1',
      semester:      1,
      credits:       3,
      classTime:     [{ day:'Mon', start:'08:00', end:'10:00' }],
      teacher:       new mongoose.Types.ObjectId(),
      grados:        [new mongoose.Types.ObjectId()],
      priority:      1
    };

    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      name:          'Course A',
      cuantrimestre: '2025-1',
      credits:       3
    });
  });

  it('should retrieve the list of courses (GET /api/courses)', async () => {
    // 用数组格式初始化两个课程
    await Course.create([
      {
        name:          'X',
        code:          'X1',
        cuantrimestre: '2025-1',
        semester:      2,
        credits:       2,
        classTime:     [{ day:'Tue', start:'10:00', end:'12:00' }],
        teacher:       new mongoose.Types.ObjectId(),
        grados:        [new mongoose.Types.ObjectId()],
        priority:      2
      },
      {
        name:          'Y',
        code:          'Y1',
        cuantrimestre: '2025-1',
        semester:      1,
        credits:       4,
        classTime:     [{ day:'Wed', start:'14:00', end:'16:00' }],
        teacher:       new mongoose.Types.ObjectId(),
        grados:        [new mongoose.Types.ObjectId()],
        priority:      3
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
      code:          'OLD1',
      cuantrimestre: '2025-1',
      semester:      1,
      credits:       5,
      classTime:     [{ day:'Thu', start:'08:00', end:'10:00' }],
      teacher:       new mongoose.Types.ObjectId(),
      grados:        [new mongoose.Types.ObjectId()],
      priority:      4
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
      code:          'DEL1',
      cuantrimestre: '2025-1',
      semester:      2,
      credits:       1,
      classTime:     [{ day:'Fri', start:'12:00', end:'14:00' }],
      teacher:       new mongoose.Types.ObjectId(),
      grados:        [new mongoose.Types.ObjectId()],
      priority:      2
    });

    const res = await request(app)
      .delete(`/api/courses/${toDelete._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('DELETED SUCCEFUL');
  });

  it('non-admin should be forbidden to CREATE (403)', async () => {
    const payload = {
      name:          'Bad Course',
      code:          'BAD1',
      cuantrimestre: '2025-1',
      semester:      1,
      credits:       1,
      classTime:     [{ day:'Mon', start:'00:00', end:'01:00' }],
      teacher:       new mongoose.Types.ObjectId(),
      grados:        [new mongoose.Types.ObjectId()],
      priority:      1
    };

    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${studentToken}`)
      .send(payload);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Falta Permission');
  });
});
