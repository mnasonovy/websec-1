const leftInput = document.getElementById('leftOperand');
const rightInput = document.getElementById('rightOperand');
const operatorSelect = document.getElementById('operator');
const calculateBtn = document.getElementById('calculateBtn');
const resultsBox = document.getElementById('results');
const leftError = document.getElementById('leftError');
const rightError = document.getElementById('rightError');

const history = [];
const MAX_HISTORY = 4;

function sanitizeValue(rawValue) {
  let value = rawValue.replace(',', '.');
  value = value.replace(/[^\d.\-]/g, '');

  if (value.includes('-')) {
    value = (value.startsWith('-') ? '-' : '') + value.slice(value.startsWith('-') ? 1 : 0).replace(/-/g, '');
  }

  const firstDotIndex = value.indexOf('.');
  if (firstDotIndex !== -1) {
    value = value.slice(0, firstDotIndex + 1) + value.slice(firstDotIndex + 1).replace(/\./g, '');
  }

  return value;
}

function formatNumber(number) {
  if (!Number.isFinite(number)) {
    return String(number);
  }

  if (Math.abs(number) >= 1e12 || (Math.abs(number) > 0 && Math.abs(number) < 1e-6)) {
    return number.toExponential(6).replace(/\.0+e/, 'e').replace(/(\.[0-9]*?)0+e/, '$1e');
  }

  return Number(number.toFixed(10)).toString();
}

function parseAndValidate(inputElement, errorElement) {
  const rawValue = inputElement.value.trim();

  if (rawValue === '') {
    showError(inputElement, errorElement, 'Введите число');
    return { valid: false };
  }

  if (rawValue === '-' || rawValue === '.' || rawValue === '-.') {
    showError(inputElement, errorElement, 'Число введено не полностью');
    return { valid: false };
  }

  const numericPattern = /^-?\d+(\.\d+)?$/;
  if (!numericPattern.test(rawValue)) {
    showError(inputElement, errorElement, 'Допустимы только числа');
    return { valid: false };
  }

  const value = Number(rawValue);
  if (!Number.isFinite(value)) {
    showError(inputElement, errorElement, 'Слишком большое значение');
    return { valid: false };
  }

  clearError(inputElement, errorElement);
  return { valid: true, value };
}

function showError(inputElement, errorElement, message) {
  inputElement.classList.add('invalid');
  errorElement.textContent = message;
}

function clearError(inputElement, errorElement) {
  inputElement.classList.remove('invalid');
  errorElement.textContent = '';
}

function renderHistory() {
  if (history.length === 0) {
    resultsBox.innerHTML = '<div class="results-empty">Здесь появятся результаты вычислений</div>';
    return;
  }

  resultsBox.innerHTML = history
    .map((item, index) => {
      const className = index === history.length - 1 ? 'current' : 'previous';
      return `<div class="result-line ${className}">${item}</div>`;
    })
    .join('');
}

function calculate() {
  const left = parseAndValidate(leftInput, leftError);
  const right = parseAndValidate(rightInput, rightError);

  if (!left.valid || !right.valid) {
    return;
  }

  if (operatorSelect.value === '/' && right.value === 0) {
    showError(rightInput, rightError, 'На ноль делить нельзя');
    return;
  }

  clearError(rightInput, rightError);

  let result;
  switch (operatorSelect.value) {
    case '+':
      result = left.value + right.value;
      break;
    case '-':
      result = left.value - right.value;
      break;
    case '*':
      result = left.value * right.value;
      break;
    case '/':
      result = left.value / right.value;
      break;
    default:
      return;
  }

  const expression = `${formatNumber(left.value)} ${operatorSelect.value} ${formatNumber(right.value)} = ${formatNumber(result)}`;
  history.push(expression);

  if (history.length > MAX_HISTORY) {
    history.shift();
  }

  renderHistory();
}

function handleSanitizedInput(event, errorElement) {
  const previousCursor = event.target.selectionStart;
  const originalLength = event.target.value.length;
  const sanitized = sanitizeValue(event.target.value);

  if (sanitized !== event.target.value) {
    event.target.value = sanitized;
    const delta = originalLength - sanitized.length;
    const nextCursor = Math.max((previousCursor ?? sanitized.length) - delta, 0);
    event.target.setSelectionRange(nextCursor, nextCursor);
  }

  clearError(event.target, errorElement);
}

function resetOnLoad() {
  leftInput.value = '';
  rightInput.value = '';
  operatorSelect.value = '+';

  clearError(leftInput, leftError);
  clearError(rightInput, rightError);

  history.length = 0; // очищаем массив истории
  renderHistory();
}

[
  [leftInput, leftError],
  [rightInput, rightError]
].forEach(([input, errorElement]) => {
  input.addEventListener('input', (event) => handleSanitizedInput(event, errorElement));
  input.addEventListener('blur', () => parseAndValidate(input, errorElement));
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      calculate();
    }
  });
  input.addEventListener('paste', (event) => {
    event.preventDefault();
    const pastedText = (event.clipboardData || window.clipboardData).getData('text');
    const sanitized = sanitizeValue(pastedText);
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    const nextValue = input.value.slice(0, start) + sanitized + input.value.slice(end);
    input.value = sanitizeValue(nextValue);
    const cursor = start + sanitized.length;
    input.setSelectionRange(cursor, cursor);
    clearError(input, errorElement);
  });
});

calculateBtn.addEventListener('click', calculate);
operatorSelect.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    calculate();
  }
});

window.addEventListener('DOMContentLoaded', resetOnLoad);
window.addEventListener('pageshow', resetOnLoad);