import React from 'react';
import './teacherPage.css';

export default function StudentList({ course, students }) {
  if (!students.length) {
    return <p>El curso <strong>{course.name}</strong> aún no tiene estudiantes.</p>;
  }
  return (
  <div className="student-list">
    <h3>Lista de estudiantes de {course.name}</h3>
    <table>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Matrícula</th>
          <th>Correo electrónico</th>
        </tr>
      </thead>
      <tbody>
        {students.map(s => (
          <tr key={s._id}>
            <td>{s.name}</td>
            <td>{s.studentID}</td>
            <td>{s.email}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
}
