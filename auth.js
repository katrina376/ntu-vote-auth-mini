function randomString_(len, chars) {
  var ret = '';

  for (var i = 0; i < len; i++) {
    var idx = Math.floor(Math.random() * chars.length);
    ret = ret + chars[idx];
  }

  return ret;
}

function authenticate_(username, password) {
  var table = fetchSheetRange_(DB_ID, 'stations', 'A', 'D');

  var conditions = {
    'username': {
      'value': username
    }
  }

  if (!fetchCell_(table, conditions, 'username')) {
    throw 'Invalid username.';
  } else if (fetchCell_(table, conditions, 'password') !== password) {
    throw 'Wrong password.';
  } else {
    return {
      'displayName': fetchCell_(table, conditions, 'display_name'),
      'id': fetchCell_(table, conditions, 'id'),
    }
  }
}

function grant_(token, func) {
  var auth = CacheService.getScriptCache().get(token);
  if (auth) {
    /* Cache remains valid */
    var parsed = JSON.parse(auth);
    return func(parsed);
  } else {
    /* Cache is cleared for some reason; check out spreadsheet */
    var table = fetchSheetRange_(SYS_DB_ID, 'tokens', 'A', 'F');
    var conditions = {
      'token': {
        'value': token,
      },
      'is_valid': {
        'value': true,
        'type': Boolean,
      },
      'time': {
        'value': Date.now() - AUTHORIZATION_VALID_TIME * 1000,
        'type': function(s) {return new Date(s)},
        'operator': function(a, b) {return a.getTime() > b},
      }
    }
    
    var content = fetchCell_(table, conditions, 'content');
    if (content) {
      var parsed = JSON.parse(content);
      return func(parsed);
    } else {
      return {
        'status': 403,
        'error': displayError_('UNAUTHORIZED'),
      };
    }
  }
}

function updateSecret_(parent, payloads) {
  var app = SpreadsheetApp.openById(SYS_DB_ID);
  var sheet = app.getSheetByName('tokens');
  var n = sheet.getLastRow() + 1; // the row number after append
  var validator = (
    '=AND(' +
    'COUNTIF(B$2:B,A'+ n +')=0,'+
    'COUNTIFS(B'+ n +':B,"LOGIN",C' + n + ':C,C'+ n +')<=' + ALLOW_LOGIN_NUMBER + ',' +
    'D' + n + '+TIME(0,' + AUTHORIZATION_VALID_TIME + ',0)>NOW()'+
    ')'
  );

  var token = randomString_(TOKEN_LENGTH, CHARS);
  var content = JSON.stringify(payloads);
  
  sheet.appendRow([token, parent, payloads.station.id, new Date(), validator, content]);
  SpreadsheetApp.flush();
  
  CacheService.getScriptCache().remove(parent);
  CacheService.getScriptCache().put(
    token,
    content,
    AUTHORIZATION_VALID_TIME
  );

  return token;
};

function addVoteRecord_(studentId, station, option, ballots) {
  var app = SpreadsheetApp.openById(DB_ID);
  var sheet = app.getSheetByName('voted');
  
  var record = '__NONE__'
  if (ballots.length > 0) {
    record = ballots.join(',');
  }
  
  sheet.appendRow([studentId, station, option, record, new Date()]);
  SpreadsheetApp.flush();
  return;
}

function getVoteRecordCount_(station) {
  var table = fetchSheetRange_(DB_ID, 'voted', 'A', 'D');
  var conditions = {
    'station_id': {
      'value': station,
    },
    'operation': {
      'value': 'ACCEPT',
    }
  }
  
  return fetchCells_(table, conditions, 'student_id').length;
}

function getVoteVoucher_(ballots) {
  var options = {
    'method' : 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify({'token': VOTING_SYS_AUTHORIZATION_KEY, 'body': {'ballots': ballots}}),
    'muteHttpExceptions': true,
  };
  
  var url = VOTING_SYS_URL;
  
  if (url) {
    var resp = UrlFetchApp.fetch(url, options); 
    var code = resp.getResponseCode();
    
    if (String(code) !== '200') {
      throw 'Service respond code ' + code;
    } else {
      var content = resp.getContentText();
      var parsed = JSON.parse(content);
      if (parsed.body) {
        return parsed.body.voucher;
      } else {
        throw displayError_('VOUCHER_FAILURE');
      }
    }
  } else {
    return undefined;
  }
}