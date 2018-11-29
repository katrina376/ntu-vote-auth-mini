function isStudentVote_(studentId) {
  var studentIds = fetchColumn_(fetchSheetRange_('voted', 'A', 'A'), 'student_id');
  return studentIds.indexOf(studentId) > -1;
}

function isMatch_(str, rule) {
  return new RegExp('^' + rule.split('*').join('.') + '$').test(str);
}

function fetchBallots_(student) {
  var ret = [];
  
  /* Lookup general setting */
  var ballots = fetchSheetRange_('ballots', 'A', 'E')
  
  var ids = fetchColumn_(ballots, 'id');
  var displayNames = fetchColumn_(ballots, 'display_name');
  var fields = fetchColumn_(ballots, 'field');
  var values = fetchColumn_(ballots, 'value');
  
  var conds = {};
  ids.map(function(el, i) {
    if (!conds[el]) {
      conds[el] = {}
    }
    conds[el][fields[i]] = values[i];
  })
  
  for (var i in conds) {
    var all = true;
    for (var field in conds[i]) {
      var value = conds[i][field];
      // TODO: workaround for avoiding eval
      if (!isMatch_(eval('student.' + field), value)) {
        all = false;
        break;
      }
    }
    
    if (all) {
      ret.push(i);
    }
  }
  
  /* Lookup overwrites */
  var overwrites = fetchSheetRange_('overwrites', 'A', 'C')
  
  var studentIds = fetchColumn_(overwrites, 'student_id');
  var ballotIds = fetchColumn_(overwrites, 'ballot_id');
  var modes = fetchColumn_(overwrites, 'mode');
  
  var row = studentIds.indexOf(student.id)
  while (row > -1) {
    if (modes[row] === 'ADD') {
      ret.push(ballotIds[row])
    } else if (modes[row] === 'BAN') {
      var remove = ret.indexOf(ballotIds[row]);
      if (remove > -1) {
        ret.splice(remove, 1);
      }
    }
    row = studentIds.indexOf(student.id, row+1);
  }
  
  /* Remove dulpicate results */
  ret = ret.filter(function(el, i, self) {return self.indexOf(el) === i});
  
  /* Translate to display names */
  ret = ret.map(function(el) {return displayNames[ids.indexOf(el)]});
  
  return ret;
}
