var SHARE_MEMO_NUMBER = 20;
var CODE_MIN_HEIGHT = 700;
var CODE_OUT_ADJUST_HEIGHT = 300;
var CODE_INDEX_ADJUST_HEIGHT = 50;
var CODE_ADJUST_HEIGHT = 200;

function ShareMemoController(param){
  this.socket = param.socket;
  this.isEditMode = false;
  this.memo_number = 1;

  this.doing_up = false;
  this.doing_down = false;

  this.writing_text = [];
  this.text_logs = [];

  this.init_sharememo();
  this.init_socket();
  this.init_dropzone();
}

ShareMemoController.prototype = {
  setName: function(name){
    this.login_name = name;
  },

  setWidth: function(width){
    $('#memo_area').css('width',width + 'px').css('margin',0);
  },

  setFocus: function(){
    var data_no = $(window.localStorage.tabSelectedID).data('no');
    if (this.isEditMode){
      $('#share_memo_' + data_no).find(".code").focus();
    }else{
      var $share_memo = $('#share_memo_' + data_no);
      this.switchEditShareMemo($share_memo, -1);
    }
  },

  top: function(){
    $('#memo_area').animate({ scrollTop: 0 }, 'fast');
  },

  down: function(){
    var that = this;
    if (!this.doing_down){
      $('#memo_area').animate({ scrollTop: $('#memo_area').scrollTop() + 400 }, 'fast', function(){
        that.doing_down = false;
      });
    }
  },

  up: function(){
    var that = this;
    if (!this.doing_up){
      $('#memo_area').animate({ scrollTop: $('#memo_area').scrollTop() - 400 }, 'fast', function(){
      that.doing_up = false;
      });
    }
  },

  prev: function(){
    var data_no = $(window.localStorage.tabSelectedID).data('no');
    data_no -= 1;
    if (data_no <= 0){
      data_no = this.memo_number;
    }
    $("#share_memo_tab_" + data_no).click();
  },

  next: function(){
    var data_no = $(window.localStorage.tabSelectedID).data('no');
    data_no += 1;
    if (data_no > this.memo_number){
      data_no = 1;
    }
    $("#share_memo_tab_" + data_no).click();
  },

  init_sharememo: function(){
    for (var i = SHARE_MEMO_NUMBER; i > 1; i--){
      $("#share_memo_tab_top").after($('<li/>').addClass("share-memo-tab").attr("data-no",i));
      $("#share_memo_1").after($('<div/>').attr('id',"share_memo_" + i).attr("data-no",i).addClass("share-memo tab-pane"));
      $("#memo_number_option_top").after($('<option/>').attr('value',i).html(i));
    }

    // タブ選択のIDを記憶する
    $("#share_memo_nav").on('click',".share-memo-tab-elem",function(){
      window.localStorage.tabSelectedID = "#" + $(this).attr("id");
    });

    $("#tab_change").click(function(){
      if ($('#share_memo_tabbable').hasClass("tabs-left")){
        $('#share_memo_nav').fadeOut("fast",function(){
          $('#share_memo_tabbable').removeClass("tabs-left");
          $('#share_memo_nav').removeClass("nav-tabs");
          $('#share_memo_nav').addClass("nav-pills");
          $('#share_memo_nav').fadeIn();
        });
        window.localStorage.tabChanged = 'true';
      }else{
        $('#share_memo_nav').fadeOut("fast",function(){
          $('#share_memo_tabbable').addClass("tabs-left");
          $('#share_memo_nav').removeClass("nav-pills");
          $('#share_memo_nav').addClass("nav-tabs");
          $('#share_memo_nav').fadeIn();
        });
        window.localStorage.tabChanged = 'false';
      }
    });

    $("#scroll_top").click(function(){
      $('#memo_area').animate({ scrollTop: 0 }, 'fast');
    });

    $(".share-memo-tab").each(function(){
      var no = $(this).data('no');
      $(this).append($('#shareMemoTabTmpl').render({no: no}));
    });

    $(".share-memo").each(function(){
      $(this).append($('#shareMemoTmpl').render());
    });

    // 前回の状態を復元する
    if ( window.localStorage ){
      // タブスタイル
      if ( window.localStorage.tabChanged == 'true' ){
        $('#share_memo_nav').hide();
        $('#share_memo_tabbable').removeClass("tabs-left");
        $('#share_memo_nav').removeClass("nav-tabs");
        $('#share_memo_nav').addClass("nav-pills");
        $('#share_memo_nav').show();
      }
      // タブ選択状態
      if ( window.localStorage.tabSelectedID ){
        $(window.localStorage.tabSelectedID).click();
      }
    }
  },

  init_socket: function(){
    var that = this;
    $(".code").autofit({min_height: CODE_MIN_HEIGHT});

    function setCaretPos(item, pos) {
      if (item.setSelectionRange) {  // Firefox, Chrome
        item.setSelectionRange(pos, pos);
      } else if (item.createTextRange) { // IE
        var range = item.createTextRange();
        range.collapse(true);
        range.moveEnd("character", pos);
        range.moveStart("character", pos);
        range.select();
      }
    };

    this.switchEditShareMemo = function($share_memo, row){
      that.isEditMode = true;
      var no = $share_memo.data('no');
      that.writing_text[no] = that.writing_text[no] ? that.writing_text[no] : { text: "" };

      var $target_code = $share_memo.children(".code");
      $target_code.val(that.writing_text[no].text);
      $('#memo_area').scrollTop(row * 18 - CODE_ADJUST_HEIGHT);

      $target_code.fadeIn('fast', function(){
        $target_code.keyup(); //call autofit
        // 編集モード時に選択した行位置を表示する
        if (row >= 0){
          $target_code.caretLine(row);
        }else{
          // キャレット位置指定なしの場合は前回の場所を復元
          $target_code.focus();
          row = $target_code.caretLine();
        }
      });
      $share_memo.children('pre').hide();
      $share_memo.children('.fix-text').show();
      $share_memo.children('.sync-text').hide();

      code_prev = $target_code.val();
      writing_loop_start(no);
    }

    $('.share-memo').on('click','.sync-text', function(){
      var $share_memo = $(this).closest('.share-memo');
      that.switchEditShareMemo($share_memo, 0);
    });

    $('.share-memo').on('dblclick','pre tr', function(){
      // クリック時の行数を取得してキャレットに設定する
      var $share_memo = $(this).closest('.share-memo');
      var row = $(this).closest("table").find("tr").index(this);
      that.switchEditShareMemo($share_memo, row);
      return false;
    });

    $('.share-memo').on('dblclick','pre', function(){
      // 文字列が無い場合は最下部にキャレットを設定する
      var $share_memo = $(this).closest('.share-memo');
      var row = $(this).find("table tr").length - 1;
      that.switchEditShareMemo($share_memo, row);
    });

    // 差分リスト表示
    $('.share-memo').on('click','.diff-button', function(){
      var $share_memo = $(this).closest('.share-memo');
      switchFixShareMemo($share_memo,1);

      var $diff_list = $share_memo.find('.diff-list');
      var share_memo_no = $share_memo.data('no');
      var text_log = that.text_logs[share_memo_no];
      if (text_log == undefined || text_log.length == 0 ){ return; }
      if (that.writing_text[share_memo_no].date != text_log[0].date){
        text_log.unshift(that.writing_text[share_memo_no]);
      }

      $diff_list.empty();
      $diff_list.append($('<li/>').append($('<a/>').addClass("diff-li").attr('href',"#").html('<i class="icon-play"></i> Current memo - ' + text_log[0].name)));
      for (var i = 1; i < text_log.length; i++){
        $diff_list.append($('<li/>').append($('<a/>').addClass("diff-li").attr('href',"#").html(text_log[i].date + " - " + text_log[i].name)));
      }
    });

    $('.share-memo').on('mouseover','.diff-li', function(){
      var diff_li_array = $(this).closest(".diff-list").find(".diff-li");
      var index = diff_li_array.index(this);
      diff_li_array.each(function(i, li){
        if (i < index){
          $(li).addClass("in_diff_range");
        }else if(i > index){
          $(li).removeClass("in_diff_range");
        }
      });
    });

    $('.share-memo').on('mouseout','.diff-li', function(){
      var diff_li_array = $(this).closest(".diff-list").find(".diff-li");
      diff_li_array.each(function(i, li){
        $(li).removeClass("in_diff_range");
      });
    });

    // 差分を表示
    $('.share-memo').on('click','.diff-li', function(){
      var $share_memo = $(this).closest('.share-memo');
      var $code_out_pre = $share_memo.find('pre');
      var share_memo_no = $share_memo.data('no');
      var index = $(this).closest(".diff-list").find(".diff-li").index(this);

      // diff 生成
      var base   = difflib.stringAsLines(that.text_logs[share_memo_no][index].text);
      var newtxt = difflib.stringAsLines(that.writing_text[share_memo_no].text);
      var sm = new difflib.SequenceMatcher(base, newtxt);
      var opcodes = sm.get_opcodes();
      var $diff_out = $share_memo.find('.diff-view');
      $diff_out.empty();
      $diff_out.append(diffview.buildView({
        baseTextLines: base,
        newTextLines: newtxt,
        opcodes: opcodes,
        baseTextName: "Current",
        newTextName: that.text_logs[share_memo_no][index].date + " - " + that.text_logs[share_memo_no][index].name,
        viewType: 1
      }));

      // diff 画面を有効化
      $diff_out.fadeIn();
      $code_out_pre.hide();

      $share_memo.find('.diff-done').show();
      $share_memo.find('.sync-text').hide();
      $share_memo.find('.index-button').hide();
      return true;
    });

    // 差分表示モード終了
    $('.share-memo').on('click','.diff-done', function(){
      var $share_memo = $(this).closest('.share-memo');
      $share_memo.find('pre').fadeIn();
      $share_memo.find('.diff-view').hide();

      $share_memo.find('.diff-done').hide();
      $share_memo.find('.sync-text').show();
      $share_memo.find('.index-button').show();
    });

    // 見出し表示
    $('.share-memo').on('click','.index-button', function(){
      var $share_memo = $(this).closest('.share-memo');
      switchFixShareMemo($share_memo,1);

      var $index_list = $share_memo.find('.index-list');
      var $code_out = $share_memo.find('.code-out');
      $index_list.empty();
      $code_out.find(":header").each(function(){
        var h_num = parseInt($(this).get()[0].localName.replace("h",""));
        var prefix = "";
        for (var i = 1; i < h_num; i++){ prefix += "&emsp;"; }
        $index_list.append($('<li/>').append($('<a/>').addClass("index-li").attr('href',"#").html(prefix + " " + $(this).text())));
      });
    });

    // 見出しへスクロール移動
    $('.share-memo').on('click','.index-li', function(){
      var index = $(this).closest(".index-list").find(".index-li").index(this);
      var $code_out = $(this).closest('.share-memo').find('.code-out');
      var pos = $code_out.find(":header").eq(index).offset().top;
      $('#memo_area').animate({ scrollTop: pos - CODE_INDEX_ADJUST_HEIGHT}, 'fast');
      return true;
    });

    // デコレートされた html へのイベント登録
    $('.share-memo').decora({
      checkbox_callback: function(context, applyCheckStatus){
        var share_memo_no = $(context).closest('.share-memo').data('no');

        // チェック対象のテキストを更新する
        that.writing_text[share_memo_no].text = applyCheckStatus(that.writing_text[share_memo_no].text);

        // 変更をサーバへ通知
        var $target_code = $(context).closest('.share-memo').children('.code');
        $target_code.val(that.writing_text[share_memo_no].text);
        socket.emit('text',{no: share_memo_no, text: $target_code.val()});
      }
    });

    function switchFixShareMemo($share_memo, row){
      that.isEditMode = false;
      if ($share_memo.children('.code').css('display') == "none"){ return; }

      // 最新の状態をサーバへ送信する
      var no = writing_loop_timer.code_no;
      var code = $share_memo.children('.code').val();
      if (code_prev != code){
        socket.emit('text',{no: no, text: code});
      }

      // 見栄えを閲覧モードへ
      updateShareMemoBody($share_memo, that.writing_text[no].text);
      $share_memo.children('.code').hide();
      $share_memo.children('pre').fadeIn();
      $share_memo.children('.fix-text').hide();
      $share_memo.children('.sync-text').show();

      // 閲覧モード時に編集していたキャレット位置を表示する
      var $target_tr = $share_memo.find('table tr').eq(row - 1);
      if ($target_tr.length > 0){
        $('#memo_area').scrollTop(0);
        $('#memo_area').scrollTop($target_tr.offset().top - CODE_OUT_ADJUST_HEIGHT);
      }
      socket.emit('add_history',{no: $share_memo.data('no')});
      writing_loop_stop();
    }

    function setToTable(html){
      var table_html = '<table><tr class="code-out-tr"><td>';
      table_html += html.replace(/[\n]/g,'</td></tr class="code-out-tr"><tr class="code-out-tr"><td>');
      return table_html += "</td></tr></table>";
    }

    function updateShareMemoBody($target, text){
      $target.find('.code-out').html(setToTable($.decora.to_html(text)));

      $target.find('tr:has(:header)').addClass("header-tr");

      // pre 表示対応
      $target.find('tr:has(.code-out-pre-border)').addClass("code-out-pre-tr");
      $target.find('td:has(.code-out-pre)').addClass("code-out-pre-td");
      $target.find('td:has(.code-out-pre-top)').addClass("code-out-pre-top-td");
      $target.find('td:has(.code-out-pre-bottom)').addClass("code-out-pre-bottom-td");
//      prettyPrint(null, $target.get(0));

      // 画像表示
      that.setColorbox($target.find('.thumbnail'));

      // 絵文字表示
      emojify.run($target.find('.code-out').get(0));

      // チェックボックスの進捗表示
      var checked_count = $target.find("input:checked").length;
      var checkbox_count = $target.find("input[type=checkbox]").length;
      if (checkbox_count > 0){
        $target.find('.checkbox-count').html(checked_count + "/" + checkbox_count + " done").show();
        if (checked_count == checkbox_count){
          $target.find('.checkbox-count').addClass('checkbox-count-done');
        }else{
          $target.find('.checkbox-count').removeClass('checkbox-count-done');
        }
      }else{
        $target.find('.checkbox-count').hide();
      }
    }

    $('#share-memo').on('click','.share-memo-tab-elem', function(){
      var writing_no = writing_loop_timer.code_no;
      if ( writing_no != 0){
        $share_memo = $('#share_memo_' + writing_no);
        switchFixShareMemo($share_memo, 1);
      }
      $('#memo_area').animate({ scrollTop: 0 }, 'fast');
      return true;
    });

    $('.share-memo').on('dblclick','.code', function(){
      switchFixShareMemo($(this).parent(), $(this).caretLine());
    });

    $('.share-memo').on('click','.fix-text', function(){
      switchFixShareMemo($(this).parent(),1);
    });

    $(".share-memo").on('keydown','.code',function(event){
      // Ctrl - S or Ctrl - enter
      if ((event.ctrlKey == true && event.keyCode == 83) ||
        (event.ctrlKey == true && event.keyCode == 13)) {
        event.returnvalue = false;
        switchFixShareMemo($(this).parent(), $(this).caretLine());
        return false;
      }
    });

    var update_timer = [];
    // for share memo
    socket.on('text', function(text_log) {
      var no = text_log.no == undefined ? 1 : text_log.no;
      that.writing_text[no] = text_log;

      var $target = $('#share_memo_' + no);
      var $target_tab = $('#share_memo_tab_' + no);

      if ( no == writing_loop_timer.code_no ){
        // 編集中の共有メモに他ユーザの変更が来たら編集終了
        if( that.login_name != text_log.name ){
          switchFixShareMemo($target, $target.children('.code').caretLine());
        }
      }else{
        // 同共有メモを編集していない場合はメモ本文を更新
        updateShareMemoBody($target, text_log.text);
      }

      // for writer
      var $text_date = $target.children('.text-date');
      $text_date.html(text_log.date);
      $text_date.removeClass("label-info");
      $text_date.addClass("label-important");
      $text_date.show();

      var title = $('<div/>').html($.decora.to_html(text_log.text.split("\n")[0])).text();
      if (!title.match(/\S/g)){
        title = " - No." + no + " - ";
      }
      var $tab_title = $target_tab.children('span').html(title);
      emojify.run($tab_title.get(0));

      var $writer = $target_tab.children('.writer');
      $writer.addClass("silent-name writing-name");
      $writer.html(text_log.name);

      var $timestamp = $target_tab.find('.timestamp');
      $timestamp.attr("data-livestamp", text_log.date);

      var is_blank = text_log.text == "";
      if (is_blank){
        $writer.hide();
        $timestamp.hide();
      }else{
        $writer.show();
        $timestamp.show();
      }

      if (update_timer[no]){
        clearTimeout(update_timer[no]);
      }
      update_timer[no] = setTimeout(function(){
        $text_date.html(text_log.date);
        $text_date.removeClass("label-important");
        $text_date.addClass("label-info");
        $writer.removeClass("writing-name");
        update_timer[no] = undefined;
      },3000);
    });

    socket.on('text_logs_with_no', function(data){
      that.text_logs[data.no] = data.logs;
    });

    var code_prev = "";

    var writing_loop_timer = { id: -1, code_no: 0};
    function writing_loop_start(no){
      $target_code = $('#share_memo_' + no).children('.code');
      var loop = function() {
        var code = $target_code.val();
        if (code_prev != code) {
          socket.emit('text',{no: no, text: code});
          code_prev = code;
        }
      };
      // 念のためタイマー止めとく
      if (writing_loop_timer.id != -1){
        writing_loop_stop();
      }
      writing_loop_timer = {id: setInterval(loop, 400), code_no: no};
    }

    function writing_loop_stop(){
      clearInterval(writing_loop_timer.id);
      writing_loop_timer = { id: -1, code_no: 0};
    }

    $('#memo_number').bind('change',function(){
      var num = $(this).val();
      socket.emit('memo_number', {num: num});
    });

    socket.on('memo_number', function(data){
      that.memo_number = data.num;
      $('.share-memo-tab-elem').hide();
      for (var i = 1; i <= that.memo_number; i++){
        $('#share_memo_tab_' + i).fadeIn("fast");
        $('#share_memo_tab_' + i).css("display", "block");
      }
      $('#memo_number').val(that.memo_number);
    });
  },

  init_dropzone: function(){
    var that = this;

    // 閲覧モードの行指定でドロップ
    new DropZone({
      dropTarget: $('.code-out'),
      dropChildSelector: '.code-out-tr',
      alertTarget: $('#alert_memo_area'),
      uploadedAction: function(context, res){
        var share_memo_no = $(context).closest('.share-memo').data('no');
        var row = $(context).closest("table").find("tr").index(context);

        // ドロップ位置にファイルを差し込む
        var text_array = that.writing_text[share_memo_no].text.split("\n");
        text_array.splice(row + 1,0,res.fileName + " ");
        that.writing_text[share_memo_no].text = text_array.join("\n");
        var $target_code = $(context).closest('.share-memo').children('.code');
        $target_code.val(that.writing_text[share_memo_no].text);

        // 変更をサーバへ通知
        socket.emit('text',{no: share_memo_no, text: $target_code.val()});
      }
    });

    // 閲覧モードの行以外の部分にドロップ
    new DropZone({
      dropTarget: $('.code-out'),
      alertTarget: $('#alert_memo_area'),
      uploadedAction: function(context, res){
        var share_memo_no = $(context).closest('.share-memo').data('no');

        // メモの先頭に画像を差し込む
        that.writing_text[share_memo_no].text = res.fileName + ' ' + '\n' + that.writing_text[share_memo_no].text;

        // 変更をサーバへ通知
        var $target_code = $(context).closest('.share-memo').children('.code');
        $target_code.val(that.writing_text[share_memo_no].text);
        socket.emit('text',{no: share_memo_no, text: $target_code.val()});
      }
    });
 
    // 編集モードへのドロップ
    new DropZone({
      dropTarget: $('.code'),
      alertTarget: $('#alert_memo_area'),
      uploadedAction: function(context, res){
        var share_memo_no = $(context).closest('.share-memo').data('no');
        var row = $(context).caretLine();

        // メモのキャレット位置にファイルを差し込む
        var text_array = that.writing_text[share_memo_no].text.split("\n");
        text_array.splice(row - 1,0,res.fileName + ' ');
        that.writing_text[share_memo_no].text = text_array.join("\n");
        var $target_code = $(context).closest('.share-memo').children('.code');
        $target_code.val(that.writing_text[share_memo_no].text);
      }
    });
  },

  setColorbox: function($dom){
    $dom.colorbox({
      transition: "none",
      rel: "img",
      maxWidth: "100%",
      maxHeight: "100%",
      initialWidth: "200px",
      initialHeight: "200px"
    });
  }
}

