/* Shared theme handling for meldpdf.
   Default = light (white). Users can toggle to dark; choice persists.
   Loaded in <head> (not deferred) so data-theme is set before first paint. */
(function () {
  var root = document.documentElement;
  var saved;
  try { saved = localStorage.getItem('theme'); } catch (e) { saved = null; }
  root.setAttribute('data-theme', saved === 'dark' ? 'dark' : 'light');

  function icon(t) { return t === 'light' ? '🌙' : '☀️'; }
  function label(t) { return t === 'light' ? 'Switch to dark theme' : 'Switch to light theme'; }

  document.addEventListener('DOMContentLoaded', function () {
    var host = document.querySelector('.nav') || document.querySelector('.topbar');
    if (!host) return;
    var cur = root.getAttribute('data-theme');
    var b = document.createElement('button');
    b.id = 'themeToggle';
    b.type = 'button';
    b.textContent = icon(cur);
    b.title = label(cur);
    b.setAttribute('aria-label', label(cur));
    b.style.cssText = 'background:none;border:1.5px solid var(--line);border-radius:20px;' +
      'cursor:pointer;font-size:15px;line-height:1;padding:5px 9px;color:var(--soft)';
    b.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      b.textContent = icon(next);
      b.title = label(next);
      b.setAttribute('aria-label', label(next));
    });
    host.appendChild(b);
  });
})();
