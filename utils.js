function log_(level, content) {
  var app = SpreadsheetApp.openById(SYS_DB_ID);
  var sheet = app.getSheetByName('log');
  sheet.appendRow([level, new Date(), content]);
}

function fetchSheetRange_(dbid, name, fromColumn, toColumn) {
  var app = SpreadsheetApp.openById(dbid);
  var sheet = app.getSheetByName(name);
  var rowNum = sheet.getLastRow();
  var columns = sheet.getRange(fromColumn + '1:' + toColumn + '1').getValues()[0];
  var values = sheet.getRange(fromColumn + '2:'+ toColumn + rowNum).getValues();
  return {
    header: columns,
    body: values
  };
}

function fetchColumn_(table, columnName, type) {
  type = type || String;
  var idx = table.header.indexOf(columnName);
  return table.body.map(function(row){return type(row[idx])});
}

function fetchCells_(table, conditions, targetField, type) {
  var base = fetchColumn_(table, targetField, type);
  
  var idxMap = [];
  for (var i = 0; i < base.length; ++i) {
    idxMap.push(i);
  }
  
  for (var key in conditions) {
    var idxFilter = [];
    var cond = conditions[key];
    var ref = fetchColumn_(table, key, cond.type);
    var opr = cond.operator || function(a, b) {return a === b};
    
    base = base.filter(function(el, i) {
      var idx = idxMap[i];
      if (opr(ref[idx], cond.value)) {
          idxFilter.push(idx);
      }
      return opr(ref[idx], cond.value)
    });
    
    idxMap = idxFilter.slice();
  }
  
  var ret = base.filter(function(el){return typeof el !== 'null'});
  return ret;
}

function fetchCell_(table, conditions, targetField, type) {
  return fetchCells_(table, conditions, targetField, type)[0];
}

function readSheet2Arr_(name, transform) {
  transform = transform || {};
  
  var app = SpreadsheetApp.openById(DB_ID);
  var sheet = app.getSheetByName(name);
  
  var colNum = sheet.getLastColumn();
  var rowNum = sheet.getLastRow();
  var values = sheet.getRange(1, 1, rowNum, colNum).getValues();
  
  var columns = values.shift();
  var data = values.map(function(value){
    var o = {};
    value.map(function(el, i) {
      var column = columns[i];
      var type = transform[column] || String;
      o[column] = type(el);
    })
    return o;
  });
  
  return data;
}

function readSheet2Obj_(name, keyColumn, transform) {
  transform = transform || {};
  
  var app = SpreadsheetApp.openById(DB_ID);
  var sheet = app.getSheetByName(name);
  
  var colNum = sheet.getLastColumn();
  var rowNum = sheet.getLastRow();
  var values = sheet.getRange(1, 1, rowNum, colNum).getValues();
  
  var columns = values.shift();
  var data = {};
  
  values.map(function(value){
    var o = {};
    var key = value[columns.indexOf(keyColumn)];
    
    value.map(function(el, i) {
      var column = columns[i];
      var type = transform[column] || String;
      o[column] = type(el);
    });
    
    data[key] = new Object(o);
  });
    
  return data;
}

function secure_(content, key) {
  // TODO: encrypt with the key
  return secureContent;
}

function displayError_(code) {
  if (ERROR_DISPLAY[code]) {
    if (LANGUAGE === 'zh') {
      return ERROR_DISPLAY[code]['zh'];
    } else {
      return ERROR_DISPLAY[code]['en'];
    }
  } else {
    return 'Unrecognized error: ' + code;
  }
}
