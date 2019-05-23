COLLEGE_MAP = {
  '文學院': '1',
  '理學院': '2',
  '社會科學院': '3',
  '醫學院': '4',
  '工學院': '5',
  '生物資源暨農學院': '6',
  '管理學院': '7',
  '公共衛生學院': '8',
  '電機資訊學院': '9',
  '法律學院': 'A',
  '生命科學院': 'B',
  '進修推廣學院': 'E',
  '共教中心': 'H',
  '牙醫專業學院': '4',
  '藥學專業學院': '4',
  '獸醫專業學院': '6',
}

STUTYPE_MAP = {
  '學士班': 'B',
  '學士班交換訪問生': 'T',
  '進修學士班': 'E',
  '碩士交換訪問生': 'A',
  '博士交換訪問生': 'C',
  '博士生': 'D',
  '博士生': 'F',
  '博士生': 'Q',
  '碩士生': 'P',
  '碩士生': 'R',
  '高中預修生': 'K',
  '國際華語學員': 'L',
}

ERROR_DISPLAY = {
  'INPUT_EMPTY': {
    'en': 'The username and password should not be empty.',
    'zh': '帳號或密碼應非空白。',
  },
  'STUDENT_ID_NOT_COMPLIANT': {
    'en': 'The student ID is not compliant.',
    'zh': '學號格式不符合規範。',
  },
  'AUTHENTICATED': {
    'en': 'Voted or rejected at another station.',
    'zh': '已於其他投票所確認領票、終止驗證，或申請遠距投票。',
  },
  'ACA_EXCEPTION_FUNC': {
    'en': function(err) {return 'Student ID is unavailable. (ACA: ' + err + ')'},
    'zh': function(err) {return '該學號無法查詢。（ACA：' + err + '）'},
  },
  'STUDENT_ID_INVALID': {
    'en': 'Student ID is invalid. The student may have graduated or taken a leave of absence.',
    'zh': '該學號非在學學生之學號；可能已畢業或已辦理休學。',
  },
  'OPERATION_INVALID': {
    'en': 'Invalid operation.',
    'zh': '操作無效。',
  },
  'UNAUTHORIZED': {
    'en': 'Unauthorized. Please refresh the page and login again.',
    'zh': '登入狀態失效，請重新整理畫面並再次登入。',
  },
  'VOUCHER_FAILURE': {
    'en': 'Failed to retrieve a voucher.',
    'zh': '兌換碼索取失敗。',
  },
}
