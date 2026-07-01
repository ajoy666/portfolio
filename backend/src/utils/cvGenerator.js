const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const getDb = require('../config/db');

const OUTPUT_DIR = path.join(__dirname, '../../storage/app/public/cv');
const OUTPUT_PATH = path.join(OUTPUT_DIR, 'generated-cv.pdf');
const META_PATH = path.join(OUTPUT_DIR, 'cv-meta.json');

function ensureDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

function formatDate(dateStr) {
  if (!dateStr) return 'Present';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// Convert TipTap HTML to CV-friendly HTML with scoped inline styles
function sanitizeDescription(html) {
  if (!html) return '';
  return html;
}

async function fetchCvData(db) {
  const about = await db.get('SELECT * FROM abouts ORDER BY id ASC LIMIT 1');

  const socialLinks = await db.all(
    'SELECT * FROM social_links WHERE is_active = true ORDER BY "order" ASC'
  );

  const skillCategories = await db.all('SELECT * FROM skill_categories ORDER BY "order" ASC');

  const skills = await db.all(
    'SELECT * FROM skills WHERE is_active = true ORDER BY skill_category_id, "order" ASC'
  );

  const projects = await db.all(
    `SELECT * FROM projects WHERE status = 'published' ORDER BY "order" ASC`
  );

  const experiences = await db.all(
    `SELECT * FROM experiences WHERE is_active = true ORDER BY "order" ASC, id ASC`
  );

  const skillsByCategory = skillCategories
    .map((cat) => ({
      ...cat,
      skills: skills.filter((s) => s.skill_category_id === cat.id).map((s) => s.name),
    }))
    .filter((cat) => cat.skills.length > 0);

  return { about, socialLinks, skillsByCategory, projects, experiences };
}

function buildHtml({ about, socialLinks, skillsByCategory, projects, experiences }) {
  const contactParts = [];
  if (about?.email) contactParts.push(about.email);
  if (about?.location) contactParts.push(about.location);

  const githubLink = socialLinks.find((s) => s.platform === 'github');
  const linkedinLink = socialLinks.find((s) => s.platform === 'linkedin');
  const phoneLink = socialLinks.find((s) => s.platform === 'phone');

  if (phoneLink) contactParts.unshift(phoneLink.label || phoneLink.url);

  const socialParts = [
    githubLink ? githubLink.url.replace('https://', '') : null,
    linkedinLink ? linkedinLink.url.replace('https://www.', '') : null,
  ].filter(Boolean);

  const allContact = [...contactParts, ...socialParts].join('  |  ');

  // Experience section — dynamic from DB
  const experienceHtml = experiences
    .map((exp) => {
      const start = formatDate(exp.start_date);
      const end = formatDate(exp.end_date);
      const period = `${start} – ${end}`;
      const typeBadge = exp.type ? ` <span class="exp-type">(${exp.type})</span>` : '';

      return `
      <div class="exp-block">
        <div class="exp-row">
          <span class="exp-title">${exp.role}${typeBadge}</span>
          <span class="exp-date">${period}</span>
        </div>
        <div class="exp-co">${exp.company}${exp.location ? ` · ${exp.location}` : ''}</div>
        ${exp.description ? `<div class="exp-desc">${sanitizeDescription(exp.description)}</div>` : ''}
      </div>`;
    })
    .join('');

  // Skills section
  const skillsHtml = skillsByCategory
    .map(
      (cat) => `
      <div class="skill-row">
        <span class="skill-cat">${cat.name}:</span>
        <span class="skill-items"> ${cat.skills.join(', ')}</span>
      </div>`
    )
    .join('');

  // Projects section
  const projectsHtml = projects
    .map((p) => {
      let stack = [];
      try {
        stack = JSON.parse(p.tech_stack || '[]');
      } catch {}
      return `
      <div class="proj-item">
        <span class="proj-name">${p.title}:</span>
        <span class="proj-desc"> ${p.short_description}</span>
        ${stack.length ? `<span class="proj-tech"> (${stack.join(', ')})</span>` : ''}
      </div>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: Arial, sans-serif;
    font-size: 10.5pt;
    color: #1a1a1a;
    line-height: 1.45;
    padding: 36px 44px;
  }

  /* ── Header ── */
  .hdr-name    { font-size: 22pt; font-weight: bold; color: #1F3864; }
  .hdr-title   { font-size: 11pt; font-weight: bold; color: #444; margin-top: 3px; }
  .hdr-contact { font-size: 9.5pt; color: #555; margin-top: 5px; }
  .hdr-divider { border: none; border-top: 1.5px solid #ccc; margin: 10px 0 0 0; }

  /* ── Section headings ── */
  h2 {
    font-size: 10pt;
    font-weight: bold;
    color: #1F3864;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    border-bottom: 1.5px solid #1F3864;
    padding-bottom: 3px;
    margin: 18px 0 9px 0;
  }

  /* ── Summary ── */
  .summary { font-size: 10pt; line-height: 1.55; }

  /* ── Experience ── */
  .exp-block { margin-bottom: 12px; }
  .exp-row   { display: flex; justify-content: space-between; align-items: baseline; }
  .exp-title { font-weight: bold; font-size: 10.5pt; }
  .exp-type  { font-weight: normal; font-size: 9.5pt; color: #666; }
  .exp-date  { font-size: 9.5pt; color: #666; white-space: nowrap; margin-left: 12px; }
  .exp-co    { font-style: italic; color: #666; font-size: 10pt; margin: 2px 0 5px; }
  .exp-desc  { font-size: 10pt; line-height: 1.5; }

  /* TipTap HTML reset inside CV */
  .exp-desc ul, .exp-desc ol { padding-left: 16px; margin: 4px 0; }
  .exp-desc ul { list-style-type: disc; }
  .exp-desc ol { list-style-type: decimal; }
  .exp-desc li { margin-bottom: 2px; }
  .exp-desc p  { margin: 3px 0; }
  .exp-desc strong { font-weight: bold; }
  .exp-desc em { font-style: italic; }
  .exp-desc h2 { font-size: 10.5pt; font-weight: bold; margin: 6px 0 3px; border: none; letter-spacing: 0; text-transform: none; color: #1a1a1a; }
  .exp-desc blockquote { border-left: 2px solid #ccc; padding-left: 8px; color: #666; margin: 4px 0; }
  .exp-desc a { color: #1F3864; }

  /* ── Projects ── */
  .proj-item  { margin-bottom: 5px; font-size: 10pt; }
  .proj-name  { font-weight: bold; }
  .proj-tech  { font-style: italic; color: #666; font-size: 9.5pt; }
  .proj-intro { font-size: 9.5pt; color: #555; font-style: italic; margin-bottom: 7px; }

  /* ── Skills ── */
  .skill-row { margin-bottom: 4px; font-size: 10pt; }
  .skill-cat { font-weight: bold; }

  /* ── Education ── */
  .edu-block { margin-bottom: 9px; }
  .edu-row   { display: flex; justify-content: space-between; align-items: baseline; }
  .edu-title { font-weight: bold; }
  .edu-date  { font-size: 9.5pt; color: #666; white-space: nowrap; margin-left: 12px; }
  .edu-list  { padding-left: 16px; margin-top: 4px; list-style-type: disc; }
  .edu-list li { font-size: 10pt; margin-bottom: 2px; }
</style>
</head>
<body>

<div class="hdr-name">${about?.name || ''}</div>
<div class="hdr-title">${about?.tagline || 'Fullstack Developer'}</div>
<div class="hdr-contact">${allContact}</div>
<hr class="hdr-divider">

<h2>Summary</h2>
<p class="summary">${about?.bio || ''}</p>

<h2>Experience</h2>
${experienceHtml || '<p style="font-size:10pt;color:#999;">No experience data yet.</p>'}

<h2>Key Projects</h2>
<p class="proj-intro">Selected projects built and maintained collaboratively across various internal business needs.</p>
${projectsHtml}

<h2>Skills</h2>
${skillsHtml}

<h2>Education</h2>
<div class="edu-block">
  <div class="edu-row">
    <span class="edu-title">Universitas Islam Indonesia — Bachelor's Degree, Informatics</span>
    <span class="edu-date">2015 – 2022</span>
  </div>
  <ul class="edu-list">
    <li>GPA: 3.66</li>
    <li>Head of Social &amp; Religious Division, Informatics Student Association (2017–2018)</li>
    <li>Member, Informatics Student Association — Talent &amp; Creativity Division (2016–2017)</li>
  </ul>
</div>

<h2>Certificates</h2>
<ul class="edu-list">
  <li>Adobe Certified Associate — Graphic Design and Illustration using Adobe Illustrator CS6 (2017)</li>
  <li>Course Certificate, LearnTelehealth — Telehealth Technology (2017)</li>
</ul>

</body>
</html>`;
}

async function generate() {
  ensureDir();
  const db = await getDb();
  const data = await fetchCvData(db);
  const html = buildHtml(data);

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: OUTPUT_PATH,
      format: 'A4',
      margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
      printBackground: false,
    });
  } finally {
    await browser.close();
  }

  const meta = {
    generated_at: new Date().toISOString(),
    size: fs.statSync(OUTPUT_PATH).size,
  };
  fs.writeFileSync(META_PATH, JSON.stringify(meta, null, 2));

  return meta;
}

function getMeta() {
  try {
    if (fs.existsSync(META_PATH)) {
      return JSON.parse(fs.readFileSync(META_PATH, 'utf-8'));
    }
  } catch {}
  return null;
}

function exists() {
  return fs.existsSync(OUTPUT_PATH);
}

function getOutputPath() {
  return OUTPUT_PATH;
}

module.exports = { generate, getMeta, exists, getOutputPath };
