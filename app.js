function doGet(e) {
  var output = HtmlService.createHtmlOutputFromFile('view');
  output.addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
  output.setTitle('NTU Vote 迷你驗證系統 - ' + ELECTION_TITLE);
  return output;
}

function showTitle() {
  return ELECTION_TITLE;
}

function authorize(req) {
  var token = req.token;
  var ret = grant_(token, function(auth) {
    var payloads = {
      'student': auth.student,
      'station': auth.station,
    }
    var newToken = updateSecret_(token, payloads);
    return {
      'status': 200,
      'token': newToken,
      'body': {
        'displayName': auth.station.displayName,
        'acceptedCount': getVoteRecordCount_(auth.station.id),
        'student': auth.student,
      },
    };
  });
  
  return ret;
}

function login(req) {
  var username = req.body.username.trim();
  var password = req.body.password.trim();

  if ((username.length === 0) || (password.length === 0)) {
     return {
       'status': 403,
       'error': 'The username and password should not be empty.',
     };
  }

  var station = authenticate_(username, password);

  var payloads = {
    'station': station,
  }
  var token = updateSecret_('LOGIN', payloads);

  log_('INFO', '[LOGIN] <' + station.displayName + '> successfully login');

  return {
    'status': 200,
    'token': token,
    'body': {
      'displayName': station.displayName,
      'acceptedCount': getVoteRecordCount_(station.id),
    },
  };
}

function logout(req) {
  var token = req.token;
  CacheService.getUserCache().remove(token);
  return {
    'status': 200,
    'body': {},
  }
}

function lookup(req) {
  var token = req.token;
  var studentId = req.body.studentId.trim().toUpperCase(); // normalize

  /* Input data (student ID) validation */
  var syntaxValid = new RegExp('^[A-Z]\\d{2}[A-Z0-9]\\d{5}$').test(studentId);
  if (!syntaxValid) {
    return {
      'status': 400,
      'error': 'The student ID is not compliant.',
    };
  }

  var ret = grant_(token, function(auth) {
    log_('INFO', '[LOOKUP] <' + studentId + '> at <' + auth.station.displayName + '>');

    /* Check if the student has already voted */
    if (isStudentVote_(studentId)) { // voted or rejected
      log_('WARNING', '[LOOKUP] <' + studentId + '> duplicated lookup');
      return {
        'status': 400,
        'error': 'Voted or rejected at another station.',
      };
    }

    try {
      var student = fetchStudent_(studentId);

      if (!student.valid) {
        log_('WARNING', '[LOOKUP] <' + studentId + '> is invalid');
        return {
          'status': 400,
          'error': 'Student ID is invalid. The student may have graduated or taken a leave of absence.'
        };
      } else {
        var ballots = fetchBallots_(student);
        var payloads = {
          'station': auth.station,
          'student': {
            'id': studentId,
            'ballots': ballots,
          },
        };

        log_('INFO', '[LOOKUP] <' + studentId + '> assign <' + ballots.join(',') + '>');

        CacheService.getUserCache().put(
          token,
          JSON.stringify(payloads),
          AUTHORIZATION_VALID_TIME
        )

        return {
          'status': 200,
          'token': token,
          'body': {
            'studentId': studentId,
            'ballots': ballots,
          },
        };
      }
    } catch (err) {
      log_('WARNING', 'Student <' + studentId + '> is unavailable');
      return {
        'status': 400,
        'error': 'Student ID is unavailable. (ACA: ' + err + ')',
      };
    }
  });

  return ret;
}

function assign(req) {
  var token = req.token;
  var operation = req.body.operation;

  /* Input data (operation) validation */
  if (['ACCEPT', 'REJECT'].indexOf(operation) < 0) {
    return {
      'status': 400,
      'error': 'Invalid operation.',
    };
  }

  var ret = grant_(token, function(auth) {
    var student = auth.student;
    var station = auth.station;
    
    var status = 400;

    /* Check if the student has already voted */
    if (isStudentVote_(student.id)) { // voted or rejected
      log_('WARNING', '[ASSIGN] <' + student.id + '> duplicated assign');
    } else {
      /* Append record */
      addVoteRecord_(student.id, station.id, operation);
      log_('INFO', '[ASSIGN] <' + student.id + '> assign with <' + operation + '>');
      status = 201;
    }

    /* Update token */
    var payloads = {
      'station': station,
    }
    var newToken = updateSecret_(token, payloads);

    return {
      'status': status,
      'token': newToken,
      'body': {
        'acceptedCount': getVoteRecordCount_(station.id),
        'studentId': student.id,
      },
    };
  });

  return ret;
}
