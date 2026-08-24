/* ============================================================
   cat-editor.js — カテゴリ編集の共通コンポーネント（カスタム資格用）

   新規作成フロー（custom/new.html）と学習ページ（custom/index.html）の
   両方から使う。同じ操作感を2箇所に書かないための切り出し。

   ・追加／改名／削除／並べ替え（↑↓）
   ・削除したカテゴリのカードは「未分類」へ退避する（カードは消さない）
     ＝ 判定は custom-store.js の deleteCat() が唯一の実装

   使い方
     CatEditor.mount(el, {cats, customCards})     … 要素に埋め込む（新規作成の2ステップ目）
     CatEditor.open({cats, customCards, onSave})  … モーダルで開く（学習ページから）

   mount() の戻り値 .result() で {cats, customCards, changed} を取り出す。
   customCards はカード退避を反映した「作業コピー」で、元のオブジェクトは変更しない。

   依存：custom-store.js（CustomCerts）・icons.js（ico）
   ============================================================ */

window.CatEditor = (function(){

  const CC = window.CustomCerts;

  function esc(s){
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function countIn(cards, catId){
    return (cards[catId] || []).length;
  }

  /* ---------- 本体：任意の要素に埋め込む ---------- */
  function mount(host, opts){
    opts = opts || {};
    let cats  = CC.normalizeCats(opts.cats || []);
    let cards = JSON.parse(JSON.stringify(opts.customCards || {}));   // 作業コピー
    const before = JSON.stringify(cats);
    let changed = false;

    function render(){
      const rows = cats.map(function(c, i){
        const n = countIn(cards, c.id);
        return '<div class="cat-row" data-id="' + esc(c.id) + '">' +
          '<input class="cat-name" type="text" value="' + esc(c.name) + '" ' +
                 'aria-label="カテゴリ名" maxlength="40">' +
          '<span class="cat-count">' + n + '枚</span>' +
          '<button class="cat-btn" data-act="up"   ' + (i === 0 ? 'disabled' : '') + ' aria-label="上へ">↑</button>' +
          '<button class="cat-btn" data-act="down" ' + (i === cats.length - 1 ? 'disabled' : '') + ' aria-label="下へ">↓</button>' +
          '<button class="cat-btn del" data-act="del" aria-label="削除">' + ico('trash') + '</button>' +
        '</div>';
      }).join('');

      host.innerHTML =
        '<div class="cat-editor">' +
          '<div class="cat-list">' + rows + '</div>' +
          '<button class="btn-new-deck" data-act="add">' + ico('plus') + ' カテゴリを追加</button>' +
          '<div class="cat-hint">' + ico('warning') +
            ' カテゴリを削除しても、そのカテゴリのカードは削除されません。' +
            '「' + esc(CC.UNCAT_NAME) + '」へ移されます。</div>' +
        '</div>';

      host.querySelectorAll('.cat-name').forEach(function(inp){
        inp.addEventListener('input', function(){
          const id = inp.closest('.cat-row').dataset.id;
          const c = cats.find(function(x){ return x.id === id; });
          if(c){ c.name = inp.value; changed = true; }
        });
      });

      host.querySelectorAll('[data-act]').forEach(function(btn){
        btn.addEventListener('click', function(){
          const act = btn.dataset.act;
          const row = btn.closest('.cat-row');
          const id  = row ? row.dataset.id : null;

          if(act === 'add'){
            cats.push({id: CC.newCatId(cats.map(function(c){ return c.id; })), name: '新しいカテゴリ'});
            changed = true;
          } else if(act === 'up'){
            cats = CC.moveCat(cats, id, -1); changed = true;
          } else if(act === 'down'){
            cats = CC.moveCat(cats, id, 1);  changed = true;
          } else if(act === 'del'){
            const n = countIn(cards, id);
            const name = (cats.find(function(c){ return c.id === id; }) || {}).name || '';
            const msg = n > 0
              ? '「' + name + '」を削除しますか？\nこのカテゴリの ' + n + ' 枚のカードは「' +
                CC.UNCAT_NAME + '」へ移動します（カードは削除されません）。'
              : '「' + name + '」を削除しますか？';
            if(!confirm(msg)) return;
            const r = CC.deleteCat(cats, cards, id);
            cats = r.cats; cards = r.customCards; changed = true;
          }
          render();
        });
      });
    }

    render();

    return {
      result: function(){
        const norm = CC.normalizeCats(cats);
        /* 名前を全部消してしまった場合の保険。最低1カテゴリは残す */
        if(norm.length === 0) norm.push({id: CC.UNCAT_ID, name: CC.UNCAT_NAME});
        return {
          cats: norm,
          customCards: cards,
          changed: changed || JSON.stringify(norm) !== before,
        };
      },
      cats: function(){ return cats; },
    };
  }

  /* ---------- モーダル版（学習ページから使う） ---------- */
  function open(opts){
    opts = opts || {};
    let overlay = document.getElementById('cat-editor-modal');
    if(!overlay){
      overlay = document.createElement('div');
      overlay.id = 'cat-editor-modal';
      overlay.className = 'modal-overlay';
      overlay.innerHTML =
        '<div class="modal">' +
          '<div class="modal-title">' + ico('folder') + ' カテゴリを編集</div>' +
          '<div id="cat-editor-host"></div>' +
          '<div class="modal-actions">' +
            '<button class="btn btn-secondary" id="cat-editor-cancel">キャンセル</button>' +
            '<button class="btn btn-primary" id="cat-editor-save" style="width:auto;">保存</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(overlay);
    }
    const inst = mount(overlay.querySelector('#cat-editor-host'), opts);
    overlay.classList.add('open');

    function close(){ overlay.classList.remove('open'); }
    overlay.querySelector('#cat-editor-cancel').onclick = close;
    overlay.querySelector('#cat-editor-save').onclick = function(){
      const r = inst.result();
      close();
      if(opts.onSave) opts.onSave(r);
    };
    return inst;
  }

  return {mount: mount, open: open};
})();
