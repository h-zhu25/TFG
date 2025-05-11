// services/scheduleService.js
const Course = require('../Models/Course');

/** 计算单门课的内部优先级 */
function computePriority(c) {
  return c.isSpecialElective ? 2.5 : c.priority;
}

/** 检测已有 path 中的任一 slot 是否与新 slot 冲突 */
function conflicts(acc, slot) {
  return acc.some(({ slot: s }) =>
    s.day === slot.day &&
    !(slot.end <= s.start || slot.start >= s.end)
  );
}

/** 计算一条完整排课方案的得分（优先级 + 空隙惩罚） */
function computeScore(schedule) {
  let score = schedule.reduce(
    (sum, { course }) => sum + computePriority(course),
    0
  );

  // 按天聚合，计算同一天相邻时段的空隙惩罚
  const byDay = schedule.reduce((map, { slot }) => {
    (map[slot.day] = map[slot.day] || []).push(slot);
    return map;
  }, {});
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

async function generateSchedules(selectedCourseIds) {
  // 1. 拉取选中课程
  const courses = await Course.find({ _id: { $in: selectedCourseIds } });

  // 2. 过滤工作日 09:00-21:00 的时段，并按 group 分组
  const allowedDays = ['Mon','Tue','Wed','Thu','Fri'];
  const minTime = '09:00', maxTime = '21:00';
  const coursesWithGroups = courses.map(course => {
    const groups = {};
    course.classTime.forEach(slot => {
      if (
        allowedDays.includes(slot.day) &&
        slot.start >= minTime &&
        slot.end <= maxTime
      ) {
        const key = slot.group || slot._id.toString();
        (groups[key] = groups[key] || []).push(slot);
      }
    });
    return { course, slotGroups: Object.values(groups) };
  });

  const results = [];
  const path = [];
  const cannotFit = new Set();

  // 3. 回溯函数：先跳过这门课，再尝试所有可行时段组
  function backtrack(idx) {
    if (idx === coursesWithGroups.length) {
      results.push([...path]);
      return;
    }

    const { course, slotGroups } = coursesWithGroups[idx];
    let fitAny = false;

    // 1) 跳过这门课
    backtrack(idx + 1);

    // 2) 尝试每个可行的 group
    for (const groupSlots of slotGroups) {
      if (groupSlots.every(slot => !conflicts(path, slot))) {
        fitAny = true;
        groupSlots.forEach(slot => path.push({ course, slot }));
        // 限制最多 50 个结果
        if (results.length >= 50) return;
        backtrack(idx + 1);
        groupSlots.forEach(() => path.pop());
      }
    }

    if (!fitAny) {
      cannotFit.add(course._id.toString());
    }
  }

  backtrack(0);

  // 4. 如果完全没有可行组合，标记所有课程为 doNotRecommend
  if (results.length === 0) {
    courses.forEach(c => cannotFit.add(c._id.toString()));
  }

  // 5. 按得分排序并格式化输出
  const sorted = results
    .map(sch => ({ sch, score: computeScore(sch) }))
    .sort((a, b) => a.score - b.score)
    .map(o => o.sch);

  const formatted = sorted.map(schedule =>
    schedule.map(({ course, slot }) => ({
      courseId:   course._id.toString(),
      courseName: course.name,
      day:        slot.day,
      startTime:  slot.start,
      endTime:    slot.end,
      classroom:  slot.classroom,
      teacher:    slot.teacher.toString(),
      group:      slot.group || null
    }))
  );

  return {
    schedules: formatted,
    doNotRecommend: Array.from(cannotFit)
  };
}

module.exports = { generateSchedules };
