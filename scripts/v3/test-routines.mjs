import assert from 'node:assert/strict';
import {routineSteps,nextRoutineStep} from '../../app/v3/routines.js';
import {validateSchedule,scheduleStatus} from '../../cloudflare/schedule.mjs';
const tasks=[{habit_name:'Second',routine:'morning',routine_order:2},{habit_name:'First',routine:'morning',routine_order:1},{habit_name:'Evening',routine:'bedtime',routine_order:1},{habit_name:'Later',routine:'morning',routine_order:3,scheduled_today:false}];
assert.deepEqual(routineSteps(tasks,'morning').map(t=>t.habit_name),['First','Second']);assert.equal(routineSteps(tasks,'morning',true).length,3);
assert.equal(nextRoutineStep(tasks,'morning').habit_name,'First');tasks[1].submission_status='pending';assert.equal(nextRoutineStep(tasks,'morning').habit_name,'Second');tasks[0].schedule_available=false;assert.equal(nextRoutineStep(tasks,'morning'),undefined);
const schedule=validateSchedule({routine:'morning',order:4});assert.equal(scheduleStatus(JSON.stringify(schedule)).routine_order,4);assert.throws(()=>validateSchedule({routine:'invalid'}));assert.throws(()=>validateSchedule({routine:'morning',order:0}));
console.log('PASS ordered routines, pending progress, schedule gating, other-day filters and stored routine configuration');
