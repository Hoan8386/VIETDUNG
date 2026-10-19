/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/record', 'N/search', 'N/url',
    '../lib/scv_lib_function.js', '../lib/scv_lib_cs.js', '../olib/alasql/alasql.min@1.7.3.js', '../lib/scv_lib_cs_xls.js'],
    /**
     * @param{currentRecord} currentRecord
     * @param{record} record
     * @param{search} search
     * @param{url} url
     */
    function(currentRecord, record, search, url, lbf, libCs, alasql, libCsXLS) {
        const CUR_SCRIPT = {
            ID: "customscript_scv_sl_bs2_rpt",
            DEPLOYID_UI: "customdeploy_scv_sl_bs2_rpt",
            DEPLOYID_DATA: "customdeploy_scv_sl_bs2_rpt_data"
        }
        const URL_DATA = "/app/site/hosting/scriptlet.nl?script=" + CUR_SCRIPT.ID + "&deploy=" + CUR_SCRIPT.DEPLOYID_DATA;
        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
        function pageInit(scriptContext) {

        }

        /**
         * Function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @since 2015.2
         */
        function fieldChanged(scriptContext) {

        }

        function onSearchResult(_isExport){
            window.onbeforeunload = null;
            var currRecord = currentRecord.get();
    
            var isValid = libCs.validateFieldMandatory(currRecord, ["custpage_subsidiary"]);
            if(!isValid) return;

            libCs.showLoadingDialog(true);

            asynSearchResult(_isExport);
        }

        const asynSearchResult = async (_isExport) => {
            var currRecord = currentRecord.get();

            var params = getObjParams(currRecord);

            if(_isExport != "T"){
                arrData.length = 0;
            }

            var arrSubsidiary = getDataSubsidiary(params);

            var arrActionFunc = [];
            var isError = false;
            
            arrActionFunc.push({action: "getDataColumnGrid", params: {...params}, data: []});
            arrActionFunc.push({action: "getListMaSo", params: {...params}, data: []});
            for(var i = 0; i < arrSubsidiary.length; i++){
                var objSubsidiary = arrSubsidiary[i];

                var objDataReqCur = {};
                objDataReqCur.subsidiary_id = objSubsidiary.id;
                objDataReqCur.custpage_todt = params.custpage_curtodt;

                arrActionFunc.push({action: "getDataDetailCons", params: objDataReqCur, isCurrent: "T", data: []});
                arrActionFunc.push({action: "getDataBSCT2Pay", params: objDataReqCur, isCurrent: "T", data: []});
                arrActionFunc.push({action: "getDataBSCT2Rec", params: objDataReqCur, isCurrent: "T", data: []});

                var objDataReqLast = {};
                objDataReqLast.subsidiary_id = objSubsidiary.id;
                objDataReqLast.custpage_todt = params.custpage_beftodt;

                arrActionFunc.push({action: "getDataDetailCons", params: objDataReqLast, isCurrent: "F", data: []});
                arrActionFunc.push({action: "getDataBSCT2Pay", params: objDataReqLast, isCurrent: "F", data: []});
                arrActionFunc.push({action: "getDataBSCT2Rec", params: objDataReqLast, isCurrent: "F", data: []});
            }
            
            libCsXLS.asyncPostMultiRequestByAjax(URL_DATA, arrActionFunc, function (_res){
                arrActionFunc = _res;

                var arrResult = getDataResultMapped(params, arrActionFunc, isError);
            
                if(_isExport == "T"){
                    onExportResult(currRecord, arrResult, arrActionFunc, arrSubsidiary, params);
                }else{
                    arrData = [...arrResult];
                    renderGridLogCall();
                }

                libCs.showLoadingDialog(false);
            },function(_res, _paramsCallback){
                
            },function(request, status, error){
                isError = true;
                console.log(paramsFunc.action);
                console.log(error)
            });
        }

        function getObjParams(currRecord) {
            return {
                custpage_subsidiary: currRecord.getValue('custpage_subsidiary'),
                custpage_curtodt: currRecord.getText('custpage_curtodt'),
                custpage_beftodt: currRecord.getText('custpage_beftodt')
            };
        }

        const getDataResultMapped = (_params, _arrActionFunc, _isError) => {
            if(_isError) {
                alert("error");
                return [];
            }
            
            var arrResultRaw = [];
            debugger
            var arrMaSo = _arrActionFunc.find(e => e.action == "getListMaSo").data;
            var arrDetailConsCur = [], arrDataBSCT2PayCur = [], arrDataBSCT2RecCur = [];
            var arrDetailConsBef = [], arrDataBSCT2PayBef = [], arrDataBSCT2RecBef = [];

            _arrActionFunc.filter(e => e.action == "getDataDetailCons" && e.isCurrent == "T").forEach(_objData => arrDetailConsCur = arrDetailConsCur.concat(_objData.data));
            _arrActionFunc.filter(e => e.action == "getDataBSCT2Pay" && e.isCurrent == "T").forEach(_objData => arrDataBSCT2PayCur = arrDataBSCT2PayCur.concat(_objData.data));
            _arrActionFunc.filter(e => e.action == "getDataBSCT2Rec" && e.isCurrent == "T").forEach(_objData => arrDataBSCT2RecCur = arrDataBSCT2RecCur.concat(_objData.data));

            _arrActionFunc.filter(e => e.action == "getDataDetailCons" && e.isCurrent == "F").forEach(_objData => arrDetailConsBef = arrDetailConsBef.concat(_objData.data));
            _arrActionFunc.filter(e => e.action == "getDataBSCT2Pay" && e.isCurrent == "F").forEach(_objData => arrDataBSCT2PayBef = arrDataBSCT2PayBef.concat(_objData.data));
            _arrActionFunc.filter(e => e.action == "getDataBSCT2Rec" && e.isCurrent == "F").forEach(_objData => arrDataBSCT2RecBef = arrDataBSCT2RecBef.concat(_objData.data));

            arrDetailConsCur = alasql(`SELECT chitieu, maso, SUM(amt) as amt FROM ? GROUP BY chitieu, maso`,[arrDetailConsCur]);
            arrDataBSCT2PayCur = alasql(`SELECT account, maso, maso2, SUM(amt) as amt FROM ? GROUP BY account, maso, maso2`,[arrDataBSCT2PayCur]);
            arrDataBSCT2RecCur = alasql(`SELECT account, maso, maso2, SUM(amt) as amt FROM ? GROUP BY account, maso, maso2`,[arrDataBSCT2RecCur]);

            arrDetailConsBef = alasql(`select chitieu, maso, SUM(amt) as amt FROM ? GROUP BY chitieu, maso`,[arrDetailConsBef]);
            arrDataBSCT2PayBef = alasql(`select account, maso, maso2, SUM(amt) as amt FROM ? GROUP BY account, maso, maso2`,[arrDataBSCT2PayBef]);
            arrDataBSCT2RecBef = alasql(`SELECT account, maso, maso2, SUM(amt) as amt FROM ? GROUP BY account, maso, maso2`,[arrDataBSCT2RecBef]);

            for(let i = 0; i < arrMaSo.length; i++){
                let idxDetailConsCur_find = arrDetailConsCur.findIndex(e => e.maso == arrMaSo[i].maso);
                if(idxDetailConsCur_find == -1){
                    arrDetailConsCur.push({
                        maso: arrMaSo[i].maso,
                        chitieu: arrMaSo[i].chitieu,
                        amt: 0
                    })
                }

                let idxDetailConsBef_find = arrDetailConsBef.findIndex(e => e.maso == arrMaSo[i].maso);
                if(idxDetailConsBef_find == -1){
                    arrDetailConsBef.push({
                        maso: arrMaSo[i].maso,
                        chitieu: arrMaSo[i].chitieu,
                        amt: 0
                    })
                }
            }

            for(var i = 0; i < arrDetailConsCur.length; i++){
                let objDetailCur = arrDetailConsCur[i];

                let objSumPay = alasql("SELECT SUM(amt) as amt FROM ? WHERE maso == '"+ objDetailCur.maso +"' OR maso2 == '" + objDetailCur.maso + "'", [arrDataBSCT2PayCur])[0];
                objDetailCur.totalPayCur = objSumPay.amt;

                let objSumRec = alasql("SELECT SUM(amt) as amt FROM ? WHERE maso == '"+ objDetailCur.maso +"' OR maso2 == '" + objDetailCur.maso + "'", [arrDataBSCT2RecCur])[0];
                objDetailCur.totalRecCur = objSumRec.amt;
            }

            for(var i = 0; i < arrDetailConsBef.length; i++){
                let objDetailBef = arrDetailConsBef[i];

                let objSumPay = alasql("SELECT SUM(amt) as amt FROM ? WHERE maso == '"+ objDetailBef.maso +"' OR maso2 == '" + objDetailBef.maso + "'", [arrDataBSCT2PayBef])[0];
                objDetailBef.totalPayBef = objSumPay.amt;

                let objSumRec = alasql("SELECT SUM(amt) as amt FROM ? WHERE maso == '"+ objDetailBef.maso +"' OR maso2 == '" + objDetailBef.maso + "'", [arrDataBSCT2RecBef])[0];
                objDetailBef.totalRecBef = objSumRec.amt;
            }
            
            for(var i = 0; i < arrMaSo.length; i++){
                let objResRaw = {
                    idx_num: i,
                    chitieu: arrMaSo[i].chitieu,
                    maso: arrMaSo[i].maso,
                    thuyetminh: "",
                    amt_cur: 0,
                    amt_bef: 0,
                    lv: arrMaSo[i].lv,
                    fomular: arrMaSo[i].fomular
                };
                var objCur = arrDetailConsCur.find(e => e.maso == objResRaw.maso);
                var objBef = arrDetailConsBef.find(e => e.maso == objResRaw.maso);
                if(lbf.isContainValue(objCur)){
                    objResRaw.amt_cur = (Number(objCur.amt) * arrMaSo[i].factor) - (objCur.totalPayCur) + objCur.totalRecCur;
                }
                if(lbf.isContainValue(objBef)){
                    objResRaw.amt_bef = Number(objBef.amt) * arrMaSo[i].factor - (objBef.totalPayBef) + objBef.totalRecBef;
                }
                arrResultRaw.push(objResRaw);
            }

            var arrLv_30 = arrResultRaw.filter(function(e) {
                return e.lv == 30;
            });
            var arrLv_20 = arrResultRaw.filter(function(e) {
                return e.lv == 20;
            });
            var arrLv_10 = arrResultRaw.filter(function(e) {
                return e.lv == 10;
            });
            var arrLv_5 = arrResultRaw.filter(function(e) {
                return e.lv == 5;
            });

            var arrResult = arrResultRaw.filter(function(e) {
                return e.lv == 0;
            });

            for(var i = 0; i < arrLv_30.length; i++){
                var objRes = {...arrLv_30[i]};

                if(!lbf.isContainValue(objRes.fomular)) continue;
                var children = objRes.fomular.split(",");

                var children = objRes.fomular.split(",");
                var amt_formula_cur = 0, amt_formula_bef = 0;
                for(var j = 0; j < children.length; j++){
                    var objChildren = arrResult.find(e => e.maso == children[j])
                    if(!!objChildren){
                        amt_formula_cur += objChildren.amt_cur;
                        amt_formula_bef += objChildren.amt_bef;
                    }
                }
                objRes.amt_cur = amt_formula_cur;
                objRes.amt_bef = amt_formula_bef;
                arrResult.push(objRes);
            }
            
            for(var i = 0; i < arrLv_20.length; i++){
                var objRes = {...arrLv_20[i]};

                if(!lbf.isContainValue(objRes.fomular)) continue;
                var children = objRes.fomular.split(",");

                var children = objRes.fomular.split(",");
                var amt_formula_cur = 0, amt_formula_bef = 0;
                for(var j = 0; j < children.length; j++){
                    var objChildren = arrResult.find(e => e.maso == children[j])
                    if(!!objChildren){
                        amt_formula_cur += objChildren.amt_cur;
                        amt_formula_bef += objChildren.amt_bef;
                    }
                }
                objRes.amt_cur = amt_formula_cur;
                objRes.amt_bef = amt_formula_bef;
                arrResult.push(objRes);
            }

            for(var i = 0; i < arrLv_10.length; i++){
                var objRes = {...arrLv_10[i]};

                if(!lbf.isContainValue(objRes.fomular)) continue;
                var children = objRes.fomular.split(",");

                var children = objRes.fomular.split(",");
                var amt_formula_cur = 0, amt_formula_bef = 0;
                for(var j = 0; j < children.length; j++){
                    var objChildren = arrResult.find(e => e.maso == children[j])
                    if(!!objChildren){
                        amt_formula_cur += objChildren.amt_cur;
                        amt_formula_bef += objChildren.amt_bef;
                    }
                }
                objRes.amt_cur = amt_formula_cur;
                objRes.amt_bef = amt_formula_bef;
                arrResult.push(objRes);
            }

            for(var i = 0; i < arrLv_5.length; i++){
                var objRes = {...arrLv_5[i]};

                if(!lbf.isContainValue(objRes.fomular)) continue;
                var children = objRes.fomular.split(",");

                var children = objRes.fomular.split(",");
                var amt_formula_cur = 0, amt_formula_bef = 0;
                for(var j = 0; j < children.length; j++){
                    var objChildren = arrResult.find(e => e.maso == children[j])
                    if(!!objChildren){
                        amt_formula_cur += objChildren.amt_cur;
                        amt_formula_bef += objChildren.amt_bef;
                    }
                }
                objRes.amt_cur = amt_formula_cur;
                objRes.amt_bef = amt_formula_bef;
                arrResult.push(objRes);
            }

            arrResult = alasql(`SELECT * FROM ? ORDER BY idx_num`, [arrResult])

            opGrid.columns = _arrActionFunc.find(e => e.action == "getDataColumnGrid").data;

            return arrResult;
        }

        const onExportResult = async (_curRec, _arrResult, _arrActionFunc, _arrSubsidiary, _params) => {
            try{

                var columnGrid = _arrActionFunc.find(e => e.action == "getDataColumnGrid").data;
                var objColumnCur = columnGrid[3];
                var objColumnBef = columnGrid[4];

                var objSubsidiary = _arrSubsidiary.length > 0 ? _arrSubsidiary[0] : {};
                var curtodt = _curRec.getValue("custpage_curtodt");
                var curtodt_header = "ngày "+curtodt.getDate()+" tháng "+(curtodt.getMonth()+1)+" năm "+curtodt.getFullYear();

                var objTemplateExport = getTemplateExcel(_params);
                var fileName = objTemplateExport.name;
                var content = objTemplateExport.contents;

                content = content.replace(/{pSubsidiary}/gi,  objSubsidiary.legalname);
                content = content.replace(/{pAddress}/gi,  objSubsidiary.address);
                content = content.replace(/{pCurTodate}/gi,  curtodt_header);
                content = content.replace(/{pCurrentDate}/gi,  objColumnCur.caption);
                content = content.replace(/{pSetLastDate}/gi,  objColumnBef.caption);

                for(var idx_maso = 0; idx_maso < _arrResult.length; idx_maso++){
                    let objRes = _arrResult[idx_maso];

                    content = content.replace( "{pCur_" + objRes.maso + "}", Number(objRes.amt_cur));
                    content = content.replace( "{pBef_" + objRes.maso + "}", Number(objRes.amt_bef));
                }

                saveAs(new File([content], fileName + ".xls", {type: "text/xml;charset=utf-8"}));
            }catch(err){
                alert(err)
            }
        }

        function getTemplateExcel(_params){
            var params = {..._params};
            params.action = "getTemplateExcel";

            libCs.updateProgessStatus("getTemplateExcel: Processing");

            let objRes = libCsXLS.nonAsyncPostDataByAjax(URL_DATA, params, function(_res){
                libCs.updateProgessStatus("getTemplateExcel: Completed");
            });

            return objRes.data;
        }

        const getDataSubsidiary = (_params) => {
            var objDataReq = {..._params};
            objDataReq.action = "getDataSubsidiary";
            objDataReq.custpage_subsidiary = _params.custpage_subsidiary.join(",")

            libCs.updateProgessStatus("getDataSubsidiary: Processing");

            let objRes = libCsXLS.nonAsyncPostDataByAjax(URL_DATA, objDataReq, function(_res){
                libCs.updateProgessStatus("getDataSubsidiary: Completed");
            });

            return objRes.data;
        }

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            onSearchResult: onSearchResult
        };

    });
