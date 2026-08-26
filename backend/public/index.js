const typingEl = document.getElementById('typing-text');

const attendanceWords = [
  "Attendance",        // English
  "उपस्थित",           // Hindi
  "উপস্থিত",           // Bengali
  "வருகை",             // Tamil
  "హాజరు",             // Telugu
  "उपस्थित",           // Marathi
  "હાજરી",             // Gujarati
  "ಹಾಜರಾತಿ",           // Kannada
  "ഹാജർ",              // Malayalam
  "ਹਾਜ਼ਰੀ"              // Punjabi
];

let wordIndex = 0;
let charIndex = 0;

const TYPE_SPEED = 90;
const HOLD_TIME = 1000;

function typeNextChar() {
  const currentWord = attendanceWords[wordIndex];

  if (charIndex < currentWord.length) {
    typingEl.textContent += currentWord[charIndex];
    charIndex++;
    setTimeout(typeNextChar, TYPE_SPEED);
  } else {
    setTimeout(switchWord, HOLD_TIME);
  }
}

function switchWord() {
  typingEl.textContent = "";
  charIndex = 0;
  wordIndex = (wordIndex + 1) % attendanceWords.length;
  typeNextChar();
}

typeNextChar();
