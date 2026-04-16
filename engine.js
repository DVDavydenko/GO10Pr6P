function normalize(t){return t.toLowerCase();}

function goToStep(n){
 document.querySelectorAll('.step').forEach(e=>e.classList.add('hidden'));
 const el=document.getElementById('step-'+n);
 if(el)el.classList.remove('hidden');
 document.getElementById('progress').style.width=((n-1)/4*100)+'%';
}

document.getElementById('startBtn').onclick=()=>{
 document.getElementById('welcome').classList.add('hidden');
 document.getElementById('app').classList.remove('hidden');
 goToStep(1);
};

document.querySelectorAll('[data-step]').forEach(btn=>{
 btn.onclick=()=>goToStep(btn.dataset.step);
});

document.getElementById('resultBtn').onclick=()=>{
 document.getElementById('totalBig').textContent='12';
 goToStep(5);
};
