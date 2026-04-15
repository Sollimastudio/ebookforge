# EbookForge - Quick Test Checklist

## 🎯 FASE 4.1: Complete Workflow Test

### Test 1: Create & Auto-Save (3 min)
- [ ] App loads without errors
- [ ] Click "Criar Novo Ebook" or start from dashboard
- [ ] Enter title in dialog
- [ ] Click create/confirm
- [ ] Type content (min 50 words, 2+ headings)
- [ ] Watch "Salvando..." appear in toolbar
- [ ] Stop typing
- [ ] Badge shows "💾 Auto-salvo"

**Expected**: Content persists after refresh

---

### Test 2: Statistics Panel (2 min)
- [ ] Right sidebar shows metrics:
  - Word count (matches manual count)
  - Character count
  - Reading time (correct calculation)
  - Paragraphs count
  - Headings count (matches H1+H2+H3)
  - Images (should be 0)
- [ ] Metrics update in real-time as you type

**Expected**: All values accurate and updating

---

### Test 3: Table of Contents (2 min)
- [ ] Click 📑 button in toolbar
- [ ] Modal opens with fade-in animation
- [ ] All headings listed with hierarchy
- [ ] Shows "X títulos encontrados"
- [ ] Click "Inserir Sumário no Documento"
- [ ] TOC inserted as formatted list
- [ ] Can close with ✕ button or click outside

**Expected**: TOC appears in editor as numbered list

---

### Test 4: Export JSON Backup (2 min)
- [ ] Sidebar → "Backup Completo" button
- [ ] File named `backup_TIMESTAMP.json` downloads
- [ ] Open in text editor
- [ ] Contains valid JSON array with project data

**Expected**: File contains correct structure and content

---

### Test 5: Import JSON Backup (2 min)
- [ ] Sidebar → "Importar Backup"
- [ ] Select the backup_*.json file
- [ ] Project appears in sidebar
- [ ] Content matches original

**Expected**: Imported project is identical to exported

---

### Test 6: Export PDF (3 min)
- [ ] Sidebar → "Exportar PDF" button
- [ ] "Renderizando Ebook de Alta Resolução..." overlay shows
- [ ] File named `[Title].pdf` downloads
- [ ] Wait ~3-5 seconds
- [ ] Open PDF file
- [ ] Content renders correctly
- [ ] No garbled text or layout issues
- [ ] Multiple pages if content > 1 page
- [ ] Check PDF properties (Cmd+Enter on Mac):
  - Title field has ebook title
  - Author = "EbookForge"
  - Subject = "Ebook criado com EbookForge"

**Expected**: High-quality PDF with correct metadata

---

### Test 7: Export HTML (1 min)
- [ ] Sidebar → "Exportar HTML"
- [ ] File named `[Title].html` downloads
- [ ] Open file in browser
- [ ] Content displays with formatting
- [ ] Headings size correct
- [ ] Bold/italic preserved
- [ ] Links clickable
- [ ] No broken styles

**Expected**: HTML is well-formatted and styled

---

### Test 8: Export Single Project (1 min)
- [ ] Sidebar → "Exportar Este" button
- [ ] File named `[Title].ebookforge` downloads
- [ ] File is valid JSON (can open in editor)
- [ ] Contains project data (title, content, id)

**Expected**: Single project exported correctly

---

## 🎯 FASE 4.2: Responsiveness Test

### Desktop (1920px)
- [ ] DevTools → Select 1920x1080 viewport
- [ ] Layout: 2 columns (editor + stats)
- [ ] No horizontal scroll
- [ ] Sidebar visible
- [ ] Toolbar fits on one line
- [ ] All text readable

**Expected**: Full layout 2-column ideal

---

### Tablet (768px)
- [ ] DevTools → Select 768x1024 viewport
- [ ] Layout adapts (may stack)
- [ ] Stats sidebar accessible
- [ ] Editor is main focus
- [ ] Buttons clickable (44px minimum)
- [ ] No text overflow

**Expected**: Layout responsive, all controls accessible

---

### Mobile (375px)
- [ ] DevTools → Select 375x667 viewport (iPhone)
- [ ] No horizontal scroll
- [ ] Sidebar may be drawer/collapsed
- [ ] Editor visible and editable
- [ ] Toolbar buttons accessible
- [ ] Text ≥ 14px
- [ ] Tap targets ≥ 44x44px

**Expected**: Mobile-friendly, single column layout

---

## ⌨️ Keyboard Shortcuts

- [ ] Press Ctrl+S (or Cmd+S on Mac)
  → "Salvando..." indicator appears
  
- [ ] Press Ctrl+E (or Cmd+E on Mac)
  → Table of Contents modal opens/closes

**Expected**: Shortcuts work cross-platform

---

## ✅ Final Checklist

### No Errors
- [ ] No errors in DevTools console
- [ ] No warnings (except Tailwind unused)
- [ ] No network errors
- [ ] No 404s

### Performance
- [ ] App responsive (no lag)
- [ ] Saves complete without delay
- [ ] Exports complete within 5 seconds
- [ ] Animations smooth (no jank)

### Functionality
- [ ] All 8 workflow tests pass
- [ ] All 3 responsiveness tests pass
- [ ] No data loss on refresh
- [ ] All exports open correctly

### UX Polish
- [ ] Visual feedback smooth
- [ ] Animations professional
- [ ] Text readable in all themes
- [ ] No UI overlap or cutoff

---

## 🐛 Issue Template

If you find an issue, note down:

```
Title: [Short description]
Severity: Critical / High / Medium / Low
Platform: [Desktop/Tablet/Mobile]
Browser: [Chrome/Firefox/Safari]
Steps:
1. [First step]
2. [Second step]
3. [Reproduce step]
Expected: [What should happen]
Actual: [What happened]
Screenshot: [If possible]
```

---

## 📊 Results

```
Start Time: __:__
End Time:   __:__
Duration:   __ min

Tests Passed: __ / 20
Tests Failed: __ / 20
Pass Rate: __%

Critical Issues: __
High Issues:     __
Medium Issues:   __
Low Issues:      __
```

---

**Test Date**: 2026-04-15
**Tester**: [Your Name]
**Status**: IN PROGRESS 🔄
