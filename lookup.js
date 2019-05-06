function isStudentVote_(studentId) {
  var studentIds = fetchColumn_(fetchSheetRange_(DB_ID, 'voted', 'A', 'A'), 'student_id');
  return studentIds.indexOf(studentId) > -1;
}

function isMatch_(str, rule) {
  return new RegExp('^' + rule.split('*').join('.') + '$').test(str);
}

function fetchBallots_(student) {
  var ret = [];
  
  /* Lookup general setting */
  var ballots = fetchSheetRange_(DB_ID, 'ballots', 'A', 'E')
  
  var ids = fetchColumn_(ballots, 'id');
  var displayNames = fetchColumn_(ballots, 'display_name');
  
  var cond_ids = fetchColumn_(ballots, 'cond_id');
  var fields = fetchColumn_(ballots, 'field');
  var values = fetchColumn_(ballots, 'value');
  
  var conds = {};
  ids.map(function(el, i) {
    if (!conds[el]) {
      conds[el] = {}
    }
    
    var cid = cond_ids[i];
    if (!conds[el][cid]) {
      conds[el][cid] = {}
    }
    
    conds[el][cid][fields[i]] = values[i];
  })
  
  for (var bid in conds) {
    /* For each ballot */
    for (var cid in conds[bid]) {
      /* For each condition set of a specific ballot */
      var all = true;
      for (var field in conds[bid][cid]) {
        /* For each condition of a condition set */
        var value = conds[bid][cid][field];
        if (!isMatch_(eval('student.' + field), value)) {
          all = false;
          break;
        }
      }
      
      if (all) {
        ret.push(bid);
      }
    }
  }
  
  /* Lookup overwrites of general cases */
  ret = checkOverwrites_(student.id, 'overwrites', ret);
  
  /* Remove dulpicate results */
  ret = ret.filter(function(el, i, self) {return self.indexOf(el) === i});
  
  /* Translate to indice and display names */
  ret = ret.map(function(el) {return {'id': el, 'displayName': displayNames[ids.indexOf(el)]}});
  
  return ret;
}

function checkOverwrites_(studentId, tableName, chaining) {
  /* Lookup overwrites */
  var overwrites = fetchSheetRange_(DB_ID, tableName, 'A', 'C')
  
  var studentIds = fetchColumn_(overwrites, 'student_id');
  var ballotIds = fetchColumn_(overwrites, 'ballot_id');
  var modes = fetchColumn_(overwrites, 'mode');
  
  var row = studentIds.indexOf(studentId);
  while (row > -1) {
    if (modes[row] === 'ADD') {
      chaining.push(ballotIds[row])
    } else if (modes[row] === 'BAN') {
      var remove = chaining.indexOf(ballotIds[row]);
      if (remove > -1) {
        chaining.splice(remove, 1);
      }
    }
    row = studentIds.indexOf(studentId, row+1);
  }
  
  return chaining;
}
