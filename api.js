const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwhOqjVWhpmB0ti0BONjVQzimJHEvQ3dFyP_P1tQdtJbnmJ-EjP1MceNaPRxgbRGkVl/exec';

async function postToGAS(payload) {
  const response = await fetch(WEB_APP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    },
    body: JSON.stringify(payload)
  });

  const rawText = await response.text();

  let result;
  try {
    result = JSON.parse(rawText);
  } catch (error) {
    throw new Error('GAS повернув не JSON');
  }

  if (!result.ok) {
    throw new Error(result.error || 'Невідома помилка GAS');
  }

  return result;
}

async function validateStudentCode(code) {
  return await postToGAS({
    action: 'validateCode',
    studentCode: code
  });
}

async function sendToGoogleSheets(payload) {
  return await postToGAS({
    action: 'submitWork',
    ...payload
  });
}
