// public/app.js
(function () {
  // helpers
  const qs = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const baseEl = qs('#base-url');
  baseEl.textContent = window.BASE_URL || window.location.origin;

  // form elements
  const form = qs('#create-form');
  const targetInput = qs('#target');
  const codeInput = qs('#code');
  const createBtn = qs('#create-btn');
  const createMsg = qs('#create-msg');
  const createSpinner = qs('#create-spinner');
  const targetError = qs('#target-error');
  const codeError = qs('#code-error');

  // table elements
  const loadingEl = qs('#loading');
  const tableEl = qs('#links-table');
  const linksBody = qs('#links-body');
  const emptyEl = qs('#empty');
  const tableError = qs('#table-error');

  const search = qs('#search');
  const sortSelect = qs('#sort');

  const API = {
    list: () => fetch('/api/links').then(r => r.ok ? r.json() : Promise.reject('list-failed')),
    create: (payload) => fetch('/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }),
    delete: (code) => fetch(`/api/links/${code}`, { method: 'DELETE' })
  };

  // UI helpers
  function showError(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden');
  }
  function hideError(el) {
    if (!el) return;
    el.classList.add('hidden');
  }
  function setLoading(state) {
    if (state) {
      loadingEl.classList.remove('hidden');
      tableEl.classList.add('hidden');
      emptyEl.classList.add('hidden');
      tableError.classList.add('hidden');
    } else {
      loadingEl.classList.add('hidden');
    }
  }

  // validation
  function isValidUrl(u) {
    try {
      const url = new URL(u);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }
  const codePattern = /^[A-Za-z0-9]{6,8}$/;

  // render rows
  function renderRows(rows) {
    linksBody.innerHTML = '';
    if (!rows.length) {
      tableEl.classList.add('hidden');
      emptyEl.classList.remove('hidden');
      return;
    } else {
      tableEl.classList.remove('hidden');
      emptyEl.classList.add('hidden');
    }

    rows.forEach(r => {
      const tr = document.createElement('tr');
      tr.className = 'align-top bg-white border rounded mb-2';
      tr.innerHTML = `
        <td class="p-3 align-top" style="vertical-align:middle">
          <a class="text-blue-600 font-medium" href="/${r.code}" target="_blank">${r.code}</a>
        </td>
        <td class="p-3 align-top">
          <div class="truncate-ellipsis text-sm">${r.target}</div>
        </td>
        <td class="p-3 align-top">${r.clicks}</td>
        <td class="p-3 align-top">${r.last_clicked_at ? new Date(r.last_clicked_at).toLocaleString() : 'Never'}</td>
        <td class="p-3 align-top">
          <div class="flex flex-wrap gap-2">
            <button data-code="${r.code}" class="delete-btn px-3 py-1 bg-red-600 text-white rounded text-sm">Delete</button>
            <a class="px-3 py-1 bg-slate-100 rounded text-sm text-slate-700" href="/code/${r.code}">Stats</a>
            <button data-copy="${r.code}" class="px-3 py-1 bg-slate-200 rounded text-sm copy-btn">Copy</button>
          </div>
        </td>
      `;
      linksBody.appendChild(tr);
    });

    // wire actions
    qsa('.delete-btn').forEach(b => b.addEventListener('click', onDelete));
    qsa('.copy-btn').forEach(b => b.addEventListener('click', onCopy));
  }

  async function onDelete(e) {
    const code = e.currentTarget.dataset.code;
    if (!confirm(`Delete link ${code}? This cannot be undone.`)) return;
    try {
      const res = await API.delete(code);
      if (!res.ok) throw new Error('delete-failed');
      showToast('Deleted ' + code);
      await loadAndRender();
    } catch (err) {
      showToast('Could not delete', true);
    }
  }

  function onCopy(e) {
    const code = e.currentTarget.dataset.copy;
    const url = window.location.origin + '/' + code;
    navigator.clipboard.writeText(url).then(() => showToast('Copied ' + url));
  }

  // sorting / filtering
  function applySort(rows, key) {
    if (key === 'created_desc') return rows.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    if (key === 'clicks_desc') return rows.sort((a,b) => (b.clicks||0) - (a.clicks||0));
    if (key === 'code_asc') return rows.sort((a,b) => a.code.localeCompare(b.code));
    return rows;
  }

  function filterRows(rows, q) {
    if (!q) return rows;
    q = q.toLowerCase();
    return rows.filter(r => r.code.toLowerCase().includes(q) || r.target.toLowerCase().includes(q));
  }

  // fetch and render
  async function loadAndRender() {
    setLoading(true);
    try {
      const rows = await API.list();
      const q = search.value.trim();
      const sorted = applySort(rows.slice(), sortSelect.value);
      const filtered = filterRows(sorted, q);
      renderRows(filtered);
    } catch (err) {
      tableError.textContent = 'Could not load links. Try again later.';
      tableError.classList.remove('hidden');
    } finally {
      setLoading(false);
    }
  }

  // toasts
  const toastContainer = document.createElement('div');
  toastContainer.style.position = 'fixed';
  toastContainer.style.right = '16px';
  toastContainer.style.bottom = '16px';
  toastContainer.style.zIndex = 9999;
  document.body.appendChild(toastContainer);

  function showToast(msg, isError = false) {
    const el = document.createElement('div');
    el.className = 'px-4 py-2 rounded shadow mb-2 text-sm';
    el.style.background = isError ? '#fee2e2' : '#ecfeff';
    el.style.border = isError ? '1px solid #fca5a5' : '1px solid #67e8f9';
    el.textContent = msg;
    toastContainer.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  }

  // form submit handler
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    hideError(targetError);
    hideError(codeError);
    createMsg.textContent = '';
    createBtn.disabled = true;
    createSpinner.classList.remove('hidden');

    const target = targetInput.value.trim();
    const code = codeInput.value.trim() || undefined;

    // client side validation & inline errors
    if (!target || !isValidUrl(target)) {
      showError(targetError, 'Please enter a valid http(s) URL.');
      createBtn.disabled = false;
      createSpinner.classList.add('hidden');
      return;
    }
    if (code && !codePattern.test(code)) {
      showError(codeError, 'Code must be 6–8 alphanumeric characters.');
      createBtn.disabled = false;
      createSpinner.classList.add('hidden');
      return;
    }

    try {
      const res = await API.create({ target, code });
      if (res.status === 201) {
        const json = await res.json();
        createMsg.innerHTML = `Created: <a class="text-blue-600" href="/${json.code}" target="_blank">${window.location.origin}/${json.code}</a>`;
        targetInput.value = '';
        codeInput.value = '';
        showToast('Link created');
        await loadAndRender();
      } else if (res.status === 409) {
        showError(codeError, 'Code already exists — choose another.');
      } else {
        const body = await res.json().catch(() => ({}));
        showError(targetError, body.error || 'Failed to create link');
      }
    } catch (err) {
      showToast('Network error', true);
    } finally {
      createBtn.disabled = false;
      createSpinner.classList.add('hidden');
    }
  });

  // live validation on blur
  targetInput.addEventListener('blur', () => {
    if (!targetInput.value) {
      showError(targetError, 'Target URL required');
    } else if (!isValidUrl(targetInput.value.trim())) {
      showError(targetError, 'Enter a valid URL (http/https).');
    } else hideError(targetError);
  });
  codeInput.addEventListener('input', () => {
    if (codeInput.value && !codePattern.test(codeInput.value)) {
      showError(codeError, 'Must be 6–8 alphanumeric characters.');
    } else hideError(codeError);
  });

  // search & sort events
  search.addEventListener('input', () => loadAndRender());
  sortSelect.addEventListener('change', () => loadAndRender());

  // initial load
  setTimeout(() => loadAndRender(), 200); // tiny delay to show skeleton
})();
