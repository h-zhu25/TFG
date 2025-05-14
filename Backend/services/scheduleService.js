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
  // 1) 累加优先级
  let score = path.reduce((sum, { course }) => sum + computePriority(course), 0);

  // 2) 按天分组，计算空档小时数加分
  const byDay = {};
  for (const { slot } of path) {
    byDay[slot.day] = byDay[slot.day] || [];
    byDay[slot.day].push(slot);
  }
  for (const slots of Object.values(byDay)) {
    slots.sort((a, b) => a.start.localeCompare(b.start));
    for (let i = 1; i < slots.length; i++) {
      const [h1, m1] = slots[i-1].end.split(':').map(Number);
      const [h2, m2] = slots[i].start.split(':').map(Number);
      score += (h2 + m2/60) - (h1 + m1/60);
    }
  }
  return score;
}

async function generateSchedules(selectedCourseIds) {
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
        slot.end <= '21:00'
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

  const results = [];
  let path = [];               // 当前排入的 [{course, group, slot},…]
  const doNotRecommend = new Set();

  // 3. 回溯
  function backtrack(idx) {
    if (idx === coursesWithGroups.length) {
      results.push([...path]);
      return;
    }
    const { course, slotGroups } = coursesWithGroups[idx];
    let anyPlaced = false;

    // 跳过这门课也算一次分支
    

    for (const { group, slots } of slotGroups) {
      // 检查与 path 中是否冲突
      const conflict = slots
        .map(s => path.find(p => isConflict(p.slot, s)))
        .find(Boolean);

      if (conflict) {
        // 冲突：比较两门课 priority
        const other = conflict.course;
        if (computePriority(course) < computePriority(other)) {
          // 当前更优，移除 path 中 other 的所有同 group 条目
          path = path.filter(p =>
            !(p.course._id.equals(other._id) && p.group === conflict.group)
          );
        } else {
          continue;  // 当前更差，跳过此 group
        }
      }

      // 放入这整组
      anyPlaced = true;
      for (const slot of slots) {
        path.push({ course, group, slot });
      }

      // 限制结果数防爆炸
      if (results.length < 50) {
        backtrack(idx + 1);
      }

      // 回溯：移除刚加的这组
      for (let i = 0; i < slots.length; i++) path.pop();
    }

    if (!anyPlaced) {
      doNotRecommend.add(course._id.toString());
    }
  }

  backtrack(0);

  // 如果无可行方案，所有课程均标记
  if (results.length === 0) {
    courses.forEach(c => doNotRecommend.add(c._id.toString()));
  }

  // 4. 按得分排序（优先级+空档）
  results.sort((a, b) => computeScore(a) - computeScore(b));

  // 5. 格式化输出
  const schedules = results.map(schedule =>
    schedule.map(({ course, slot, group, classroom }) => ({
      courseCode: course.code,
      group,
      classroom:  slot.classroom,
      day:        slot.day,
      startTime:  slot.start,
      endTime:    slot.end
    }))
  );

  return {
    schedules,
    doNotRecommend: Array.from(doNotRecommend)
  };
}

module.exports = { generateSchedules };
