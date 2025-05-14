// src/TimetableGrid.jsx
import React from 'react';
import './TimetableGrid.css';

const DAYS = [
  { code: 'Mon', label: 'Lunes' },
  { code: 'Tue', label: 'Martes' },
  { code: 'Wed', label: 'Miércoles' },
  { code: 'Thu', label: 'Jueves' },
  { code: 'Fri', label: 'Viernes' },
];

const HOURS = Array.from({ length: 12 }, (_, i) => {
  const h = 9 + i;
  return {
    start: `${String(h).padStart(2, '0')}:00`,
    end:   `${String(h + 1).padStart(2, '0')}:00`,
  };
});

export default function TimetableGrid({ clases }) {
  return (
    <table className="timetable-table">
      <thead>
        <tr>
          <th>Hora</th>
          {DAYS.map(d => (
            <th key={d.code}>{d.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {HOURS.map(slot => (
          <tr key={slot.start}>
            <th className="time-cell">
              {slot.start} – {slot.end}
            </th>
            {DAYS.map(d => {
              const curso = clases.find(c =>
                c.day === d.code &&
                c.startTime <= slot.start &&
                c.endTime   >= slot.end
              );
              return (
                <td
                  key={d.code}
                  className={`course-cell${curso ? ' has-course' : ''}`}
                >
                  {curso && (
                    <>
                      <div className="course-code">{curso.courseCode}</div>
                      <div className="course-group">Grupo {curso.group}</div>
                      <div className="course-room">{curso.classroom}</div>
                    </>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
