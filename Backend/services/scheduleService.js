// services/scheduleService.js
const Course = require('../Models/Course');

/** 计算一门课的内部优先级（数值越小优先级越高） */
function computePriority(course) {
  return course.isSpecialElective ? 2.5 : course.priority;
}

/** 判断两个时段是否在同一天且时间重叠 */
function isConflict(a, b) {
  return (
    a.day === b.day &&
    !(b.end <= a.start || b.start >= a.end)
  );
}

/** 计算一个完整排课方案的得分：优先级之和 + 每天空档惩罚 */
function computeScore(path) {
  let score = path.reduce((sum, { course }) => sum + computePriority(course), 0);

  const byDay = {};
  for (const { slot } of path) {
    (byDay[slot.day] = byDay[slot.day] || []).push(slot);
  }
  for (const slots of Object.values(byDay)) {
    slots.sort((a, b) => a.start.localeCompare(b.start));
    for (let i = 1; i < slots.length; i++) {
      const [h1, m1] = slots[i - 1].end.split(':').map(Number);
      const [h2, m2] = slots[i].start.split(':').map(Number);
      score += (h2 + m2 / 60) - (h1 + m1 / 60);
    }
  }

  return score;
}

/** 将 "HH:MM" 转为分钟数 */
function toMinutes(str) {
  const [h, m] = str.split(':').map(Number);
  return h * 60 + m;
}

/**
 * 计算 slot 与 [ws, we] 窗口的重合分钟数
 */
function overlapMinutes(slot, ws, we) {
  const start = Math.max(toMinutes(slot.start), toMinutes(ws));
  const end   = Math.min(toMinutes(slot.end),   toMinutes(we));
  return Math.max(0, end - start);
}

/**
 * 生成排课方案
 * @param {string[]} selectedCourseIds
 * @param {'morning'|'afternoon'|null} preference
 */
async function generateSchedules(selectedCourseIds, preference = null) {
  // 1. 拉取并按 priority 升序
  const courses = await Course.find({ _id: { $in: selectedCourseIds } });
  courses.sort((a, b) => computePriority(a) - computePriority(b));

  // 2. 按 group 分组，只保留 Mon–Fri 09:00–21:00
  const allowedDays = ['Mon','Tue','Wed','Thu','Fri'];
  const coursesWithGroups = courses.map(course => {
    const groups = {};
    for (const slot of course.classTime) {
      if (
        allowedDays.includes(slot.day) &&
        slot.start >= '09:00' &&
        slot.end   <= '21:00'
      ) {
        const key = slot.group || course._id.toString();
        (groups[key] = groups[key] || []).push(slot);
      }
    }
    return {
      course,
      slotGroups: Object.entries(groups).map(([group, slots]) => ({ group, slots }))
    };
  });

  // 3. 回溯枚举所有可行方案
  const results = [];
  let path = [];
  const doNotRecommend = new Set();

  function backtrack(idx) {
    if (idx === coursesWithGroups.length) {
      results.push([...path]);
      return;
    }
    const { course, slotGroups } = coursesWithGroups[idx];
    let anyPlaced = false;

    for (const { group, slots } of slotGroups) {
      const conflict = slots
        .map(s => path.find(p => isConflict(p.slot, s)))
        .find(Boolean);

      if (conflict) {
        const other = conflict.course;
        if (computePriority(course) < computePriority(other)) {
          path = path.filter(p =>
            !(p.course._id.equals(other._id) && p.group === conflict.group)
          );
        } else {
          continue;
        }
      }

      anyPlaced = true;
      slots.forEach(slot => path.push({ course, group, slot }));
      if (results.length < 8888) backtrack(idx + 1);
      for (let i = 0; i < slots.length; i++) path.pop();
    }

    if (!anyPlaced) {
      doNotRecommend.add(course._id.toString());
    }
  }

  backtrack(0);
  if (results.length === 0) {
    courses.forEach(c => doNotRecommend.add(c._id.toString()));
  }

  // 4. 按分数排序
  results.sort((a, b) => computeScore(a) - computeScore(b));

  // 5. **偏好排序**：按上午或下午重合分钟数降序
  if (preference === 'morning' || preference === 'afternoon') {
    // 定义窗口
    const [ws, we] = preference === 'morning'
      ? ['09:00','15:00']
      : ['15:00','21:00'];

    results.sort((a, b) => {
      const ma = a.reduce((sum, p) => sum + overlapMinutes(p.slot, ws, we), 0);
      const mb = b.reduce((sum, p) => sum + overlapMinutes(p.slot, ws, we), 0);
      return mb - ma;  // 降序：重合分钟数多的靠前
    });
  }

  // 6. 格式化输出
  const schedules = results.map(schedule =>
    schedule.map(({ course, slot, group }) => ({
      courseCode: course.code,
      group,
      classroom: slot.classroom,
      day:       slot.day,
      startTime: slot.start,
      endTime:   slot.end
    }))
  );

  return {
    schedules,
    doNotRecommend: Array.from(doNotRecommend)
  };
}

module.exports = { generateSchedules };
