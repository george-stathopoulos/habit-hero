import assert from 'node:assert/strict';
import {goals,suggestion,alreadyAssigned} from '../../app/v3/goals.js';
assert.equal(goals.length,20);assert.equal(new Set(goals.map(g=>g[0])).size,20);
for(const age_band of ['6-8','9-11','12-14'])for(const goal of goals){const draft=suggestion(goal,{id:'child-a',age_band});assert.equal(draft.child_id,'child-a');assert.ok(draft.name.length<=100);assert.ok(draft.description.length<=500);assert.ok(draft.benefit.length<=500);assert.equal(draft.frequency_count,1)}
const goal=goals.find(g=>g[0]==='reading'),young=suggestion(goal,{id:'child-a',age_band:'6-8'}),older=suggestion(goal,{id:'child-a',age_band:'12-14'});assert.notEqual(young.description,older.description);
const existing=[{name:'  '+young.name.toLocaleUpperCase('el-GR')+'  ',children:[{id:'child-a'}]}];assert.equal(alreadyAssigned(existing,young),true);assert.equal(alreadyAssigned(existing,{...young,child_id:'child-b'}),false);assert.equal(alreadyAssigned([] ,young),false);
console.log('PASS 20 unique goals, age-specific bounded drafts and child-scoped duplicate suggestions');
