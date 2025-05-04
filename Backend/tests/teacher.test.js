// tests/teacher.test.js
const request  = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt      = require('jsonwebtoken');

const app    = require('../app');
const User   = require('../Models/User');
const Course = require('../Models/Course');

let mongoServer;
let teacherToken;
let teacherId;
let student;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), {});

  const teacher = await User.create({
    name:     'Teach',
    email:    'teach@test.com',
    password: 'p',
    role:     'teacher'
  });
  teacherId    = teacher._id.toString();
  teacherToken = jwt.sign(
    { id: teacherId, role: 'teacher' },
    process.env.JWT_SECRET || 'test-secret'
  );

  student = await User.create({
    name:     'Stu',
    email:    'stu@test.com',
    password: 'p',
    role:     'student',
    selectedCourses: []
  });

  // create a course and enroll the student
  const gradoId = new mongoose.Types.ObjectId();
  const course = await Course.create({
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
        classroom: 'T100',
        teacher:   teacherId,
        grados:    [gradoId]
      }
    ]
  });

  student.selectedCourses.push({ course: course._id });
  await student.save();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Teacher Endpoints', () => {
  it('GET /api/teachers/:id/students/:courseId should return enrolled students', async () => {
    const courseId = (await Course.findOne({ code: 'C1' }))._id.toString();
    const res = await request(app)
      .get(`/api/teachers/${teacherId}/students/${courseId}`)
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].name).toBe('Stu');
  });
});
