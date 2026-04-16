const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwhOqjVWhpmB0ti0BONjVQzimJHEvQ3dFyP_P1tQdtJbnmJ-EjP1MceNaPRxgbRGkVl/exec';

async function sendToGoogleSheets(payload) {
  const res = await fetch(WEB_APP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return await res.json();
}
