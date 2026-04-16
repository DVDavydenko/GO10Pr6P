function saveDraft() {
  const data = {
    task1: document.getElementById('task1')?.value || '',
    task2: document.getElementById('task2')?.value || '',
    task3: document.getElementById('task3')?.value || '',
    task4: document.getElementById('task4')?.value || ''
  };

  localStorage.setItem(CONFIG.storageKey || 'go10pr6p_draft_v1', JSON.stringify(data));

  const saveStatus = document.getElementById('saveStatus');
  if (saveStatus) {
    saveStatus.textContent = 'Дані збережено локально';
  }
}

function loadDraft() {
  const raw = localStorage.getItem(CONFIG.storageKey || 'go10pr6p_draft_v1');
  if (!raw) return;

  try {
    const data = JSON.parse(raw);

    if (document.getElementById('task1')) document.getElementById('task1').value = data.task1 || '';
    if (document.getElementById('task2')) document.getElementById('task2').value = data.task2 || '';
    if (document.getElementById('task3')) document.getElementById('task3').value = data.task3 || '';
    if (document.getElementById('task4')) document.getElementById('task4').value = data.task4 || '';
  } catch (error) {
    console.error('Помилка читання чернетки');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  loadDraft();

  ['task1', 'task2', 'task3', 'task4'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', saveDraft);
    }
  });
});
