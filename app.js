function doGet(e) {
  var output = HtmlService.createHtmlOutputFromFile('view');
  output.addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
  output.setTitle('NTU Vote 迷你驗證系統 - ' + ELECTION_TITLE);
  return output;
}

function showTitle() {
  return ELECTION_TITLE;
}

function authorize(token) {
  var auth = CacheService.getUserCache().get(token);
  if (auth) {
    var parsed = JSON.parse(auth);
    var payloads = {
      'student': parsed.student,
      'station': parsed.station,
    }
    var newToken = updateSecret_(token, payloads);
    return {
      'content': auth,
      'token': newToken,
      'displayName': parsed.station.displayName,
      'student': parsed.student,
    };
  } else {
    throw 'Invalid token. Please refresh the page and login again.';
  }
}

function login(f) {
  var username = f.stationUser.trim();
  var password = f.stationPass.trim();

  if ((username.length === 0) || (password.length === 0)) {
     throw 'The username and password should not be empty.';
  }

  var station = authenticate_(username, password);

  var payloads = {
    'station': station,
  }
  var token = updateSecret_('LOGIN', payloads);

  log_('INFO', '[LOGIN] <' + station.displayName + '> successfully login');

  return {
    'token': token,
    'displayName': station.displayName,
  };
}

function logout(token) {
  CacheService.getUserCache().remove(token);
}

function lookup(f) {
  var token = f.token;
  var studentId = f.studentId.trim().toUpperCase(); // normalize

  /* Input data (student ID) validation */
  var syntaxValid = new RegExp('^[A-Z]\\d{2}[A-Z0-9]\\d{5}$').test(studentId);
  if (!syntaxValid) {
    throw 'The student ID is not compliant.';
  }

  var ret = grant_(token, function(auth) {
    log_('INFO', '[LOOKUP] <' + studentId + '> at <' + auth.station.displayName + '>');

    /* Check if the student has already voted */
    if (isStudentVote_(studentId)) { // voted or rejected
      log_('WARNING', '[LOOKUP] <' + studentId + '> duplicated lookup');
      throw 'Voted or rejected at another station.';
    }

    try {
      var student = fetchStudent_(studentId);

      if (!student.valid) {
        log_('WARNING', '[LOOKUP] <' + studentId + '> is invalid');
        throw 'Student ID is invalid. The student may have graduated or taken a leave of absence.';
      } else {
        var ballots = fetchBallots_(student);
        var ret = {
          'studentId': studentId,
          'result': ballots,
        };

        log_('INFO', '[LOOKUP] <' + studentId + '> assign <' + ballots.join(',') + '>');

        CacheService.getUserCache().put(
          token,
          JSON.stringify({'station': auth.station, 'student': ret}),
          AUTHORIZATION_VALID_TIME
        )

        return ret;
      }
    } catch (err) {
      log_('WARNING', 'Student <' + studentId + '> is unavailable');
      throw 'Student ID is unavailable. (ACA: ' + err + ')';
    }
  });

  return ret;
}

function assign(f) {
  var token = f.token;
  var operation = f.operation;

  /* Input data (operation) validation */
  if (['ACCEPT', 'REJECT'].indexOf(operation) < 0) {
    throw 'Invalid operation.';
  }

  var ret = grant_(token, function(auth) {
    var student = auth.student;
    var station = auth.station;

    var studentId = student.studentId;
    var ok = false;

    /* Check if the student has already voted */
    if (isStudentVote_(studentId)) { // voted or rejected
      log_('WARNING', '[ASSIGN] <' + studentId + '> duplicated assign');
    } else {
      /* Append record */
      addVoteRecord_(studentId, station.id, operation);
      log_('INFO', '[ASSIGN] <' + studentId + '> assign with <' + operation + '>');
      ok = true;
    }

    /* Update token */
    var payloads = {
      'station': station,
    }
    var newToken = updateSecret_(token, payloads);

    return {
      'token': newToken,
      'studentId': studentId,
      'ok': ok,
    };
  });

  return ret;
}
