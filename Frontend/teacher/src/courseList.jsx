import React from 'react';
import './teacherPage.css';

export default function CourseList({ courses, selectedId, onSelect }) {
  if (!courses.length) return <p>暂无课程</p>;
  return (
    <ul className="course-list">
      {courses.map(c => (
        <li
          key={c._id}
          className={c._id === selectedId ? 'selected' : ''}
          onClick={() => onSelect(c)}
        >
          {c.code} – {c.name}
        </li>
      ))}
    </ul>
  );
}
