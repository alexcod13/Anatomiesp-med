/**
 * ANATOMIE RÉVISION - Application de cours
 */

// ================================================
// Initialization
// ================================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initSidebarToggle();
  initAccordions();
  initTreeViews();
  initSearch();
  initMobileMenu();
  initNavGroups();
  initSmoothScroll();
  initHashAnchor();
});

// ================================================
// Hash anchor: open parent accordions + scroll + flash highlight
// ================================================
function revealAnchor(hash) {
  if (!hash || hash.length < 2) return;
  const target = document.querySelector(hash);
  if (!target) return;
  let el = target;
  while (el && el !== document.body) {
    if (el.classList?.contains('accordion-item')) el.classList.add('open');
    el = el.parentElement;
  }
  setTimeout(() => {
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.classList.add('anchor-flash');
    setTimeout(() => target.classList.remove('anchor-flash'), 2500);
  }, 100);
}

function initHashAnchor() {
  if (location.hash) revealAnchor(location.hash);
  window.addEventListener('hashchange', () => revealAnchor(location.hash));
}

// ================================================
// Theme Toggle
// ================================================
function initTheme() {
  const saved = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });
}

// ================================================
// Accordions (Menus déroulants)
// ================================================
function initAccordions() {
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      const wasOpen = item.classList.contains('open');
      
      // Close all siblings (optional - comment out for multiple open)
      // item.parentElement.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('open'));
      
      // Toggle current
      item.classList.toggle('open', !wasOpen);
    });
  });
  
  // Open first accordion by default
  document.querySelectorAll('.accordion').forEach(accordion => {
    const first = accordion.querySelector('.accordion-item');
    if (first) first.classList.add('open');
  });
}

// ================================================
// Tree Views (Arborescences)
// ================================================
function initTreeViews() {
  document.querySelectorAll('.tree-label.expandable').forEach(label => {
    label.addEventListener('click', () => {
      const node = label.parentElement;
      node.classList.toggle('expanded');
    });
  });
  
  // Expand first level by default
  document.querySelectorAll('.tree-root').forEach(root => {
    root.classList.add('expanded');
    // Also expand first children
    root.querySelectorAll(':scope > .tree-children > .tree-node').forEach(node => {
      if (node.querySelector('.tree-children')) {
        node.classList.add('expanded');
      }
    });
  });
}

// ================================================
// Search
// ================================================
let searchIndex = [];

function initSearch() {
  buildSearchIndex();
  
  const searchInputs = document.querySelectorAll('[data-search]');
  const resultsPanel = document.getElementById('search-results');
  
  searchInputs.forEach(input => {
    input.addEventListener('input', (e) => {
      const query = e.target.value.trim().toLowerCase();
      if (query.length < 2) {
        hideSearchResults();
        return;
      }
      const results = performSearch(query);
      showSearchResults(results, query);
    });
    
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        hideSearchResults();
        input.value = '';
      }
    });
  });
  
  // Close on click outside
  resultsPanel?.addEventListener('click', (e) => {
    if (e.target === resultsPanel) hideSearchResults();
  });
  
  // Keyboard shortcut (Ctrl+K)
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      document.querySelector('[data-search]')?.focus();
    }
  });
}

function buildSearchIndex() {
  // Index current page content
  document.querySelectorAll('h2, h3, h4, .box, p, td').forEach(el => {
    const text = el.textContent.trim();
    if (text.length > 10) {
      const section = el.closest('section');
      const heading = section?.querySelector('h2, h3')?.textContent || '';
      searchIndex.push({
        text: text.substring(0, 300),
        heading,
        element: el,
        id: section?.id || ''
      });
    }
  });
}

function performSearch(query) {
  const terms = query.split(/\s+/).filter(t => t.length > 1);
  const results = [];
  
  searchIndex.forEach(item => {
    const textLower = item.text.toLowerCase();
    let score = 0;
    
    terms.forEach(term => {
      if (textLower.includes(term)) score += 1;
      if (item.heading.toLowerCase().includes(term)) score += 3;
    });
    
    if (score > 0) {
      results.push({ ...item, score });
    }
  });
  
  return results.sort((a, b) => b.score - a.score).slice(0, 15);
}

function showSearchResults(results, query) {
  const panel = document.getElementById('search-results');
  if (!panel) return;
  
  const container = panel.querySelector('.search-results-list');
  if (!container) return;
  
  if (results.length === 0) {
    container.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-muted);">Aucun résultat pour "' + query + '"</div>';
  } else {
    container.innerHTML = results.map(r => {
      const excerpt = highlightTerms(r.text.substring(0, 150), query);
      return `
        <a href="#${r.id}" class="search-result-item" onclick="hideSearchResults()">
          <div class="search-result-title">${r.heading || 'Contenu'}</div>
          <div class="search-result-excerpt">${excerpt}...</div>
        </a>
      `;
    }).join('');
  }
  
  panel.classList.add('active');
}

function hideSearchResults() {
  document.getElementById('search-results')?.classList.remove('active');
}

function highlightTerms(text, query) {
  const terms = query.split(/\s+/).filter(t => t.length > 1);
  let result = text;
  terms.forEach(term => {
    const regex = new RegExp(`(${term})`, 'gi');
    result = result.replace(regex, '<mark>$1</mark>');
  });
  return result;
}

// ================================================
// Sidebar Toggle (Desktop & Mobile)
// ================================================
function initSidebarToggle() {
  const sidebarToggle = document.querySelector('.sidebar-toggle');
  const sidebar = document.querySelector('.sidebar');
  const app = document.querySelector('.app');
  
  // Load saved state
  const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
  if (isCollapsed) {
    sidebar?.classList.add('collapsed');
    app?.classList.add('sidebar-collapsed');
  }
  
  sidebarToggle?.addEventListener('click', () => {
    sidebar?.classList.toggle('collapsed');
    app?.classList.toggle('sidebar-collapsed');
    
    // Save state
    const nowCollapsed = sidebar?.classList.contains('collapsed');
    localStorage.setItem('sidebar-collapsed', nowCollapsed);
  });
}

// ================================================
// Mobile Menu
// ================================================
function initMobileMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  
  toggle?.addEventListener('click', () => {
    sidebar?.classList.toggle('open');
  });
  
  // Close on nav click
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      sidebar?.classList.remove('open');
    });
  });
}

// ================================================
// Navigation Groups
// ================================================
function initNavGroups() {
  document.querySelectorAll('.nav-group-title').forEach(title => {
    title.addEventListener('click', () => {
      title.parentElement.classList.toggle('collapsed');
    });
  });
}

// ================================================
// Smooth Scroll for TOC
// ================================================
function initSmoothScroll() {
  document.querySelectorAll('.toc a, a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href?.startsWith('#')) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          history.pushState(null, '', href);
        }
      }
    });
  });
}

// ================================================
// Utility: Expand All / Collapse All
// ================================================
function expandAllAccordions() {
  document.querySelectorAll('.accordion-item').forEach(item => {
    item.classList.add('open');
  });
}

function collapseAllAccordions() {
  document.querySelectorAll('.accordion-item').forEach(item => {
    item.classList.remove('open');
  });
}

function expandAllTrees() {
  document.querySelectorAll('.tree-node').forEach(node => {
    node.classList.add('expanded');
  });
}

function collapseAllTrees() {
  document.querySelectorAll('.tree-node').forEach(node => {
    node.classList.remove('expanded');
  });
}

// Export utilities
window.expandAllAccordions = expandAllAccordions;
window.collapseAllAccordions = collapseAllAccordions;
window.expandAllTrees = expandAllTrees;
window.collapseAllTrees = collapseAllTrees;
window.hideSearchResults = hideSearchResults;
