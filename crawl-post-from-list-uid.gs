function configInfo() {
  var sheetID = 'google-sheet-id';
  var token = 'faceboo-token';
  var fromDate = '2021-09-01';
  var keyword = keyword = ['nệm', 'gối'];
  return [sheetID, token, fromDate, keyword]
}

function runMe(){
  var configValues = configInfo();
  var token = configValues[1];
  var members = SpreadsheetApp.openById(configValues[0]).getSheetByName("Members");
  var posts = SpreadsheetApp.openById(configValues[0]).getSheetByName("Posts");  
  var membersLastRow = members.getLastRow();
  for(var i = 2; i <= membersLastRow; i++){
    var userID = members.getRange('F'+i).getValue();
    if(userID){
      var postArr = getPostFromUserID(userID, 100, token);
      for(var j = 0; j < postArr.length; j++){
        // Logger.log(postArr[j]);
        posts.appendRow(postArr[j]);
      }
    }

  }
}

function getPostFromUserID(user_id, limit, token) {
  var para = '?fields=feed.limit(';
  para = encodeURI(para);  
  var crawlThing = "https://graph.facebook.com/v11.0/"+user_id+para+limit+")&access_token="+token;
  var options = {
    'muteHttpExceptions' : true,
  };
  var jsonData = UrlFetchApp.fetch(crawlThing,options);
  Logger.log(crawlThing);
  var infoData = jsonData.getContentText();    
  var parseData = JSON.parse(infoData);
  var userPostArr = [];
  if(parseData['feed']){
    var data = parseData['feed']['data'];
    for(var i = 0; i < data.length; i++){
      var postID = data[i].id;
      Logger.log(i + ' - ' + postID);
      var created_time = data[i].created_time;
      created_time = created_time.replace(/T.*$/g, "");
      var mess = '';
      if(data[i].message){
        mess = data[i].message;
      }
      mess = mess.toLowerCase();
      var fromDate = '2021-09-20';
      var  keyword = ['vua', 'nệm','đệm', 'gối'];
      if(isDateB_afterDateA(created_time, fromDate)){
        if(isPostCointainsKeyword(mess, keyword)){
          var postInfo = getPostInfo(postID, token);
          var userInfo = getUserbyID(user_id, token)
          mess = getFirstLineContent(mess);
          mess = '=HYPERLINK("https://facebook.com/'+postID+'";"'+mess+'")';
          userPostArr.push([userInfo[0],userInfo[1],userInfo[2],postID,created_time,mess,postInfo[0],postInfo[1],postInfo[2]]);
          Logger.log(postInfo);
        }
      }
    }
  }

  return userPostArr;
}

function getPostInfo(post_id, token){
  // post_id = '100001733676844_4475694665831612';
  // token =     'EAAAAZAw4FxQIBAFhRVWxy9LMVZA777vapPyalQ5XA0L7KUOGYxovLaALJeyz2haurSZBHiUemx7Bvm0w4olvBL7xZC8EzinR6s6ncZA0NNZA7B8mP2LDHquQdpfrp40kVq2hhpLFrphDOttam873GPf3tObawXxQG442pVjOEEIoLrIZAZAQ6A3caRFNpxa0iVoZD';
  var para = '?fields=comments.summary(true).limit(1),reactions.summary(true).limit(1),shares';
  para = encodeURI(para);  
  var crawlThing = "https://graph.facebook.com/v11.0/"+post_id+para+"&access_token="+token;
  var options = {
    'muteHttpExceptions' : true,
  };
  var jsonData = UrlFetchApp.fetch(crawlThing,options);
  var infoData = jsonData.getContentText();    
  var parseData = JSON.parse(infoData);
  var comments_count = 0;
  if(parseData.comments){
    comments_count = parseData.comments.summary.total_count;
  }
  var reactions_count = 0;
  if(parseData.reactions){
    reactions_count = parseData.reactions.summary.total_count;
  }
  var shares_count = 0;
  if(parseData.shares){
    shares_count = parseData.shares.count;
  }
  return [comments_count, reactions_count, shares_count];
}



function getFirstLineContent(content){
    var postMessFirstLine = content.split('\n')[0];
    postMessFirstLine = postMessFirstLine.replace(/"/g, "");
    return postMessFirstLine;
}

function getUserbyID(user_id, token){
  var para = '';
  para = encodeURI(para);  
  var crawlThing = "https://graph.facebook.com/v11.0/"+user_id+para+"?access_token="+token;
  var options = {
    'muteHttpExceptions' : true,
  };
  var jsonData = UrlFetchApp.fetch(crawlThing,options);
  var infoData = jsonData.getContentText();    
  var parseData = JSON.parse(infoData);
  var user_name = parseData.name;
  var user_link = '=HYPERLINK("https://facebook.com/'+user_id+'";"'+user_name+'")';
  return [user_id, user_name, user_link];
}




function isPostCointainsKeyword(post, keyword){
  var answer = false;
  for(var i = 0; i < keyword.length; i++){
    if(post.includes(keyword[i])){
      answer = true;
    }
  }
  Logger.log(answer);
  return answer;
}

function isDateB_afterDateA(dateB, dateA){
  if(dateToEpoch(dateB) - dateToEpoch(dateA) >= 0){
    return true;
  }else{
    return false
  }
}
function dateToEpoch(date){
  var epoch = new Date(date).valueOf();
  epoch = epoch / 1000;
  return epoch;
}
