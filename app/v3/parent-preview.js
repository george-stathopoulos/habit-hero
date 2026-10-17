// Explicit sandbox, loaded only by the labelled parent-preview route. No fetch or real writes.
const child='00000000-0000-4000-8000-000000000001',other='00000000-0000-4000-8000-000000000002';
const now=()=>new Date().toISOString();
const store={
 '/api/family/overview':{family:{name:'Η οικογένεια Παπαδοπούλου',timezone:'Europe/Athens'},parent:{name:'Μαρία'},children:[{id:child,display_name:'Σοφία',age_band:'6-8',avatar_id:'hero-girl'},{id:other,display_name:'Νικόλας',age_band:'9-11',avatar_id:'hero-boy'}]},
 '/api/habits':{habits:[{id:'mission-1',name:'Βουρτσίζω τα δόντια μου',points:10,frequency:'daily',children:[{id:child,name:'Σοφία'}]},{id:'mission-2',name:'Στρώνω το κρεβάτι μου',points:15,frequency:'daily',children:[{id:other,name:'Νικόλας'}]},{id:'mission-3',name:'Διαβάζω για 15 λεπτά',points:20,frequency:'daily',children:[{id:child,name:'Σοφία'},{id:other,name:'Νικόλας'}]}]},
 '/api/approvals':{pending:[{id:'approval-1',child_name:'Σοφία',habit_name:'Βουρτσίζω τα δόντια μου',points:10,submitted_at:now()}]},
 '/api/parent/help':{requests:[{id:'help-1',child_name:'Νικόλας',habit_name:'Ετοιμάζω την τσάντα μου',status:'pending',created_at:now()}]},
 '/api/progress':{children:[{child_id:child,level:3,points_balance:145,current_streak_days:6,approved_last_30_days:18,active_days_last_30_days:12,recent_activity:[{habit_name:'Διαβάζω για 15 λεπτά',status:'approved',submitted_at:now()}]},{child_id:other,level:4,points_balance:220,current_streak_days:9,approved_last_30_days:24,active_days_last_30_days:16}]},
 '/api/rewards':{rewards:[{id:'reward-1',name:'Μια βόλτα με ποδήλατο μαζί',description:'Διαλέγουμε τη διαδρομή και παίρνουμε ένα μικρό πικνίκ.',points_cost:100,active:true,children:[{id:child,name:'Σοφία'},{id:other,name:'Νικόλας'}]}]},
 '/api/rewards/redemptions':{redemptions:[{id:'request-1',child_name:'Σοφία',reward_name:'Μια βόλτα με ποδήλατο μαζί',points_spent:100,status:'requested',requested_at:now()}]},
 '/api/version':{current:'sample-preview',check_available:false}
};
export async function previewApi(path,method='GET',body){
 if(method==='GET'){if(path==='/api/family/export')return structuredClone(store);if(!store[path])throw Error('Μη διαθέσιμη ενέργεια στην προεπισκόπηση.');return structuredClone(store[path])}
 const people=store['/api/family/overview'].children;
 if(path==='/api/approvals/review')store['/api/approvals'].pending=store['/api/approvals'].pending.filter(x=>x.id!==body.completion_id);
 else if(path==='/api/parent/help/reply')store['/api/parent/help'].requests.find(x=>x.id===body.request_id).status=body.status;
 else if(path==='/api/rewards/review')store['/api/rewards/redemptions'].redemptions.find(x=>x.id===body.redemption_id).status=body.decision;
 else if(path==='/api/children'){const id=crypto.randomUUID();people.push({id,display_name:body.name,age_band:body.age_band});return {id}}
 else if(path==='/api/children/update')Object.assign(people.find(x=>x.id===body.child_id),{display_name:body.name,age_band:body.age_band,avatar_id:body.avatar_id});
 else if(path==='/api/habits')store[path].habits.push({...body,id:crypto.randomUUID(),children:[{id:body.child_id,name:people.find(x=>x.id===body.child_id).display_name}]});
 else if(path==='/api/habits/update')Object.assign(store['/api/habits'].habits.find(x=>x.id===body.habit_id),body);
 else if(path==='/api/habits/assign')store['/api/habits'].habits.find(x=>x.id===body.habit_id).children.push({id:body.child_id,name:people.find(x=>x.id===body.child_id).display_name});
 else if(path==='/api/habits/unassign'){const h=store['/api/habits'].habits.find(x=>x.id===body.habit_id);h.children=h.children.filter(x=>x.id!==body.child_id)}
 else if(path==='/api/rewards')store[path].rewards.push({...body,id:crypto.randomUUID(),active:true,children:[{id:body.child_id,name:people.find(x=>x.id===body.child_id).display_name}]});
 else if(path==='/api/rewards/update')Object.assign(store['/api/rewards'].rewards.find(x=>x.id===body.reward_id),body);
 else if(path==='/api/rewards/assign')store['/api/rewards'].rewards.find(x=>x.id===body.reward_id).children.push({id:body.child_id,name:people.find(x=>x.id===body.child_id).display_name});
 else if(path==='/api/rewards/unassign'){const r=store['/api/rewards'].rewards.find(x=>x.id===body.reward_id);r.children=r.children.filter(x=>x.id!==body.child_id)}
 else if(path==='/api/rewards/archive')store['/api/rewards'].rewards.find(x=>x.id===body.reward_id).active=false;
 else if(path==='/api/habits/archive')store['/api/habits'].habits=store['/api/habits'].habits.filter(x=>x.id!==body.habit_id);
 else if(path==='/api/children/pin'||path==='/api/child/revoke')return {ok:true};
 else if(path==='/api/child/pairing')return {pairing_code:'SAMPLE-ONLY-NOT-A-REAL-PAIRING-CODE',expires_at:new Date(Date.now()+600000).toISOString()};
 else if(path==='/api/points/adjust'){const m=store['/api/progress'].children.find(x=>x.child_id===body.child_id);if(!m||m.points_balance+body.delta<0)throw Error('Δεν υπάρχουν αρκετοί πόντοι.');m.points_balance+=body.delta}
 else if(path==='/api/family/timezone')store['/api/family/overview'].family.timezone=body.timezone;
 else throw Error('Μη διαθέσιμη ενέργεια στην προεπισκόπηση.');return {ok:true};
}
