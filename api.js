const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwhOqjVWhpmB0ti0BONjVQzimJHEvQ3dFyP_P1tQdtJbnmJ-EjP1MceNaPRxgbRGkVl/exec';

async function sendToGoogleSheets(payload) {
  const response = await fetch(WEB_APP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const result = await response.json();
  return result;
}
