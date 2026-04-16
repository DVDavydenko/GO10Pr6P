const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwhOqjVWhpmB0ti0BONjVQzimJHEvQ3dFyP_P1tQdtJbnmJ-EjP1MceNaPRxgbRGkVl/exec';

async function sendToGoogleSheets(payload) {
  const response = await fetch(WEB_APP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    },
    body: JSON.stringify(payload)
  });

  const rawText = await response.text();
  console.log('GAS raw response:', rawText);

  let result;
  try {
    result = JSON.parse(rawText);
  } catch (e) {
    throw new Error('GAS повернув не JSON: ' + rawText);
  }

  if (!result.ok) {
    throw new Error(result.error || 'Невідома помилка GAS');
  }

  return result;
}
