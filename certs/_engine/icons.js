/* ============================================================
   AWS Study Deck — アイコンシステム
   絵文字を廃止し、AWSのアイコン言語（角丸スクエア＋単色ラインの白グリフ）
   に統一する。全ページ共通の1ファイル。

   使い方:
   - 静的HTML: <svg class="ico"><use href="#i-flame"></use></svg>
   - バッジ風（資格ロゴ・カテゴリタイルなど）:
     <span class="ico-badge ico-badge--orange"><svg class="ico">...</svg></span>
   - engine.js 等のテンプレート文字列内: ico('flame') / ico('flame','ico-badge ico-badge--ng')

   アイコンはCSSの font-size を基準に 1em で拡大縮小する（.ico{width:1em;height:1em}）。
   置き場所側の font-size を変えるだけでサイズが揃うので、絵文字と同じ感覚で使える。
   ============================================================ */
(function(){
  const SPRITE = '<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">' +
'<symbol id="i-cloud" viewBox="0 0 24 24"><path d="M6.5 19a4 4 0 0 1-.5-7.96 5.5 5.5 0 0 1 10.6-2A4.5 4.5 0 0 1 17 19H6.5z"/></symbol>' +
'<symbol id="i-passport" viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="9.5" cy="9" r="2"/><path d="M6.5 15.3c.5-1.4 1.8-2.1 3-2.1s2.5.7 3 2.1"/><path d="M14 8h4M14 11h4M14 17h4"/></symbol>' +
'<symbol id="i-robot" viewBox="0 0 24 24"><rect x="5" y="8" width="14" height="11" rx="2"/><path d="M9 8V5a3 3 0 0 1 6 0v3"/><circle cx="9.5" cy="13" r="1.1" fill="currentColor" stroke="none"/><circle cx="14.5" cy="13" r="1.1" fill="currentColor" stroke="none"/><path d="M9.5 17h5"/></symbol>' +
'<symbol id="i-blueprint" viewBox="0 0 24 24"><path d="M4 21V9l8-5 8 5v12"/><path d="M4 21h16"/><path d="M9 21v-6h6v6"/></symbol>' +
'<symbol id="i-wrench" viewBox="0 0 24 24"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2-2z"/></symbol>' +
'<symbol id="i-compass" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M15 9l-2 6-6 2 2-6z"/></symbol>' +
'<symbol id="i-lock" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></symbol>' +
'<symbol id="i-home" viewBox="0 0 24 24"><path d="M4 11l8-7 8 7"/><path d="M6 10v9h12v-9"/><path d="M10 19v-5h4v5"/></symbol>' +
'<symbol id="i-notebook" viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v18"/><path d="M12 8h4M12 12h4"/></symbol>' +
'<symbol id="i-card-stack" viewBox="0 0 24 24"><path d="M7 4h13v9"/><rect x="4" y="7" width="13" height="9" rx="1.5"/></symbol>' +
'<symbol id="i-doc-check" viewBox="0 0 24 24"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/><path d="M9.5 14l2 2 4-4"/></symbol>' +
'<symbol id="i-ballot" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 12l2.5 2.5L16 9"/></symbol>' +
'<symbol id="i-list-ol" viewBox="0 0 24 24"><circle cx="5" cy="6" r="1.3" fill="currentColor" stroke="none"/><circle cx="5" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="5" cy="18" r="1.3" fill="currentColor" stroke="none"/><path d="M9 6h11M9 12h11M9 18h11"/></symbol>' +
'<symbol id="i-link" viewBox="0 0 24 24"><path d="M9 15l6-6"/><path d="M8 13.5l-2 2a3.2 3.2 0 0 0 4.5 4.5l2-2"/><path d="M16 10.5l2-2a3.2 3.2 0 0 0-4.5-4.5l-2 2"/></symbol>' +
'<symbol id="i-puzzle" viewBox="0 0 24 24"><path d="M6 6h5v-1a1.7 1.7 0 1 1 3.4 0V6H19v5h-1a1.7 1.7 0 1 0 0 3.4h1V19h-5v-1a1.7 1.7 0 1 0-3.4 0v1H6v-5h1a1.7 1.7 0 0 0 0-3.4H6z"/></symbol>' +
'<symbol id="i-target" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.3"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/></symbol>' +
'<symbol id="i-clipboard" viewBox="0 0 24 24"><rect x="6" y="4" width="12" height="17" rx="2"/><rect x="9" y="2.3" width="6" height="3" rx="1"/><path d="M9 11h6M9 15h6"/></symbol>' +
'<symbol id="i-cap" viewBox="0 0 24 24"><path d="M12 5l9 4-9 4-9-4z"/><path d="M6.5 11v4c0 1.2 2.5 2.5 5.5 2.5s5.5-1.3 5.5-2.5v-4"/><path d="M21 9v5"/></symbol>' +
'<symbol id="i-belt" viewBox="0 0 24 24"><rect x="3" y="10.3" width="18" height="3.4" rx="1"/><path d="M9 10.3l-2 6.4M15 10.3l2 6.4"/><rect x="9.3" y="9.3" width="5.4" height="5.4" rx="1"/></symbol>' +
'<symbol id="i-shuffle" viewBox="0 0 24 24"><path d="M4 7h3.5l7 10H18"/><path d="M4 17h3.5l2-2.8"/><path d="M13.5 9.5L14.5 8H18"/><path d="M16 5l3 3-3 3"/><path d="M16 14l3 3-3 3"/></symbol>' +
'<symbol id="i-repeat" viewBox="0 0 24 24"><path d="M17 2l3 3-3 3"/><path d="M20 5H8a5 5 0 0 0-5 5v1"/><path d="M7 22l-3-3 3-3"/><path d="M4 19h12a5 5 0 0 0 5-5v-1"/></symbol>' +
'<symbol id="i-flame" viewBox="0 0 24 24"><path fill="currentColor" stroke="none" d="M12 2.6s5.2 4.9 5.2 9.7a5.2 5.2 0 0 1-10.4 0c0-1.3.5-2.2 1.1-3 .3 1 1 1.3 1 1.3-.3-3.2 1.6-5.1 1.6-5.1-.2 1.4.7 2.3 1.6 2.5-.3-2.8 1-4.3-.1-5.4z"/></symbol>' +
'<symbol id="i-confetti" viewBox="0 0 24 24"><path d="M4 20l3-8 8 3-8 5z" fill="currentColor" stroke="none"/><path d="M13 5l1.4 1.4M17.5 3l.9 1.8M20.5 7l-1.4 1"/><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="7.5" r="1" fill="currentColor" stroke="none"/></symbol>' +
'<symbol id="i-thumbs-up" viewBox="0 0 24 24"><path d="M7 21V10"/><path d="M7 10l3.5-6.5a1.7 1.7 0 0 1 3.2 1l-1 4.5H18a2 2 0 0 1 2 2.4l-1.6 7A2.5 2.5 0 0 1 16 21H7"/></symbol>' +
'<symbol id="i-dumbbell" viewBox="0 0 24 24"><rect x="2.5" y="10" width="3" height="4.4" rx="1"/><rect x="18.5" y="10" width="3" height="4.4" rx="1"/><path d="M5.5 12.2h2.3M16.2 12.2h2.3"/><rect x="7.8" y="9" width="8.4" height="6.4" rx="1.4"/></symbol>' +
'<symbol id="i-archive" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="5" rx="1.5"/><path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9"/><path d="M10 13h4"/></symbol>' +
'<symbol id="i-pencil" viewBox="0 0 24 24"><path d="M4 20l1-4.2L15.8 5 19 8.2 8.2 19z"/><path d="M13.5 6.5l4 4"/></symbol>' +
'<symbol id="i-trash" viewBox="0 0 24 24"><path d="M5 7h14"/><path d="M9 7V5h6v2"/><path d="M7 7l1 13h8l1-13"/><path d="M10 11v6M14 11v6"/></symbol>' +
'<symbol id="i-folder" viewBox="0 0 24 24"><path d="M4 6.5A1.5 1.5 0 0 1 5.5 5H10l2 2.5h6.5A1.5 1.5 0 0 1 20 9v8.5A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5z"/></symbol>' +
'<symbol id="i-flag" viewBox="0 0 24 24"><path d="M6 21V4"/><path d="M6 5h12l-3 3.5L18 12H6"/></symbol>' +
'<symbol id="i-trophy" viewBox="0 0 24 24"><path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 5H5v2a3 3 0 0 0 3 3"/><path d="M16 5h3v2a3 3 0 0 1-3 3"/><path d="M12 13v3"/><path d="M9 20h6"/><path d="M10 20l.5-4h3l.5 4"/></symbol>' +
'<symbol id="i-search" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/></symbol>' +
'<symbol id="i-empty-box" viewBox="0 0 24 24"><path d="M4 10l3-6h10l3 6"/><path d="M4 10v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8"/><path d="M4 10h5l1 2h4l1-2h5"/></symbol>' +
'<symbol id="i-warning" viewBox="0 0 24 24"><path d="M12 4l9 15H3z"/><path d="M12 10v4"/><circle cx="12" cy="17" r="1" fill="currentColor" stroke="none"/></symbol>' +
'<symbol id="i-globe" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5a13 13 0 0 1 0 17"/><path d="M12 3.5a13 13 0 0 0 0 17"/></symbol>' +
'<symbol id="i-arrow-right" viewBox="0 0 24 24"><path d="M4 12h14"/><path d="M13 6l6 6-6 6"/></symbol>' +
'<symbol id="i-server" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="6" rx="1.5"/><rect x="4" y="14" width="16" height="6" rx="1.5"/><circle cx="7.5" cy="7" r="1" fill="currentColor" stroke="none"/><circle cx="7.5" cy="17" r="1" fill="currentColor" stroke="none"/></symbol>' +
'<symbol id="i-database" viewBox="0 0 24 24"><ellipse cx="12" cy="5.5" rx="7" ry="2.5"/><path d="M5 5.5v13c0 1.4 3 2.5 7 2.5s7-1.1 7-2.5v-13"/><path d="M5 12c0 1.4 3 2.5 7 2.5s7-1.1 7-2.5"/></symbol>' +
'<symbol id="i-gear" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 3v2.2M12 18.8V21M21 12h-2.2M5.2 12H3M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6M18.4 18.4l-1.6-1.6M7.2 7.2 5.6 5.6"/></symbol>' +
'<symbol id="i-scale" viewBox="0 0 24 24"><path d="M12 4v16"/><path d="M7 20h10"/><path d="M4 9h6M14 9h6"/><path d="M4 9l-1.5 4a2.5 2.5 0 0 0 5 0z"/><path d="M20 9l-1.5 4a2.5 2.5 0 0 0 5 0z"/></symbol>' +
'<symbol id="i-chart-up" viewBox="0 0 24 24"><path d="M4 19h16"/><path d="M4 19l5-6 4 3 6-8"/><path d="M15 8h4v4"/></symbol>' +
'<symbol id="i-map" viewBox="0 0 24 24"><path d="M9 4L4 6v14l5-2 6 2 5-2V4l-5 2-6-2z"/><path d="M9 4v14M15 6v14"/></symbol>' +
'<symbol id="i-toolbox" viewBox="0 0 24 24"><rect x="3" y="9" width="18" height="10" rx="1.5"/><path d="M8 9V6.5A1.5 1.5 0 0 1 9.5 5h5A1.5 1.5 0 0 1 16 6.5V9"/><path d="M3 13h18"/><path d="M10.5 13v2h3v-2"/></symbol>' +
'<symbol id="i-bolt" viewBox="0 0 24 24"><path d="M13 3L5 14h6l-1 7 8-11h-6z"/></symbol>' +
'<symbol id="i-bar-chart" viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M4 20h16"/></symbol>' +
'<symbol id="i-coin" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M9.3 14.5c.4.8 1.3 1.3 2.3 1.3 1.4 0 2.4-.8 2.4-2 0-1.1-.9-1.6-2.4-2-1.5-.4-2.4-.9-2.4-2 0-1.2 1-2 2.4-2 1 0 1.9.5 2.3 1.3"/><path d="M12 7.5v9"/></symbol>' +
'<symbol id="i-truck" viewBox="0 0 24 24"><rect x="2.5" y="8" width="11" height="8" rx="1"/><path d="M13.5 11h3.5l3 3v2h-6.5z"/><circle cx="6.5" cy="18" r="1.6"/><circle cx="16.5" cy="18" r="1.6"/></symbol>' +
'<symbol id="i-monitor" viewBox="0 0 24 24"><rect x="3" y="4.5" width="18" height="12" rx="1.5"/><path d="M8 20h8M12 16.5V20"/></symbol>' +
'<symbol id="i-book" viewBox="0 0 24 24"><path d="M4 5.5C4 4.7 4.7 4 5.5 4H12v16H5.5A1.5 1.5 0 0 1 4 18.5z"/><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H12v16h6.5a1.5 1.5 0 0 0 1.5-1.5z"/></symbol>' +
'<symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5.5l4 2.3"/></symbol>' +
'<symbol id="i-mail" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M4 6.5l8 6 8-6"/></symbol>' +
'<symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 3l7 3v6c0 5-3.2 8-7 9-3.8-1-7-4-7-9V6z"/><path d="M9 12l2 2 4-4"/></symbol>' +
'<symbol id="i-more" viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.8" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.8" fill="currentColor" stroke="none"/></symbol>' +
'<symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol>' +
'<symbol id="i-code" viewBox="0 0 24 24"><path d="M8.5 7.5L4 12l4.5 4.5"/><path d="M15.5 7.5L20 12l-4.5 4.5"/><path d="M13.5 4.5l-3 15"/></symbol>' +
'</svg>';

  const STYLE = '.ico{width:1em;height:1em;display:inline-block;vertical-align:-0.15em;stroke:currentColor;' +
    'fill:none;stroke-width:1.8px;stroke-linecap:round;stroke-linejoin:round;flex:none;}' +
    '.ico-badge{display:inline-flex;align-items:center;justify-content:center;border-radius:8px;flex:none;color:#fff;}' +
    '.ico-badge .ico{width:60%;height:60%;stroke-width:1.6px;}' +
    '.ico-badge--orange{background:linear-gradient(135deg,var(--orange,#FF9900),#E68A00);box-shadow:0 2px 8px rgba(255,153,0,.3);}' +
    '.ico-badge--blue{background:linear-gradient(135deg,var(--blue,#38BDF8),#1D8FD1);box-shadow:0 2px 8px rgba(56,189,248,.3);}' +
    '.ico-badge--ok{background:linear-gradient(135deg,var(--ok,#2DD4BF),#12A38F);box-shadow:0 2px 8px rgba(45,212,191,.3);}' +
    '.ico-badge--ng{background:linear-gradient(135deg,var(--ng,#FF6B6B),#E14B4B);box-shadow:0 2px 8px rgba(255,107,107,.3);}' +
    '.ico-badge--dim{background:var(--card2,#1E2C4A);box-shadow:none;color:var(--dim,#93A5C1);}';

  const styleEl = document.createElement('style');
  styleEl.textContent = STYLE;
  document.head.appendChild(styleEl);

  const cs = document.currentScript;
  if(cs && cs.insertAdjacentHTML){
    cs.insertAdjacentHTML('beforebegin', SPRITE);
  } else {
    document.body.insertAdjacentHTML('afterbegin', SPRITE);
  }

  window.ico = function(name, cls){
    return '<svg class="ico' + (cls ? (' ' + cls) : '') + '" aria-hidden="true"><use href="#i-' + name + '"></use></svg>';
  };
})();
