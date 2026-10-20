// ============================================================
// CRM App - SMART Google Apps Script (auto column-detect)
// Ye script teri EXISTING sheet ke columns khud pehchaan leta hai.
//
// LAGANE KA TAREEKA (app rebuild ki zaroorat NAHI):
// 1. ISI sheet mein: Extensions > Apps Script
// 2. Purana code sab mita de, ye paste kar, Save (💾)
// 3. Deploy > New deployment > gear(⚙️) > Web app
//      - Execute as: Me
//      - Who has access: Anyone
//    Deploy > URL copy kar
// 4. App > Settings > URL paste kar > Save > Test Sync
// Bas! Tera purana data app mein dikhne lagega.
// ============================================================

// Tere data wale tab ka naam (khaali chhod = pehla/first tab use hoga):
var SHEET_NAME = '';

// App ke 12 fields — ye order mat badalna (app isi order mein padhta hai):
var APP_FIELDS = ['id','name','phone','email','city','source','status','notes','followUpDate','lastCalled','callCount','createdAt'];

// Jab naya column banana pade to ye naam use honge:
var STD_HEADER = {
  id:'ID', name:'Name', phone:'Phone', email:'Email', city:'City',
  source:'Source', status:'Status', notes:'Notes', followUpDate:'Follow-up Date',
  lastCalled:'Last Called', callCount:'Call Count', createdAt:'Created At'
};

// AGAR auto-detect kisi column ko miss kare, yahan apna EXACT header likh de.
// Example:  name: 'Grahak Naam',  phone: 'Mobile Number',
var MANUAL_MAP = {
};

// Auto-detect ke liye possible header naam (English + Hinglish):
var SYNONYMS = {
  id: ['id','leadid','srno','sno','serial','serialno'],
  name: ['name','naam','fullname','leadname','customer','customername','client','clientname','contactname','grahak','person'],
  phone: ['phone','phoneno','phonenumber','mobile','mobileno','mobilenumber','number','contactno','contactnumber','whatsapp','whatsappno','cell','cellno','mob','mobno'],
  email: ['email','emailid','mail','emailaddress','e-mail'],
  city: ['city','sheher','shahar','location','place','town','area','address'],
  source: ['source','leadsource','from','via','channel','reference','ref'],
  status: ['status','stage','leadstatus','state'],
  notes: ['notes','note','remarks','remark','comment','comments','description','desc','detail','details'],
  followUpDate: ['followupdate','followup','nextfollowup','followupon','nextcall','callback','reminder','reminderdate','nextdate','followupdt'],
  lastCalled: ['lastcalled','lastcall','lastcontacted','lastcontact'],
  callCount: ['callcount','calls','nocalls','noofcalls','totalcalls'],
  createdAt: ['createdat','created','createddate','date','addedon','entrydate','timestamp','datetime','dateadded','createdon']
};

function doGet(e){ return handleRequest(e); }
function doPost(e){ return handleRequest(e); }

function json(o){
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function norm(s){ return String(s).toLowerCase().replace(/[^a-z0-9]/g,''); }

function getSheet(ss){
  if (SHEET_NAME) return ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  return ss.getSheets()[0];
}

// headers array -> { field: colIndex(0-based) or -1 }
function buildMap(headers){
  var nh = headers.map(norm);
  var map = {}, used = {};
  APP_FIELDS.forEach(function(f){
    map[f] = -1;
    if (MANUAL_MAP[f]){
      var mi = nh.indexOf(norm(MANUAL_MAP[f]));
      if (mi >= 0){ map[f] = mi; used[mi] = true; }
    }
  });
  APP_FIELDS.forEach(function(f){
    if (map[f] >= 0) return;
    var syns = SYNONYMS[f] || [];
    for (var i=0;i<nh.length;i++){
      if (used[i]) continue;
      if (syns.indexOf(nh[i]) >= 0){ map[f] = i; used[i] = true; break; }
    }
  });
  return map;
}

// Saare app fields ke columns ensure karo (missing ho to add). Returns map.
function ensureColumns(sheet){
  var lastCol = sheet.getLastColumn();
  var lastRow = sheet.getLastRow();
  var headers = (lastRow >= 1 && lastCol >= 1) ? sheet.getRange(1,1,1,lastCol).getValues()[0] : [];
  if (headers.join('') === ''){
    headers = APP_FIELDS.map(function(f){ return STD_HEADER[f]; });
    sheet.getRange(1,1,1,headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
  var map = buildMap(headers);
  var missing = APP_FIELDS.filter(function(f){ return map[f] < 0; });
  if (missing.length){
    var start = headers.length + 1;
    var add = missing.map(function(f){ return STD_HEADER[f]; });
    sheet.getRange(1, start, 1, add.length).setValues([add]);
    headers = headers.concat(add);
    map = buildMap(headers);
  }
  if (map.phone >= 0){
    sheet.getRange(2, map.phone+1, Math.max(sheet.getMaxRows()-1,1), 1).setNumberFormat('@');
  }
  return map;
}

function handleRequest(e){
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = getSheet(ss);
    var params = e.parameter || {};
    var postData = {};
    if (e.postData && e.postData.contents) postData = JSON.parse(e.postData.contents);
    var action = params.action || postData.action;

    if (action === 'getLeads'){
      var lr = sheet.getLastRow(), lc = sheet.getLastColumn();
      if (lr < 1 || lc < 1) return json({success:true, data:[]});
      var values = sheet.getRange(1,1,lr,lc).getValues();
      var map = buildMap(values[0]);
      var out = [ APP_FIELDS.map(function(f){ return STD_HEADER[f]; }) ];
      for (var r=1; r<values.length; r++){
        var row = values[r];
        out.push(APP_FIELDS.map(function(f){
          var ci = map[f];
          if (ci < 0 || ci >= row.length) return '';
          var v = row[ci];
          return (v instanceof Date) ? v.toISOString() : v;
        }));
      }
      return json({success:true, data: out});
    }

    if (action === 'addLead'){
      var map = ensureColumns(sheet);
      var data = postData.data || [];
      var width = sheet.getLastColumn();
      var newRow = [];
      for (var c=0;c<width;c++) newRow.push('');
      APP_FIELDS.forEach(function(f, idx){
        if (map[f] >= 0) newRow[map[f]] = (data[idx] != null ? data[idx] : '');
      });
      sheet.appendRow(newRow);
      return json({success:true});
    }

    if (action === 'updateLead'){
      var map = ensureColumns(sheet);
      var r = postData.rowIndex;
      if (!r || r < 2) return json({error:'Invalid rowIndex'});
      var data = postData.data || [];
      var width = sheet.getLastColumn();
      var row = sheet.getRange(r,1,1,width).getValues()[0];
      APP_FIELDS.forEach(function(f, idx){
        if (map[f] >= 0) row[map[f]] = (data[idx] != null ? data[idx] : '');
      });
      sheet.getRange(r,1,1,width).setValues([row]);
      return json({success:true});
    }

    if (action === 'deleteLead'){
      var dr = postData.rowIndex;
      if (!dr || dr < 2) return json({error:'Invalid rowIndex'});
      sheet.deleteRow(dr);
      return json({success:true});
    }

    if (action === 'initSheet'){
      ensureColumns(sheet);
      return json({success:true});
    }

    return json({error:'Unknown action: ' + action});
  } catch(err){
    return json({error: err.toString()});
  }
}
