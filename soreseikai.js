function doGet(e) {
  if (e.parameter.token !== "<Slack Token1>" && e.parameter.token !== "<Slack Token2>") {
    //Token 1 = Send, Token2 = Open 
    return ContentService.createTextOutput("You can't use this."); //トークンが異なる場合
  } else if (e.parameter.channel_id !== "<Channel ID>") {
    return ContentService.createTextOutput("You can't use this here."); //IDが異なる場合
  }
  var docLock = LockService.getScriptLock();
  var ret = "";
  var name = e.parameter.user_name; //User Nameなので表示名などとは異なる
  if (docLock.tryLock(10000)) {
    try {
      var sheet = SpreadsheetApp.openById("<SpreadSheet ID>").getSheets()[0]; //回答を保存するスプレッドシート
      var rowNum = sheet.getLastRow();
      var range = sheet.getRange(1, 1, rowNum + 1, 3);
      if (e.parameter.command === "/send_soreseikai") {
        //回答の受付
        //使用するコマンドによって変更
        var id = e.parameter.user_id;
        var text = e.parameter.text;
        var searchRange = sheet.getRange(1, 1, rowNum + 1, 1);
        var textFinder = searchRange.createTextFinder(id).matchEntireCell(true);
        var find = textFinder.findNext()
        var row = 0;
        if (find === null) {
          //その問題に対して初めて回答する場合
          row = rowNum + 1
          range.getCell(row, 1).setValue(id);
          range.getCell(row, 2).setValue(name);
          range.getCell(row, 3).setValue(text);
          sendHttpPost(name + "が回答したよ!");
        } else {
          //既に回答していた場合
          //既存の回答に上書きする
          row = find.getRow();
          range.getCell(row, 2).setValue(name);
          range.getCell(row, 3).setValue(text);
          sendHttpPost(name + "が再回答したよ!");
        }
        ret = "";
      } else if (e.parameter.command === "/open_soreseikai") {
        //回答の発表
        //使用するコマンドによって変更
        var result = "回答発表!\n";
        for (var i = 1; i < rowNum + 1; i++) {
         //各人の回答を "<名前>「<回答>」"の形に
          result += range.getCell(i, 2).getValue();
          result += "「";
          result += range.getCell(i, 3).getValue();
          result += "」\n";
        }
        sheet.clear();
        sendHttpPost(result);
        ret = "";
      } else {
        ret = "Invalid Command"; //コマンドが異なる場合
      }
    } finally {
      docLock.releaseLock();
      return ContentService.createTextOutput(ret);
    }
  } else {
    //ロック中の場合
    sendHttpPost(name + "さん！他の人が処理中だったからやり直して！");
    return ContentService.createTextOutput(ret);
  }

}
function sendHttpPost(message) {
  //Slackに応答を送信する
  var payload =
  {
    "text": message
  };

  var options =
  {
    "method": "POST",
    "headers": { "Content-type": "application/json" },
    "payload": JSON.stringify(payload)
  };

  UrlFetchApp.fetch("<Slack Webhook URL>", options);
}