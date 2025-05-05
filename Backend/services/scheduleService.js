// services/scheduleService.js
const Course = require('../Models/Course');

/** 计算单门课的内部优先级 */
function computePriority(c) {
  return c.isSpecialElective ? 2.5 : c.priority;
}

/** 检测两个时段是否冲突 */
function conflicts(acc, slot) {
  return acc.some(({ slot: s }) =>
    s.day === slot.day &&
    !(slot.end <= s.start || slot.start >= s.end)
  );
}

/** 计算一条完整排课方案的得分（优先级+空隙惩罚） */
function computeScore(schedule) {
  // 累加所有课程自身优先级
  let score = schedule.reduce((sum, { course }) =>
    sum + computePriority(course), 0
  );

  // 按天分组，再计算同一天相邻时段的空隙
  const byDay = schedule.reduce((m, { slot }) => {
    (m[slot.day] = m[slot.day] || []).push(slot);
    return m;
  }, {});
  for (const slots of Object.values(byDay)) {
    slots.sort((a, b) => a.start.localeCompare(b.start));
    for (let i = 1; i < slots.length; i++) {
      const [h1, m1] = slots[i-1].end.split(':').map(Number);
      const [h2, m2] = slots[i].start.split(':').map(Number);
      const gap = (h2 + m2/60) - (h1 + m1/60);
      score += gap;  // 每小时空隙 +1 分
    }
  }

  return score;
}

/**
 * 根据 selectedCourseIds 回溯生成所有无冲突排课组合
 * 且保证同一组(group)的所有时段要么一起排入、要么一起跳过
 */
async function generateSchedules(selectedCourseIds) {
  // 1. 拉取选中课程
  const courses = await Course.find({ _id: { $in: selectedCourseIds } });

  // 2. 过滤时段到工作日 09:00-21:00，并按 group 聚合
  const allowedDays = ['Mon','Tue','Wed','Thu','Fri'];
  const minTime = '09:00', maxTime = '21:00';

  const coursesWithGroups = courses.map(course => {
    // 按 slot.group 分组
    const groups = {};
    course.classTime.forEach(slot => {
      if (!allowedDays.includes(slot.day)) return;
      if (slot.start < minTime || slot.end > maxTime) return;

      const key = slot.group || slot._id.toString();
      (groups[key] = groups[key] || []).push(slot);
    });
    return {
      course,
      slotGroups: Object.values(groups)
    };
  });

  const results = [];
  const path = [];
  const cannotFit = new Set();

  // 3. 回溯：针对每门课的每个 slotGroup，要么整组加入，要么整组跳过
  function backtrack(idx) {
    if (idx === coursesWithGroups.length) {
      results.push([...path]);
      return;
    }

    const { course, slotGroups } = coursesWithGroups[idx];
    let fitAny = false;

    for (const groupSlots of slotGroups) {
      // 组里所有时段都不冲突才行
      if (groupSlots.every(slot => !conflicts(path, slot))) {
        fitAny = true;
        groupSlots.forEach(slot => path.push({ course, slot }));
        backtrack(idx + 1);
        groupSlots.forEach(() => path.pop());
      }
    }

    if (!fitAny) {
      cannotFit.add(course._id.toString());
    }
  }

  backtrack(0);

  // 4. 如果完全没有可行组合，把所有课程都标记为 doNotRecommend
  if (results.length === 0) {
    courses.forEach(c => cannotFit.add(c._id.toString()));
  }

  // 5. 给每个组合打分并排序
  const sortedSchedules = results
    .map(sch => ({ sch, score: computeScore(sch) }))
    .sort((a, b) => a.score - b.score)
    .map(o => o.sch);

  // 6. 格式化输出
  const formatted = sortedSchedules.map(schedule =>
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
