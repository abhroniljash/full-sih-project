const fs = require('fs');
let css = fs.readFileSync('frontend/teacher-dashboard.css', 'utf8');

// Define the variables section
const variables = `
:root {
    --bg-primary: #f8fafc;
    --card-bg: #ffffff;
    --text-main: #1e293b;
    --text-muted: #64748b;
    --border-color: #e2e8f0;
    --input-bg: #ffffff;
    --hover-bg: #f1f5f9;
    --active-bg: #eef2ff;
}

body.dark-theme {
    --bg-primary: #0f172a;
    --card-bg: #1e293b;
    --text-main: #f1f5f9;
    --text-muted: #94a3b8;
    --border-color: #334155;
    --input-bg: #0f172a;
    --hover-bg: #334155;
    --active-bg: #312e81;
}
`;

// Remove the old dark theme section at the bottom
css = css.replace(/\/\* ========== DARK THEME ========== \*\/[\s\S]*$/, '');

// Insert variables after imports
css = css.replace(/(@import url.*?;)/, '$1\n' + variables);

// Replacements
css = css.replace(/background:\s*#f8fafc/g, 'background: var(--bg-primary)');
css = css.replace(/background:\s*#ffffff/g, 'background: var(--card-bg)');
css = css.replace(/background-color:\s*#ffffff/g, 'background-color: var(--card-bg)');
css = css.replace(/color:\s*#1e293b/g, 'color: var(--text-main)');
css = css.replace(/color:\s*#64748b/g, 'color: var(--text-muted)');
css = css.replace(/color:\s*#94a3b8/g, 'color: var(--text-muted)'); 
css = css.replace(/border-right:\s*1px solid #e2e8f0/g, 'border-right: 1px solid var(--border-color)');
css = css.replace(/border-bottom:\s*1px solid #e2e8f0/g, 'border-bottom: 1px solid var(--border-color)');
css = css.replace(/border:\s*1px solid #e2e8f0/g, 'border: 1px solid var(--border-color)');
css = css.replace(/border-color:\s*#e2e8f0/g, 'border-color: var(--border-color)');
css = css.replace(/background:\s*#f1f5f9/g, 'background: var(--hover-bg)');
css = css.replace(/background-color:\s*#f1f5f9/g, 'background-color: var(--hover-bg)');
css = css.replace(/background:\s*#eef2ff/g, 'background: var(--active-bg)');
css = css.replace(/background:\s*#fff/g, 'background: var(--card-bg)'); 

// Fill explicitly missing
css = css.replace(/\.form-input\s*{[\s\S]*?}/g, (match) => {
    return match.replace(/background:\s*var\(--card-bg\)/, 'background: var(--input-bg)')
                .replace(/color:\s*var\(--text-main\)/, 'color: var(--text-main)')
                .replace(/border:\s*1px solid var\(--border-color\)/, 'border: 1px solid var(--border-color)');
});

fs.writeFileSync('frontend/teacher-dashboard.css', css);
console.log('CSS Updated!');
