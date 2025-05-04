// tests/schedule.test.js
const request  = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt      = require('jsonwebtoken');

const app    = require('../app');
const User   = require('../Models/User');
const Course = require('../Models/Course');

let mongoServer;
let studentToken, adminToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), {});

  const student = await User.create({
    name:     'Stu',
    email:    'stu@test.com',
    password: 'pass',
    role:     'student'
  });
  studentToken = jwt.sign(
    { id: student._id, role: student.role },
    process.env.JWT_SECRET || 'test-secret'
  );

  const admin = await User.create({
    name:     'Adm',
    email:    'adm@test.com',
    password: 'pass',
    role:     'admin'
  });
  adminToken = jwt.sign(
    { id: admin._id, role: admin.role },
    process.env.JWT_SECRET || 'test-secret'
  );
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('POST /api/schedule', () => {
  beforeEach(async () => {
    await Course.deleteMany({});
  });

  it('should forbid non-students (403)', async () => {
    const res = await request(app)
      .post('/api/schedule')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ selectedCourseIds: [] });

    expect(res.status).toBe(403);
  });

  it('should return 400 on missing/empty payload', async () => {
    let res = await request(app)
      .post('/api/schedule')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({});
    expect(res.status).toBe(400);

    res = await request(app)
      .post('/api/schedule')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ selectedCourseIds: [] });
    expect(res.status).toBe(400);
  });

  it('should generate schedules for non-conflicting courses', async () => {
    const teacherId = new mongoose.Types.ObjectId().toString();
    const gradoId   = new mongoose.Types.ObjectId().toString();

    const c1 = await Course.create({
      name:          'C1',
      code:          'C1',
      cuantrimestre: '2025-1',
      semester:      1,
      credits:       1,
      grados:        [gradoId],
      priority:      1,
      classTime: [
        {
          day:       'Mon',
          start:     '09:00',
          end:       '11:00',
          classroom: 'R1',
          teacher:   teacherId,
          grados:    [gradoId]
        }
      ]
    });
    const c2 = await Course.create({
      name:          'C2',
      code:          'C2',
      cuantrimestre: '2025-1',
      semester:      1,
      credits:       1,
      grados:        [gradoId],
      priority:      2,
      classTime: [
        {
          day:       'Mon',
          start:     '11:00',
          end:       '13:00',
          classroom: 'R2',
          teacher:   teacherId,
          grados:    [gradoId]
        }
      ]
    });

    const res = await request(app)
      .post('/api/schedule')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ selectedCourseIds: [c1._id.toString(), c2._id.toString()] });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.schedules)).toBe(true);
    expect(res.body.doNotRecommend).toEqual([]); // none conflict
  });

  it('should mark fully conflicting courses as not recommended', async () => {
    const teacherId = new mongoose.Types.ObjectId().toString();
    const gradoId   = new mongoose.Types.ObjectId().toString();

    const slot = {
      day:       'Tue',
      start:     '10:00',
      end:       '12:00',
      classroom: 'R3',
      teacher:   teacherId,
      grados:    [gradoId]
    };

    const c1 = await Course.create({
      name:          'C1',
      code:          'C1',
      cuantrimestre: '2025-1',
      semester:      1,
      credits:       1,
      grados:        [gradoId],
      priority:      1,
      classTime:     [ slot ]
    });
    const c2 = await Course.create({
      name:          'C2',
      code:          'C2',
      cuantrimestre: '2025-1',
      semester:      1,
      credits:       1,
      grados:        [gradoId],
      priority:      2,
      classTime:     [ slot ]
    });

    const res = await request(app)
      .post('/api/schedule')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ selectedCourseIds: [c1._id.toString(), c2._id.toString()] });

    expect(res.status).toBe(200);
    // 现在返回的是 ID 列表
    expect(res.body.doNotRecommend).toContain(c2._id.toString());
  });

  it('should filter out weekend or after-21:00 slots', async () => {
    const teacherId = new mongoose.Types.ObjectId().toString();
    const gradoId   = new mongoose.Types.ObjectId().toString();

    const bad1 = await Course.create({
      name:          'Bad1',
      code:          'B1',
      cuantrimestre: '2025-1',
      semester:      1,
      credits:       1,
      grados:        [gradoId],
      priority:      1,
      classTime: [
        {
          day:       'Sat',
          start:     '10:00',
          end:       '12:00',
          classroom: 'R4',
          teacher:   teacherId,
          grados:    [gradoId]
        }
      ]
    });
    const bad2 = await Course.create({
      name:          'Bad2',
      code:          'B2',
      cuantrimestre: '2025-1',
      semester:      1,
      credits:       1,
      grados:        [gradoId],
      priority:      1,
      classTime: [
        {
          day:       'Mon',
          start:     '20:00',
          end:       '22:00',
          classroom: 'R5',
          teacher:   teacherId,
          grados:    [gradoId]
        }
      ]
    });

    const res = await request(app)
      .post('/api/schedule')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ selectedCourseIds: [bad1._id.toString(), bad2._id.toString()] });

    expect(res.status).toBe(200);
    // 断言返回 ID，而不是名称
    expect(res.body.doNotRecommend).toEqual(
      expect.arrayContaining([bad1._id.toString(), bad2._id.toString()])
    );
  });
});
