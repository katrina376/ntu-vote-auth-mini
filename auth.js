function randomString_(len) {
  var ret = '';

  for (var i = 0; i < len; i++) {
    var idx = Math.floor(Math.random() * CHARS.length);
    ret = ret + CHARS[idx];
  }

  return ret;
}

function authenticate_(username, password) {
  var table = fetchSheetRange_('stations', 'A', 'D');

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
  var auth = CacheService.getUserCache().get(token);
  if (auth) {
    var parsed = JSON.parse(auth);
    return func(parsed);
  } else {
    return {
      'status': 403,
      'error': 'Unauthorized. Please refresh the page and login again.',
    };
  }
}

function updateSecret_(parent, payloads) {
  var app = SpreadsheetApp.openById(DB_ID);
  var sheet = app.getSheetByName('tokens');
  var n = sheet.getLastRow() + 1; // the row number after append
  var validator = (
    '=AND(' +
    'COUNTIF(B$2:B,A'+ n +')=0,'+
    'COUNTIFS(B'+ n +':B,"LOGIN",C' + n + ':C,C'+ n +')<=' + ALLOW_LOGIN_NUMBER + ',' +
    'D' + n + '+TIME(0,' + AUTHORIZATION_VALID_TIME + ',0)>NOW()'+
    ')'
  );

  var token = randomString_(TOKEN_LENGTH);
  var content = JSON.stringify(payloads);
  
  sheet.appendRow([token, parent, payloads.station.id, new Date(), validator, content]);
  CacheService.getUserCache().remove(parent);
  CacheService.getUserCache().put(
    token,
    content,
    AUTHORIZATION_VALID_TIME
  );

  return token;
};

function addVoteRecord_(studentId, station, option) {
  var app = SpreadsheetApp.openById(DB_ID);
  var sheet = app.getSheetByName('voted');
  sheet.appendRow([studentId, station, option, new Date()]);
  return;
}

function getVoteRecordCount_(station) {
  var table = fetchSheetRange_('voted', 'A', 'D');
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
