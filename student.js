var Student_ = function(info) {
  this.id = info.getChildText('STUID');
  this.valid = info.getChildText('INCAMPUS').toLowerCase() === 'true';
  this.dptCode = info.getChildText('DPTCODE');
  this.type = {
    'name': info.getChildText('STUTYPE'),
    'code': this.id[0],
  }
  this.college = {
    'name': info.getChildText('COLLEGE'),
    'code': this.dptCode[0],
  }
}

function fetchStudent_(studentId) {
  var root = XmlService.createElement('STUREQ');

  var uid = XmlService.createElement('UID').setText(ACA_API_USER);
  var password = XmlService.createElement('PASSWORD').setText(ACA_API_PASSWORD);
  var stuid = XmlService.createElement('STUID').setText(studentId + '0');
  var ver = XmlService.createElement('Vers').setText('1.00');

  root.addContent(ver).addContent(uid).addContent(password).addContent(stuid);

  var doc = XmlService.createDocument(root);
  var queryString = XmlService.getRawFormat().setEncoding('big5').format(doc);

  var options = {
    'method' : 'post',
    'contentType': 'application/xml',
    'headers': {'X-Requested-With': 'NTUVote'},
    'payload': queryString,
    'muteHttpExceptions': true,
  };

  try {
    var url = ACA_API_URL;
    var resp = UrlFetchApp.fetch(url, options);
    
    var code = resp.getResponseCode();
    
    if (String(code) !== '200') {
      throw 'Service respond code ' + code;
    } else {
      var content = resp.getContentText();
      var info = XmlService.parse(content).getRootElement();
      var ok = info.getChildText('WEBOK') === 'OK';
  
      if (ok) {
        return new Student_(info);
      } else {
        throw info.getChildText('ERROR');
      }
    }
  } catch (err) {
    log_('ERROR', '[ACA] <' + err + '> when lookup <' + studentId + '>');
    throw err;
  }
}
