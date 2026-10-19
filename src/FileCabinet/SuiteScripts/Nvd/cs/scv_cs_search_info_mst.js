/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */

var url, currRec, record, https, bootstrap;

define(["N/url", "N/currentRecord", "N/record", "N/https", "../olib/bootstrap.bundle.min"], main);

function main(_url, _currentRecord, _record, _https, _bootstrap) {
    url = _url;
    https = _https;
    currRec = _currentRecord;
    record = _record;
    bootstrap = _bootstrap;

    return {
        pageInit,
        fieldChanged,
    }
}

const pageInit = scriptContext => {
    let currentRecord = scriptContext.currentRecord;
    let typeRecord = currentRecord.type;
    const listRecordAddFuncSearchMST = [
        record.Type.CUSTOMER,
        record.Type.LEAD,
        record.Type.VENDOR,
        record.Type.INVOICE,
        record.Type.PROSPECT
    ];
    try {
        let taxId = "#custentity_scv_tax_number_fs";
        (typeRecord === record.Type.INVOICE) ? taxId = "#custbody_scv_invoice_entity_taxid_fs" : ""
        if (listRecordAddFuncSearchMST.includes(typeRecord)) {
            addTagLink("https://cdn.jsdelivr.net/npm/bootstrap-icons@1.5.0/font/bootstrap-icons.css", "head");
            addButtonSearch(taxId)
            let content = addContent();
            addInlineHtml(content);
        }
    } catch (err) {
        console.log(JSON.stringify(err));
        log.error("err", err);
    }

    function addButtonSearch(idTaxId) {
        let iconSearch = document.createElement("button");
        iconSearch.setAttribute("type", "button");
        iconSearch.setAttribute("class", "btn btn-primary btn-light");
        iconSearch.setAttribute("onclick", "searchMaSoThue()"); // get info value TaxId
        let spanSearch = document.createElement("span");
        spanSearch.setAttribute("class", "bi-search");
        iconSearch.append(spanSearch);
        let taxId = document.querySelector(idTaxId);
        taxId.append(iconSearch);
    }
}

const fieldChanged = scriptContext => {
    try {
        fnUpdValueTaxNumField(scriptContext);
    } catch (err) {
        console.log(err.toString());
        log.error(err)
    }
}

function fnUpdValueTaxNumField(scriptContext) {
    let curRec = scriptContext.currentRecord;
    const recType = curRec.type;
    const arrApplyToRecord = [record.Type.CUSTOMER, record.Type.LEAD, record.Type.VENDOR, record.Type.INVOICE, record.Type.PROSPECT];
    if (!arrApplyToRecord.includes(recType)) return;
    let fieldId = scriptContext.fieldId;
    if (['custentity_scv_tax_number', 'custbody_scv_invoice_entity_taxid'].indexOf(fieldId) === -1) return;
    const taxIdNum = curRec.getValue(fieldId);
    document.querySelector(`#${fieldId}_fs`).setAttribute("value", taxIdNum);
}


const addContent = () => ` 
    let curRec = currRec.get();
    let taxId = currRec.type === record.Type.INVOICE ? '#custbody_scv_invoice_entity_taxid_fs' : '#custentity_scv_tax_number_fs';
    let strDom = document.querySelector(taxId);
    if (strDom.length !== 0) {strDom.append()};
    function searchMaSoThue() {
        let value = document.querySelector(taxId)?.attributes?.value?.value; 
        let strAlert = value || "Vui lòng nhập thông tin mã số thuế để tra cứu."; 
        if (!!value) {
        	let objInfoCom = queryMaSoThue(value);
        	if (!objInfoCom.isSuccess) {
        	    return;
        	};
            machines.addressbook.clearmachine();
        	if (curRec.type === record.Type.INVOICE) {
        	    curRec.setValue('custbody_scv_invoice_entity_legalname', objInfoCom.tencongty);
        	    curRec.setValue('custbody_scv_invoice_entity_address', objInfoCom.diachi);
        	} else {
        	     try {
                    curRec.setValue('custentity_scv_legal_name', objInfoCom.tencongty);
                    curRec.setValue('companyname', objInfoCom.tencongty);
                    // curRec.setValue('addrtext', objInfoCom.diachi);
                    // curRec.setValue('phone', objInfoCom.dienthoai);
                    curRec.setValue('custentity_scv_nguoidd', objInfoCom.nguoidd);
                    let sl = "addressbook";
                    let lc = curRec.getLineCount(sl);
                    let isRunSetValue = true;
                    for ( let i = 0; i < lc; i++ ) {
                        curRec.selectLine({sublistId: sl, line : i});
                        let diaChi = curRec.getCurrentSublistValue({ sublistId: "addressbook", fieldId: "label"});
                        (diaChi === objInfoCom.diachi) ? isRunSetValue = false : "";
                        curRec.commitLine({sublistId: sl})
                    }
                    
                    if (isRunSetValue) {
                        curRec.selectNewLine(sl);
                        curRec.setCurrentSublistValue({sublistId: 'addressbook', fieldId: 'label', value: objInfoCom.diachi});
                        let subRec = curRec.getCurrentSublistSubrecord({ sublistId: "addressbook", fieldId: "addressbookaddress"});
                        subRec.setValue({fieldId: 'addr1', value: objInfoCom.diachi});
                        curRec.commitLine({sublistId: 'addressbook'});
                    }
                } catch(e) {
                    console.error(e);
                    alert(e.name + ':' +e.message);
                }
                
        	}
        } else {
            alert(strAlert);
        }
    }; 
    
    function queryMaSoThue(tax_number) {
        const urlFirst = 'https://thongtindoanhnghiep.co/api/company/' + tax_number;
        const urlSecond = 'https://api.vietqr.io/v2/business/' + tax_number;
        let objResult = {tencongty: '', diachi : '', dienthoai: '', nguoidd : '', isSuccess : false};
    	let resFirst = callApiGet(urlFirst, {'Accept': '*/*'});
        const objBodyFirst = JSON.parse(resFirst?.body);
        if (resFirst.code == 200 && objBodyFirst?.ID != 0) {
            objResult.tencongty = objBodyFirst.Title;
            objResult.diachi = objBodyFirst.DiaChiCongTy;
            objResult.dienthoai = objBodyFirst.NoiDangKyQuanLy_DienThoai;
            objResult.nguoidd = objBodyFirst.ChuSoHuu || '';
            objResult.isSuccess = true;
        } 
        else {
    	    let resSecond = callApiGet(urlSecond, {'Accept': '*/*'});
    	    console.log(resSecond);
            const objBodySecond = JSON.parse(resSecond?.body);
            if (resSecond.code == 200) {
                objResult.tencongty = objBodySecond.data.name;
                objResult.diachi = objBodySecond.data.address;
                objResult.isSuccess = true;
            }
        }
    	return objResult;
    }
   
   
    function callApiPost(urlapi, headers, strbody) {
    	let response = https.post({
            url: urlapi,
            body: strbody,
            headers: headers
        });
    	return response;
    }
    
    function callApiGet(urlapi, headers) {
    	let response = https.get({
            url: urlapi,
            headers: headers
        });
    	return response;
    }
`;

const addTagLink = (jsName, pos) => {
    let tag = document.getElementsByTagName(pos)[0];
    let addScript = document.createElement('link');
    addScript.setAttribute('rel', 'stylesheet');
    addScript.setAttribute('href', jsName);
    tag.appendChild(addScript);
}

const addInlineHtml = (content) => {
    let tag = document.getElementsByTagName("head")[0];
    let s = document.createElement('script');
    s.type = 'text/javascript';
    let code = content || 'alert("Not Input Content!");';
    try {
        s.appendChild(document.createTextNode(code));
        document.body.appendChild(s);
    } catch (e) {
        s.text = code;
        document.body.appendChild(s);
    }
    tag.appendChild(s);
}