// Backend/services/scheduleService.js
const Course = require('../Models/Course');

/** 计算单门课的内部优先级 */
function computePriority(c) {
  let p = c.priority;
  if (c.isSpecialElective) p = 2.5;
  return p;
}

/** 检测时段冲突 */
function conflicts(acc, slot) {
  return acc.some(({ slot: s }) =>
    s.day === slot.day &&
    !(slot.end <= s.start || slot.start >= s.end)
  );
}

/** 计算整个方案的分值：优先级与空隙总和 */
function computeScore(schedule) {
  // schedule 是 [{ course, slot }] 数组
  // 先按课程内部优先级累加
  let score = schedule.reduce((sum, { course }) =>
    sum + computePriority(course), 0
  );

  // 再加上各天内的空隙惩罚
  const byDay = schedule.reduce((m, { slot }) => {
    if (!m[slot.day]) m[slot.day] = [];
    m[slot.day].push(slot);
    return m;
  }, {});

  Object.values(byDay).forEach(slots => {
    // 按开始时间排序
    slots.sort((a, b) => a.start.localeCompare(b.start));
    for (let i = 1; i < slots.length; i++) {
      const prevEnd = slots[i - 1].end;
      const currStart = slots[i].start;
      // 计算空隙（单位小时，字符串比较需自行转换为分钟/小时）
      const gap = (parseInt(currStart.slice(0, 2), 10) * 60 + parseInt(currStart.slice(3), 10))
                - (parseInt(prevEnd.slice(0, 2), 10) * 60 + parseInt(prevEnd.slice(3), 10));
      score += gap / 60;  // 每小时空隙加 1 分
    }
  });

  return score;
}

/**
 * 回溯生成所有无冲突的排课组合
 * @param {Array} courses - 每个元素是 { _id, classTime: [{ day, start, end, classroom, teacher, grados }] }
 */
async function generateSchedules(selectedCourseIds) {
  // 1. 从数据库加载所有选中的课程
  const courses = await Course.find({ _id: { $in: selectedCourseIds } });

  // 2. 过滤掉不在 Mon–Fri 09:00–21:00 范围内的时段
  const allowedDays = ['Mon','Tue','Wed','Thu','Fri'];
  const minTime    = '09:00';
  const maxTime    = '21:00';
  courses.forEach(c => {
    c.classTime = c.classTime.filter(slot =>
      allowedDays.includes(slot.day) &&
      slot.start >= minTime &&
      slot.end   <= maxTime
    );
  });

  const results = [];
  const path    = [];
  const cannotFit = new Set();

  // 3. 递归回溯构建所有无冲突组合
  function backtrack(idx) {
    if (idx === courses.length) {
      results.push([...path]);
      return;
    }
    const course = courses[idx];
    let fitAny = false;

    course.classTime.forEach(slot => {
      if (!conflicts(path, slot)) {
        fitAny = true;
        path.push({ course, slot });
        backtrack(idx + 1);
        path.pop();
      }
    });

    if (!fitAny) {
      cannotFit.add(course._id.toString());
    }
  }

  backtrack(0);

  // 4. 如果完全没法排出任何组合，则将所有课程都标记为 doNotRecommend
  if (results.length === 0) {
    courses.forEach(c => cannotFit.add(c._id.toString()));
  }

  // 5. 针对每个方案打分并排序
  const schedules = results
    .map(sch => ({ sch, score: computeScore(sch) }))
    .sort((a, b) => a.score - b.score)
    .map(o => o.sch);

  return {
    schedules,
    doNotRecommend: Array.from(cannotFit)
  };
}

module.exports = { generateSchedules };
