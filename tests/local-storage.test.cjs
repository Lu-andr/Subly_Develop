const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function evaluate(file, req) {
 const module={exports:{}};
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 vm.runInNewContext(code,{module,exports:module.exports,require:req,Date,Math,console}); return module.exports;
}
function store(memory) { return evaluate('src/services/localStore.ts',()=>({__esModule:true,default:{getItem:async k=>memory.get(k)??null,setItem:async(k,v)=>{memory.set(k,v);}}})); }
test('local transactions preserve concurrent writes and survive restarting the store',async()=>{
 const memory=new Map(); const first=store(memory);
 await Promise.all([first.updateLocalData(d=>d.trials.push({id:'one'})),first.updateLocalData(d=>d.trials.push({id:'two'})),first.updateLocalData(d=>{d.preferences={notifications_enabled:false};})]);
 const restarted=store(memory); const data=await restarted.readLocalData();
 assert.equal(data.trials.length,2); assert.equal(data.preferences.notifications_enabled,false);
 await restarted.clearLocalData(); const empty=await first.readLocalData();
 assert.equal(empty.trials.length,0);assert.equal(empty.preferences,null);
});
test('local CRUD preserves decimal prices and cancellation without a server or account',async()=>{
 const memory=new Map(); const local=store(memory);
 const currencies=evaluate('src/utils/currencyUtils.ts',()=>({}));
 const dates=evaluate('src/utils/dateUtils.ts',()=>({}));
 const trials=evaluate('src/services/trialsService.ts',name=>name.includes('localStore')?local:name.includes('currencyUtils')?currencies:dates);
 const form={service_name:' Example ',trial_start_date:new Date(2026,9,1),trial_end_date:new Date(2030,9,20),charge_amount:'19,99',currency:'ZAR',billing_cycle:'monthly'};
 const created=await trials.createTrial('this-device',form);assert.equal(created.charge_amount,19.99);
 assert.equal((await trials.fetchTrials('this-device')).length,1);
 const edited=await trials.updateTrial(created.id,{...form,charge_amount:'25,50'});assert.equal(edited.charge_amount,25.5);
 await trials.markTrialCancelled(created.id);assert.equal((await trials.fetchTrialById(created.id)).status,'CANCELLED');
 await trials.deleteTrial(created.id);assert.equal((await trials.fetchTrials('this-device')).length,0);
});
