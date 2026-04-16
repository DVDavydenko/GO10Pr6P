const q = (id) => document.getElementById(id);

const EXAM_DURATION_SECONDS = 30 * 60;
let timerInterval = null;
let timeLeft = EXAM_DURATION_SECONDS;

function normalize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/’/g, "'")
    .replace(/`/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function isValidStudentCode(code) {
  const value = (code || '').trim();
  return /^[A-Za-zА-Яа-яІіЇїЄєҐґ0-9_-]{3,20}$/.test(value);
}

function showCodeValidationState(isValid) {
  const input = q('studentCode');
  const hint = q('codeHint');

  if (!input || !hint) return;

  if (isValid) {
    input.classList.remove('invalid');
    hint.textContent = 'Код прийнято. Можна розпочинати роботу.';
  } else {
    input.classList.add('invalid');
    hint.textContent = 'Введіть коректний код: 3–20 символів, без пробілів на початку та в кінці.';
  }
}

function goToStep(stepNumber) {
  document.querySelectorAll('.step').forEach((step) => step.classList.add('hidden'));

  const target = q(`step-${stepNumber}`);
  if (target) target.classList.remove('hidden');

  const progress = ((stepNumber - 1) / 4) * 100;
  if (q('progress')) q('progress').style.width = `${progress}%`;
  if (q('stepLabel')) q('stepLabel').textContent = `Крок ${stepNumber} із 5`;
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function updateTimerUI() {
  const timerBox = q('timerBox');
  if (!timerBox) return;

  timerBox.textContent = formatTime(timeLeft);
  timerBox.classList.remove('warning', 'danger');

  if (timeLeft <= 300) {
    timerBox.classList.add('danger');
  } else if (timeLeft <= 900) {
    timerBox.classList.add('warning');
  }
}

function startTimer() {
  stopTimer();
  updateTimerUI();

  timerInterval = setInterval(() => {
    timeLeft -= 1;
    if (timeLeft < 0) timeLeft = 0;

    updateTimerUI();

    if (timeLeft === 0) {
      stopTimer();
      if (q('resultBtn') && !q('step-5').classList.contains('hidden')) return;
      if (q('resultBtn')) q('resultBtn').click();
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function countMatchedGroups(answer, groups) {
  const normalized = normalize(answer);
  let matched = 0;

  groups.forEach((group) => {
    if (group.some((keyword) => normalized.includes(normalize(keyword)))) {
      matched += 1;
    }
  });

  return matched;
}

function countRights(answer) {
  const normalized = normalize(answer);
  let count = 0;

  (CONFIG.rights || []).forEach((item) => {
    if (normalized.includes(normalize(item))) count += 1;
  });

  return count;
}

function countInstitutions(answer) {
  const normalized = normalize(answer);
  let count = 0;

  (CONFIG.institutions || []).forEach((item) => {
    if (normalized.includes(normalize(item))) count += 1;
  });

  return count;
}

function uniqueWordRatio(answer) {
  const words = normalize(answer).split(' ').filter(Boolean);
  if (!words.length) return 0;
  return new Set(words).size / words.length;
}

function repeatedKeywordPenalty(answer) {
  const normalized = normalize(answer);
  const keywords = [
    'фактори виробництва',
    'обмеженість',
    'раціональне споживання',
    'скляна стеля',
    'набу',
    'назк',
    'сап',
    'хабар'
  ];

  let penalty = 0;

  keywords.forEach((keyword) => {
    const count = normalized.split(normalize(keyword)).length - 1;
    if (count >= 5) {
      penalty += Math.min(15, (count - 4) * 3);
    }
  });

  return penalty;
}

function similarityScore(answer, references = []) {
  const words = normalize(answer).split(' ').filter((w) => w.length > 3);
  if (!words.length || !references.length) return 0;

  let best = 0;

  references.forEach((reference) => {
    const refSet = new Set(
      normalize(reference).split(' ').filter((w) => w.length > 3)
    );

    let hits = 0;
    const seen = new Set();

    words.forEach((word) => {
      if (refSet.has(word) && !seen.has(word)) {
        hits += 1;
        seen.add(word);
      }
    });

    const score = hits / Math.max(14, refSet.size);
    if (score > best) best = score;
  });

  return Math.min(1, best);
}

function integrityAnalysis(answer, references = []) {
  const normalized = normalize(answer);

  if (!normalized) {
    return {
      index: 0,
      risk: 'критичний',
      flags: ['Немає відповіді']
    };
  }

  let index = 100;
  const flags = [];

  const length = normalized.length;
  const uniqueRatio = uniqueWordRatio(answer);
  const similarity = similarityScore(answer, references);
  const spamPenalty = repeatedKeywordPenalty(answer);

  if (length < 70) {
    index -= 35;
    flags.push('Дуже коротка відповідь');
  } else if (length < 120) {
    index -= 18;
    flags.push('Коротка відповідь');
  }

  if (uniqueRatio < 0.42) {
    index -= 18;
    flags.push('Низька мовна різноманітність');
  } else if (uniqueRatio < 0.52) {
    index -= 8;
  }

  if (similarity > 0.8) {
    index -= 28;
    flags.push('Надто близько до еталонного формулювання');
  } else if (similarity > 0.66) {
    index -= 14;
    flags.push('Високий збіг з еталонною моделлю');
  }

  if (spamPenalty > 0) {
    index -= spamPenalty;
    flags.push('Є ознаки набивання ключових слів');
  }

  index = Math.max(0, Math.min(100, Math.round(index)));

  let risk = 'низький';
  if (index < 78) risk = 'помірний';
  if (index < 58) risk = 'високий';
  if (index < 36) risk = 'критичний';

  return { index, risk, flags };
}

function scoreTask1(answer, taskConfig) {
  const text = normalize(answer);
  const coverage = countMatchedGroups(answer, taskConfig.groups);
  const length = text.length;
  const hasExample =
    text.includes('наприклад') ||
    text.includes('я б узяв') ||
    text.includes('я б взяла') ||
    text.includes('я обираю');

  if (coverage >= 4 && length >= taskConfig.minLen && hasExample) return 3;
  if (coverage >= 3 && length >= 140) return 2;
  if (coverage >= 2 && length >= 70) return 1;
  return 0;
}

function scoreTask2(answer, taskConfig) {
  const text = normalize(answer);
  const coverage = countMatchedGroups(answer, taskConfig.groups);
  const length = text.length;

  const habitHits = [
    'вимикаю',
    'сортую',
    'багаторазов',
    'торбин',
    'батарей',
    'економія',
    'пляшк',
    'пакет',
    'смітт',
    'світло',
    'вода',
    'не купувати зайвого'
  ];

  let habits = 0;
  habitHits.forEach((hit) => {
    if (text.includes(hit)) habits += 1;
  });

  if (coverage >= 3 && habits >= 3 && length >= taskConfig.minLen) return 3;
  if (coverage >= 2 && habits >= 2 && length >= 90) return 2;
  if (coverage >= 1 && length >= 50) return 1;
  return 0;
}

function scoreTask3(answer, taskConfig) {
  const text = normalize(answer);
  const coverage = countMatchedGroups(answer, taskConfig.groups);
  const length = text.length;
  const rightsCount = countRights(answer);

  const stateActions = [
    'звітн',
    'моніторинг',
    'податков',
    'пільг',
    'контрол',
    'прозор',
    'рівну оплату',
    'керівн',
    'підтрим'
  ];

  let actions = 0;
  stateActions.forEach((item) => {
    if (text.includes(item)) actions += 1;
  });

  if (coverage >= 4 && rightsCount >= 4 && actions >= 1 && length >= taskConfig.minLen) return 3;
  if (coverage >= 3 && rightsCount >= 2 && length >= 140) return 2;
  if ((coverage >= 2 || rightsCount >= 2) && length >= 80) return 1;
  return 0;
}

function scoreTask4(answer, taskConfig) {
  const text = normalize(answer);
  const length = text.length;
  const institutionsCount = countInstitutions(answer);

  const functionHits = [
    'розсліду',
    'перевіряє декларації',
    'підтримує обвинувачення',
    'управління арештованими активами',
    'функц'
  ];

  const argumentHits = [
    'довір',
    'бюджет',
    'прозор',
    'економік',
    'суспіль',
    'нульова толерантність',
    'менше корупц',
    'справедлив'
  ];

  let functionsFound = 0;
  let argumentsFound = 0;

  functionHits.forEach((item) => {
    if (text.includes(item)) functionsFound += 1;
  });

  argumentHits.forEach((item) => {
    if (text.includes(item)) argumentsFound += 1;
  });

  if (institutionsCount >= 3 && functionsFound >= 1 && argumentsFound >= 2 && length >= taskConfig.minLen) return 3;
  if (institutionsCount >= 2 && (functionsFound >= 1 || argumentsFound >= 1) && length >= 110) return 2;
  if (institutionsCount >= 1 && length >= 60) return 1;
  return 0;
}

function scoreAnswer(answer, taskConfig, index) {
  let score = 0;

  if (index === 0) score = scoreTask1(answer, taskConfig);
  if (index === 1) score = scoreTask2(answer, taskConfig);
  if (index === 2) score = scoreTask3(answer, taskConfig);
  if (index === 3) score = scoreTask4(answer, taskConfig);

  const integrity = integrityAnalysis(answer, taskConfig.references || []);

  if (integrity.risk === 'критичний') score = 0;
  else if (integrity.risk === 'високий' && score > 1) score -= 1;

  return Math.max(0, Math.min(taskConfig.max, score));
}

function buildFeedback(scores, integrityList, avgIntegrity, worstRisk, sentSuccessfully) {
  const lines = [];
  lines.push(`Індекс доброчесності: ${avgIntegrity}/100`);
  lines.push(`Рівень ризику: ${worstRisk}`);
  lines.push('');

  integrityList.forEach((item, index) => {
    lines.push(`Завдання ${index + 1}: ${scores[index]}/3 • індекс ${item.index}/100 • ризик: ${item.risk}`);
  });

  lines.push('');
  lines.push(sentSuccessfully ? 'Дані успішно передано в систему.' : 'Виникла помилка передавання даних у систему.');

  return lines.join('\n');
}

function collectPayload(scores, total, avgIntegrity, worstRisk) {
  return {
    studentCode: q('studentCode').value.trim(),
    task1: q('task1').value,
    task2: q('task2').value,
    task3: q('task3').value,
    task4: q('task4').value,
    autoScore1: scores[0],
    autoScore2: scores[1],
    autoScore3: scores[2],
    autoScore4: scores[3],
    autoTotal: total,
    integrityIndex: avgIntegrity,
    riskLevel: worstRisk
  };
}

window.addEventListener('DOMContentLoaded', () => {
  const startBtn = q('startBtn');
  const resultBtn = q('resultBtn');
  const downloadBtn = q('downloadBtn');
  const studentCodeInput = q('studentCode');

  updateTimerUI();

  if (studentCodeInput) {
    studentCodeInput.addEventListener('input', () => {
      const isValid = isValidStudentCode(studentCodeInput.value);
      if (studentCodeInput.value.trim() === '') {
        studentCodeInput.classList.remove('invalid');
        if (q('codeHint')) q('codeHint').textContent = 'Введіть ваш навчальний код для початку роботи.';
        return;
      }
      showCodeValidationState(isValid);
    });
  }

  if (startBtn) {
    startBtn.onclick = () => {
      const code = q('studentCode') ? q('studentCode').value.trim() : '';
      const isValid = isValidStudentCode(code);

      if (!isValid) {
        showCodeValidationState(false);
        return;
      }

      showCodeValidationState(true);
      q('welcome').classList.add('hidden');
      q('app').classList.remove('hidden');
      goToStep(1);
      startTimer();
    };
  }

  document.querySelectorAll('[data-step]').forEach((btn) => {
    btn.onclick = () => goToStep(Number(btn.dataset.step));
  });

  if (resultBtn) {
    resultBtn.onclick = async () => {
      stopTimer();

      const answers = [
        q('task1').value,
        q('task2').value,
        q('task3').value,
        q('task4').value
      ];

      const scores = [];
      const integrityList = [];
      let total = 0;

      answers.forEach((answer, index) => {
        const taskConfig = CONFIG.tasks[index];
        const integrity = integrityAnalysis(answer, taskConfig.references || []);
        const score = scoreAnswer(answer, taskConfig, index);

        integrityList.push(integrity);
        scores.push(score);
        total += score;
      });

      const avgIntegrity = Math.round(
        integrityList.reduce((sum, item) => sum + item.index, 0) / integrityList.length
      );

      let worstRisk = 'низький';
      if (integrityList.some((item) => item.risk === 'критичний')) worstRisk = 'критичний';
      else if (integrityList.some((item) => item.risk === 'високий')) worstRisk = 'високий';
      else if (integrityList.some((item) => item.risk === 'помірний')) worstRisk = 'помірний';

      q('s1').textContent = scores[0];
      q('s2').textContent = scores[1];
      q('s3').textContent = scores[2];
      q('s4').textContent = scores[3];
      q('totalBigInline').textContent = total;

      const payload = collectPayload(scores, total, avgIntegrity, worstRisk);

      let sentSuccessfully = false;
      try {
        await sendToGoogleSheets(payload);
        sentSuccessfully = true;
      } catch (error) {
        sentSuccessfully = false;
      }

      q('feedbackBox').textContent = buildFeedback(scores, integrityList, avgIntegrity, worstRisk, sentSuccessfully);

      if (q('studentMessage')) {
        q('studentMessage').textContent = sentSuccessfully
          ? 'Дякуємо. Ваші відповіді успішно надіслано в систему. Після перевірки вчителем результат буде відображено у встановленому порядку.'
          : 'Дякуємо. Попередній результат сформовано, але під час передавання даних у систему виникла технічна проблема. Повідомте про це вчителя.';
      }

      goToStep(5);
    };
  }

  if (downloadBtn) {
    downloadBtn.onclick = () => {
      const report = q('feedbackBox').textContent || 'Звіт відсутній';
      const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'zvit_praktychna_robota.txt';
      link.click();
      URL.revokeObjectURL(link.href);
    };
  }
});
