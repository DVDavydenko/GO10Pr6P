const q=id=>document.getElementById(id);

function normalize(t){
  return t.toLowerCase();
}

function goToStep(n){
 document.querySelectorAll('.step').forEach(e=>e.classList.add('hidden'));
 const el=q('step-'+n);
 if(el) el.classList.remove('hidden');
 q('progress').style.width=((n-1)/4*100)+'%';
}

document.getElementById('startBtn').onclick=()=>{
 q('welcome').classList.add('hidden');
 q('app').classList.remove('hidden');
 goToStep(1);
};

document.querySelectorAll('[data-step]').forEach(btn=>{
 btn.onclick=()=>goToStep(btn.dataset.step);
});

function scoreAnswer(text, cfg){
 const a = normalize(text);
 if(!a) return 0;

 let score=0;
 let matched=0;

 cfg.groups.forEach(g=>{
   if(g.some(k=>a.includes(k))) matched++;
 });

 if(matched>=cfg.groups.length && a.length>=cfg.minLen) score=3;
 else if(matched>=2) score=2;
 else if(matched>=1) score=1;

 return score;
}

function integrity(text){
 const a = normalize(text);
 if(!a) return {index:0,risk:"критичний"};

 let index=100;

 if(a.length<80) index-=30;
 if(new Set(a.split(" ")).size/a.split(" ").length<0.5) index-=20;

 if(index<40) return {index,risk:"критичний"};
 if(index<60) return {index,risk:"високий"};
 if(index<80) return {index,risk:"помірний"};

 return {index,risk:"низький"};
}

document.getElementById('resultBtn').onclick=()=>{
 const answers=[
   q('task1').value,
   q('task2').value,
   q('task3').value,
   q('task4').value
 ];

 let total=0;
 let report="";

 answers.forEach((a,i)=>{
   const cfg=CONFIG.tasks[i];
   const score=scoreAnswer(a,cfg);
   const integ=integrity(a);

   if(integ.risk==="критичний") total+=0;
   else total+=score;

   report+=`Завдання ${i+1}: ${score}/3 | індекс ${integ.index} | ризик ${integ.risk}\n`;
 });

 q('totalBig').textContent=total;
 q('feedbackBox').textContent=report;

 goToStep(5);
};
