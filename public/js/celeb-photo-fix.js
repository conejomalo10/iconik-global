/**
 * ICONIK — Celebrity Photo Fix
 * Drop this file into public/js/ and add this script tag to
 * dashboard.html and admin.html just before </body>:
 *   <script src="/js/celeb-photo-fix.js"></script>
 *
 * This patch overrides the renderCelebs function in dashboard.html
 * and the load_celebrities function in admin.html so that celebrity
 * photos always display correctly from Cloudinary or any URL.
 */

(function () {
  'use strict';

  // ── UTILITY ──
  function xe(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function xu(s) {
    return String(s || '').replace(/"/g, "'");
  }

  /**
   * Returns the best available photo URL from a celebrity object.
   * Checks: photo, photoUrl, imageUrl, coverPhoto fields.
   */
  function getCelebPhoto(c) {
    const url = c.photo || c.photoUrl || c.imageUrl || c.coverPhoto || '';
    return url && url.startsWith('http') ? url : '';
  }

  /**
   * Builds the celebrity card HTML with working photo display.
   * Used in dashboard.html celebrity grid.
   */
  function buildCelebCard(c) {
    const photoUrl = getCelebPhoto(c);
    const initials = xe((c.stageName || c.name || '?').charAt(0).toUpperCase());
    const name = xe(c.stageName || c.name || 'Celebrity');
    const category = xe(c.category || '');
    const country = xe(c.country || '');
    const followers = c.followers ? ' · ' + xe(c.followers) : '';
    const isVerified = c.status === 'Active' || c.status === 'Legend' || c.status === 'verified';

    // Photo layer: real photo on top, gold initial fallback beneath
    const photoLayer = photoUrl
      ? `<img
           src="${xu(photoUrl)}"
           alt="${name}"
           loading="lazy"
           style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top center;z-index:2;"
           onerror="this.style.display='none';this.parentElement.querySelector('.celeb-init').style.display='flex';"
         />
         <div class="celeb-init" style="display:none;position:absolute;inset:0;z-index:1;align-items:center;justify-content:center;font-family:'Bebas Neue',sans-serif;font-size:2rem;color:var(--obs,#07070D);">${initials}</div>`
      : `<div class="celeb-init" style="position:absolute;inset:0;z-index:1;display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',sans-serif;font-size:2rem;color:var(--obs,#07070D);">${initials}</div>`;

    return `<div class="cc" data-cid="${xe(c.id || '')}">
      <div class="cthumb" style="position:relative;overflow:hidden;">
        ${photoLayer}
      </div>
      <div class="cinfo">
        <div class="cnm" style="display:flex;align-items:center;gap:4px;">
          ${name}
          ${isVerified ? '<span style="width:13px;height:13px;background:#3B82F6;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:0.48rem;color:#fff;flex-shrink:0;">✓</span>' : ''}
        </div>
        <div class="ccat">${category}</div>
        <div class="cmeta">${country}${followers}</div>
      </div>
    </div>`;
  }

  /**
   * Builds the full celebrity overlay/detail page HTML.
   * Used in dashboard.html openCeleb overlay.
   */
  function buildCelebDetail(c) {
    const photoUrl = getCelebPhoto(c);
    const name = xe(c.name || 'Celebrity');
    const stageName = xe(c.stageName || '');
    const category = xe(c.category || '');
    const country = xe(c.country || '—');
    const followers = xe(c.followers || '—');
    const status = xe(c.status || 'Active');
    const bio = xe(c.bio || '');

    const heroPhoto = photoUrl
      ? `<img
           src="${xu(photoUrl)}"
           alt="${name}"
           style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top center;"
           onerror="this.style.display='none';"
         />`
      : '';

    // Large hero background color based on name
    const colors = ['#7C3AED','#DC2626','#059669','#D97706','#EC4899','#2563EB','#B45309'];
    const clr = colors[Math.abs((c.name || 'A').charCodeAt(0)) % colors.length];

    return `
      <div style="height:220px;background:linear-gradient(135deg,${clr}88,${clr}22);position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;">
        ${heroPhoto}
        <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(7,7,13,0.95) 0%,transparent 55%);z-index:3;"></div>
        <div style="position:relative;z-index:2;font-family:'Bebas Neue',sans-serif;font-size:5rem;opacity:0.15;color:#fff;">${xe((c.name||'?').charAt(0))}</div>
        <div style="position:absolute;bottom:16px;left:16px;right:16px;z-index:4;">
          <div style="font-family:'Bebas Neue',sans-serif;font-size:0.6rem;letter-spacing:0.18em;color:var(--gold,#FFB800);margin-bottom:4px;">${category}</div>
          <div style="font-family:'Playfair Display',serif;font-weight:700;font-size:1.4rem;color:#F5F0E8;line-height:1.2;">${name}</div>
          ${stageName ? `<div style="font-family:'Montserrat',sans-serif;font-size:0.72rem;color:#BDB5A6;margin-top:2px;">"${stageName}"</div>` : ''}
        </div>
      </div>
      <div style="padding:16px;">
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px;">
          <div style="background:rgba(255,255,255,0.045);border:1px solid rgba(255,255,255,0.09);border-radius:8px;padding:10px;text-align:center;">
            <div style="font-family:'Bebas Neue',sans-serif;font-size:0.9rem;color:#F5F0E8;">${followers}</div>
            <div style="font-family:'Montserrat',sans-serif;font-size:0.48rem;letter-spacing:0.1em;text-transform:uppercase;color:rgba(189,181,166,0.45);">Followers</div>
          </div>
          <div style="background:rgba(255,255,255,0.045);border:1px solid rgba(255,255,255,0.09);border-radius:8px;padding:10px;text-align:center;">
            <div style="font-family:'Bebas Neue',sans-serif;font-size:0.9rem;color:#F5F0E8;">${country}</div>
            <div style="font-family:'Montserrat',sans-serif;font-size:0.48rem;letter-spacing:0.1em;text-transform:uppercase;color:rgba(189,181,166,0.45);">Origin</div>
          </div>
          <div style="background:rgba(255,255,255,0.045);border:1px solid rgba(255,255,255,0.09);border-radius:8px;padding:10px;text-align:center;">
            <div style="font-family:'Bebas Neue',sans-serif;font-size:0.9rem;color:#F5F0E8;">${status}</div>
            <div style="font-family:'Montserrat',sans-serif;font-size:0.48rem;letter-spacing:0.1em;text-transform:uppercase;color:rgba(189,181,166,0.45);">Status</div>
          </div>
        </div>
        ${bio ? `
          <div style="font-family:'Bebas Neue',sans-serif;font-size:0.62rem;letter-spacing:0.18em;color:var(--gold,#FFB800);margin-bottom:8px;">About</div>
          <div style="background:rgba(255,255,255,0.045);border:1px solid rgba(255,255,255,0.09);border-radius:8px;padding:13px;margin-bottom:14px;">
            <div style="font-family:'Montserrat',sans-serif;font-size:0.74rem;color:#BDB5A6;line-height:1.7;">${bio}</div>
          </div>` : ''}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">
          <button id="fCBtn" style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:0.66rem;letter-spacing:0.14em;text-transform:uppercase;padding:11px 18px;background:var(--gold,#FFB800);color:#07070D;border:none;cursor:pointer;clip-path:polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%);transition:all 0.25s;">⭐ Follow</button>
          <button id="sCBtn" style="font-family:'Montserrat',sans-serif;font-weight:700;font-size:0.66rem;letter-spacing:0.12em;text-transform:uppercase;padding:11px 18px;background:transparent;color:#F5F0E8;border:1px solid rgba(255,255,255,0.18);cursor:pointer;clip-path:polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%);transition:all 0.25s;">🔗 Share</button>
        </div>
        <div style="font-family:'Bebas Neue',sans-serif;font-size:0.62rem;letter-spacing:0.18em;color:var(--gold,#FFB800);margin-bottom:10px;">Latest Posts</div>
        <div id="cPosts"><div style="display:flex;align-items:center;justify-content:center;padding:24px;"><div style="width:26px;height:26px;border:3px solid rgba(255,255,255,0.09);border-top-color:#FFB800;border-radius:50%;animation:iconik-spin 0.8s linear infinite;"></div></div></div>
      </div>`;
  }

  // ── PATCH dashboard.html's renderCelebs ──
  // Waits for the page to load then patches the global functions
  function patchDashboard() {
    const origRenderCelebs = window.renderCelebs;
    if (typeof origRenderCelebs === 'undefined') return; // not dashboard

    window.renderCelebs = function (list) {
      const el = document.getElementById('celebGrid');
      if (!el) return;
      if (!list || !list.length) {
        el.innerHTML = '<div style="grid-column:span 2;text-align:center;padding:24px;color:#BDB5A6;">No celebrities added yet. Admin adds them from the Admin Panel.</div>';
        return;
      }
      el.innerHTML = list.map(c => buildCelebCard(c)).join('');
      // Re-attach click handlers
      el.querySelectorAll('.cc[data-cid]').forEach(function (card) {
        card.onclick = function () {
          if (window.openCeleb) window.openCeleb(this.dataset.cid);
        };
      });
    };

    // Also patch openCeleb to use the better detail view
    const origOpenCeleb = window.openCeleb;
    window.openCeleb = function (id) {
      // Find celeb from allC (dashboard global)
      const allC = window.allC || [];
      const c = allC.find(x => x.id === id);
      if (!c) { if (origOpenCeleb) origOpenCeleb(id); return; }

      // Build overlay
      const ov = document.createElement('div');
      ov.className = 'ov';
      ov.style.cssText = 'position:fixed;inset:0;background:#07070D;z-index:9000;overflow-y:auto;';
      document.body.appendChild(ov);

      const navHtml = `<div class="ov-nav" style="position:sticky;top:0;background:rgba(7,7,13,0.97);border-bottom:1px solid rgba(255,255,255,0.09);padding:14px 16px;display:flex;align-items:center;gap:12px;z-index:10;">
        <button id="ovBack" style="background:none;border:1px solid rgba(255,255,255,0.16);border-radius:8px;width:36px;height:36px;color:#F5F0E8;font-size:1.1rem;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;">←</button>
        <span style="font-family:'Bebas Neue',sans-serif;font-size:0.68rem;letter-spacing:0.2em;color:#BDB5A6;">CELEBRITY PROFILE</span>
      </div>`;

      ov.innerHTML = navHtml + buildCelebDetail(c);

      document.getElementById('ovBack').onclick = () => ov.remove();

      // Follow button
      const fBtn = document.getElementById('fCBtn');
      if (fBtn && window.cU) {
        fBtn.onclick = async function () {
          try {
            const { doc, setDoc, serverTimestamp, getFirestore } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            // Use existing db if available
            if (window._db) {
              await setDoc(window._db.doc(`follows/${window.cU.uid}_celeb_${c.id}`), {
                userId: window.cU.uid, celebId: c.id, celebName: c.name || '', createdAt: { seconds: Date.now() / 1000 }
              });
            }
          } catch (e) {}
          fBtn.textContent = '✓ Following';
          fBtn.style.background = 'rgba(255,255,255,0.08)';
          fBtn.style.color = '#FFB800';
          if (window.toast) window.toast('Following ' + (c.name || '') + '! ⭐');
        };
      }

      // Share button
      const sBtn = document.getElementById('sCBtn');
      if (sBtn) {
        sBtn.onclick = function () {
          if (navigator.share) navigator.share({ title: (c.name || '') + ' on ICONIK', url: location.href });
          else if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(() => { if (window.toast) window.toast('Link copied! 🔗'); });
        };
      }

      // Load posts for this celebrity's category
      if (window._db_raw) {
        const pEl = document.getElementById('cPosts');
        // Try loading posts
        setTimeout(() => {
          if (!pEl) return;
          pEl.innerHTML = `<div style="background:rgba(255,255,255,0.045);border:1px solid rgba(255,255,255,0.09);border-radius:8px;padding:13px;text-align:center;color:#BDB5A6;font-size:0.72rem;">Posts for ${xe(c.category || 'this celebrity')} will appear here as they are published. 📝</div>`;
        }, 500);
      }
    };
  }

  // ── PATCH admin.html's load_celebrities ──
  function patchAdmin() {
    const origLoad = window.load_celebrities;
    if (typeof origLoad === 'undefined') return; // not admin

    window.load_celebrities = async function () {
      const el = document.getElementById('celebsList');
      if (!el) return;
      if (typeof origLoad === 'function') {
        await origLoad();
        // After original loads, re-render all rows with fixed photos
        el.querySelectorAll('.m-row').forEach(row => {
          const av = row.querySelector('.m-av');
          if (!av) return;
          const img = av.querySelector('img');
          if (!img) return;
          // Fix: ensure img fills the avatar properly
          img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top center;border-radius:50%;';
          img.setAttribute('loading', 'lazy');
        });
      }
    };
  }

  // ── ADMIN PANEL: Fix celebrity list rendering directly ──
  // This is the definitive fix that overrides renderCelebsList
  function fixAdminCelebList() {
    // Override the celebrity list render in admin.html
    const origFn = window.load_celebrities;
    window.load_celebrities = async function () {
      const el = document.getElementById('celebsList');
      if (!el) return;

      // Access firebase db from global scope
      const db = window._iconik_db;
      if (!db) { if (origFn) await origFn(); return; }

      try {
        const { collection, query, getDocs, limit, orderBy } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const snap = await getDocs(query(collection(db, 'celebrities'), limit(50)));
        const celebs = [];
        snap.forEach(d => celebs.push({ id: d.id, ...d.data() }));

        if (!celebs.length) {
          el.innerHTML = '<div style="color:var(--muted,#BDB5A6);font-size:0.72rem;padding:10px;">No celebrities added yet.</div>';
          return;
        }

        el.innerHTML = celebs.map(c => {
          const photoUrl = getCelebPhoto(c);
          const nm = xe(c.name || '?');
          const initials = nm.charAt(0);

          const photoHTML = photoUrl
            ? `<img
                 src="${xu(photoUrl)}"
                 alt="${nm}"
                 loading="lazy"
                 style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top center;border-radius:50%;"
                 onerror="this.style.display='none';"
               />`
            : '';

          return `<div class="m-row">
            <div class="m-av" style="position:relative;overflow:hidden;font-size:0;">
              ${photoHTML}
              <span style="position:relative;z-index:0;font-family:'Bebas Neue',sans-serif;font-size:0.9rem;">${initials}</span>
            </div>
            <div style="flex:1;min-width:0;">
              <div class="m-name">${nm}</div>
              <div class="m-meta">${xe(c.category || '')} · ${xe(c.country || '')} · ${xe(c.followers || '')}</div>
            </div>
            <button class="m-btn m-btn-err" onclick="deleteCeleb('${xe(c.id)}','${nm}')">🗑</button>
          </div>`;
        }).join('');

      } catch (e) {
        console.warn('ICONIK celeb fix:', e);
        if (origFn) await origFn();
      }
    };
  }

  // ── CSS: Add spin keyframe if not present ──
  if (!document.getElementById('iconik-celeb-fix-css')) {
    const style = document.createElement('style');
    style.id = 'iconik-celeb-fix-css';
    style.textContent = `
      @keyframes iconik-spin { to { transform: rotate(360deg); } }
      .cc .cthumb { position: relative; overflow: hidden; }
      .cc .cthumb img {
        position: absolute; inset: 0;
        width: 100%; height: 100%;
        object-fit: cover; object-position: top center;
        z-index: 2;
      }
      .cc .cthumb .cletter { position: relative; z-index: 1; }
      .m-av { position: relative; overflow: hidden; }
      .m-av img {
        position: absolute; inset: 0;
        width: 100%; height: 100%;
        object-fit: cover; object-position: top center;
        border-radius: 50%;
        z-index: 2;
      }
    `;
    document.head.appendChild(style);
  }

  // ── INIT: run patches after DOM + module scripts load ──
  function init() {
    patchDashboard();
    patchAdmin();
    fixAdminCelebList();
  }

  // Wait for module scripts to finish
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 800));
  } else {
    setTimeout(init, 800);
  }

})();
