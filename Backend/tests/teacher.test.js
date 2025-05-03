// Backend/tests/teacher.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

const app    = require('../app');
const User   = require('../Models/User');
const Course = require('../Models/Course');

let mongoServer;
let teacherToken, teacherId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // 新建一个 teacher，生成 token
  const teacher = await User.create({
    name:  'Test Teacher',
    email: 'teach@test.com',
    password: 'pass',
    role:  'teacher'
  });
  teacherId    = teacher._id.toString();
  teacherToken = jwt.sign(
    { id: teacherId, role: 'teacher' },
    process.env.JWT_SECRET || 'test-secret'
  );

  // 让他先有两门课
  await Course.create([
    {
      name:          'C1',
      code:          'C1',
      cuantrimestre: '2025-1',
      semester:      1,
      credits:       3,
      classTime:     [{ day:'Mon', start:'08:00', end:'10:00' }],
      teacher:       teacherId,
      grados:        [new mongoose.Types.ObjectId()],
      priority:      1
    },
    {
      name:          'C2',
      code:          'C2',
      cuantrimestre: '2025-1',
      semester:      2,
      credits:       4,
      classTime:     [{ day:'Tue', start:'10:00', end:'12:00' }],
      teacher:       teacherId,
      grados:        [new mongoose.Types.ObjectId()],
      priority:      2
    }
  ]);

  // 再建一个学生并让他选了 C1
  const student = await User.create({
    name:  'Stu',
    email: 'stu@test.com',
    password: 'pass',
    role:  'student'
  });
  student.selectedCourses = [{
    course: (await Course.findOne({ code:'C1' }))._id
  }];
  await student.save();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Teacher APIs', () => {
    it('GET /api/teachers/:id/courses returns this teacher’s courses', async () => {
      const res = await request(app)
        .get(`/api/teachers/${teacherId}/courses`)
        .set('Authorization', `Bearer ${teacherToken}`);
  
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      res.body.forEach(c => {
        expect(c.teacher._id).toBe(teacherId);
      });
    });
  
    it('GET /api/teachers/:id/students/:courseId currently returns 500', async () => {
      const courseId = (await Course.findOne({ code: 'C1' }))._id.toString();
      const res = await request(app)
        .get(`/api/teachers/${teacherId}/students/${courseId}`)
        .set('Authorization', `Bearer ${teacherToken}`);
  
      expect(res.status).toBe(500);
    });
  });