function saveDraft() {
  const data = {
    code: document.getElementById('studentCode')?.value || '',
    task1: document.getElementById('task1')?.value || '',
    task2: document.getElementById('task2')?.value || '',
    task3: document.getElementById('task3')?.value || '',
    task4: document.getElementById('task4')?.value || ''
  };

  localStorage.setItem(CONFIG.storageKey || 'go10pr6p_draft_v1', JSON.stringify(data));

  const saveStatus = document.getElementById('saveStatus');
  if (saveStatus) {
    saveStatus.textContent = 'Чернетку збережено локально';
  }
}

function loadDraft() {
  const raw = localStorage.getItem(CONFIG.storageKey || 'go10pr6p_draft_v1');
  if (!raw) return;

  try {
    const data = JSON.parse(raw);

    if (document.getElementById('studentCode')) document.getElementById('studentCode').value = data.code || '';
    if (document.getElementById('task1')) document.getElementById('task1').value = data.task1 || '';
    if (document.getElementById('task2')) document.getElementById('task2').value = data.task2 || '';
    if (document.getElementById('task3')) document.getElementById('task3').value = data.task3 || '';
    if (document.getElementById('task4')) document.getElementById('task4').value = data.task4 || '';
  } catch (error) {
    console.error('Помилка читання чернетки:', error);
  }
}

function clearDraft() {
  localStorage.removeItem(CONFIG.storageKey || 'go10pr6p_draft_v1');

  ['studentCode', 'task1', 'task2', 'task3', 'task4'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  const saveStatus = document.getElementById('saveStatus');
  if (saveStatus) {
    saveStatus.textContent = 'Чернетку очищено';
  }
}

window.addEventListener('DOMContentLoaded', () => {
  loadDraft();

  const clearBtn = document.getElementById('clearBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', clearDraft);
  }

  ['studentCode', 'task1', 'task2', 'task3', 'task4'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', saveDraft);
    }
  });
});
