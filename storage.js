const q=id=>document.getElementById(id);
function saveDraft(){
  const data={
    code:q('studentCode').value,
    task1:q('task1').value,
    task2:q('task2').value,
    task3:q('task3').value,
    task4:q('task4').value
  };
  localStorage.setItem('draft',JSON.stringify(data));
}
setInterval(saveDraft,2000);

document.getElementById('clearBtn').onclick=()=>localStorage.clear();
