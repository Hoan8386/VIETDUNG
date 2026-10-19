/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  31 Dec 2024         Huy Pham			    Init, create file, Production Planning, from mr.Bính(https://app.clickup.com/t/86cxfpxbb)
 *  13 Jan 2025         Huy Pham                Bổ sung sửa Priority, from mr.Bính(https://app.clickup.com/t/86cxfpxbb?comment=90160085271329)
 *  17 Jan 2025         Huy Pham                Bổ sung biểu đồ cho Schedule, from mr.Bính
 *  17 Feb 2025         Huy Pham                Bổ sung chức năng, from mr.Việt (https://app.clickup.com/t/86cxfpxbb?comment=90160092412974)
 *  28 May 2025         Huy Pham			    Điều chỉnh/bổ sung, from mr.Trương Phúc(https://app.clickup.com/t/86cxfpxbb?comment=90160112390437)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */ 
define(['N/url', 'N/search',
    '../lib/scv_lib_cs_xls.js', '../olib/alasql/alasql.min@1.7.3',

    '../cons/scv_cons_record.js',
    '../cons/scv_cons_datastore.js',
    '../cons/scv_cons_format.js',
    
    '../cons/scv_cons_location.js',
    '../cons/scv_cons_entitygroup.js',
    '../cons/scv_cons_locationtype.js',
],

function(url, search,
    libCsXLS, alasql,

    constRecord,
    constDataStore,
    constFormat,

    constLocation,
    constEntityGroup,
    constLocationType
) {
    const COLOR_PROCESS = ["#98FB98", "#FFA07A", "#87CEEB", "#FFA500", "#F0E68C", "#3E75F7", "#B945F7"];
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
        let curRec = scriptContext.currentRecord;

        constRecord.setCurrentRecord(curRec);

        syncDataProcess(curRec);

        constRecord.initQuickFindFieldSelect(curRec, "custpage_location", {
            data: curRec.getField("custpage_location").getSelectOptions(),
            valueExpr: "value",
            displayExpr: "text",
            reInsertOption: false
        }, false);

        _scvForm.showLoadingDialog(true);
        setTimeout(() => {
            initDataGantt();
            _scvForm.showLoadingDialog(false);
        }, 100);
    }

    const syncDataProcess = (_curRec) => {
        let woScheduleSublistId = "custpage_sl_woschedule";

        let sizeWOSchedule = _curRec.getLineCount(woScheduleSublistId);

        let arrResult = [];

        for(let i = 0; i < sizeWOSchedule; i++){
            let objRes = {};
            objRes.line = i;
            objRes.sublistId = woScheduleSublistId;
            objRes.custpage_col_idxprocess = _curRec.getSublistValue(woScheduleSublistId, "custpage_col_idxprocess", i);
            objRes.custpage_col_tksx = _curRec.getSublistValue(woScheduleSublistId, "custpage_col_tksx", i);
            
            arrResult.push(objRes);

            let col_chk = _curRec.getSublistValue(woScheduleSublistId, "custpage_col_chk", i);

            storeLineSelected(objRes.sublistId, objRes.line, col_chk);
        }
        debugger
        constDataStore.setDataStore("arrDataOfSublist", arrResult);

        //setTimeout(setColorDefaultProcess(), 0);
    }

    const setColorDefaultProcess = () =>{
        let arrDataOfSublist = constDataStore.getDataStore("arrDataOfSublist");
        let arrProcess = alasql(`SELECT DISTINCT custpage_col_idxprocess FROM ?`, [arrDataOfSublist])

        let idxColor = 0;
        for(let i = 0; i < arrProcess.length; i++){
            let arrDataOfSublist_filter = arrDataOfSublist.filter(e => e.custpage_col_idxprocess == arrProcess[i].custpage_col_idxprocess);
            let codeColor = COLOR_PROCESS[idxColor];

            for(let j = 0; j < arrDataOfSublist_filter.length; j++){
                let objDataLine = arrDataOfSublist_filter[j];

                let columnFirst = jQuery(`#${objDataLine.sublistId}row${objDataLine.line} td`)[0];

                if(!objDataLine.custpage_col_idxprocess){
                    columnFirst.style = `border-radius: 10px; text-align: center`;
                    continue;
                }
                
                columnFirst.style = `background-color: ${codeColor} !important; border-radius: 10px`;
            }

            idxColor++;
            if(idxColor ==  COLOR_PROCESS.length){
                idxColor = 0;
            }
        }
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
        let curRec = scriptContext.currentRecord;
        let sublistId = scriptContext.sublistId;
        let fieldId = scriptContext.fieldId;
        let line = scriptContext.line;
        
        switch(fieldId){
            case "custpage_subsidiary":
                setTimeout(() => loadFieldDataLocation(curRec), 0);
            break;
            case "custpage_location":
                setTimeout(() => loadFieldDataWorkCenter(curRec), 0);
            break;
            case "custpage_col_chk":
                let col_chk = curRec.getCurrentSublistValue(sublistId, fieldId);
                
                storeLineSelected(sublistId, line, col_chk);

                //let idxProcess = curRec.getCurrentSublistValue(sublistId, "custpage_col_idxprocess");
                let tksx = curRec.getSublistValue(sublistId, "custpage_col_tksx", line);
                
                let arrDataOfSublist = constDataStore.getDataStore("arrDataOfSublist");
                let arrLineOther = arrDataOfSublist.filter(e => e.sublistId == sublistId
                    && e.custpage_col_tksx == tksx
                    && e.line != line
                );
                arrLineOther.forEach(objLineOther => {
                    curRec.selectLine(sublistId, objLineOther.line);
                    curRec.setCurrentSublistValue({
                        sublistId: sublistId, fieldId: "custpage_col_chk", 
                        value: col_chk, ignoreFieldChange: true
                    });
                    curRec.commitLine(sublistId);

                    storeLineSelected(sublistId, objLineOther.line, col_chk);
                })
            break;
        }

    }

    const storeLineSelected = (_sublistId, _line, _isChecked) =>{
        let arrLineSelected = constDataStore.getDataStore("arrLineSelected") || [];

        let idxLineSelected = arrLineSelected.findIndex(e => e.sublistId == _sublistId && e.line == _line);
        if(_isChecked){
            if(idxLineSelected == -1){
                arrLineSelected.push({
                    sublistId: _sublistId,
                    line: _line
                });
            }
        }
        else{
            if(idxLineSelected > -1){
                arrLineSelected.splice(idxLineSelected, 1);
            }
        }

        constDataStore.setDataStore("arrLineSelected", arrLineSelected);
    }

    const loadFieldDataLocation = (_curRec) => {
        let subsidiaryId = _curRec.getValue("custpage_subsidiary");

        let arrResult = [];

        if(!!subsidiaryId){
            arrResult = constLocation.getDataSource([
                search.createFilter({
                    name: 'subsidiary',
                    operator: "anyof",
                    values: subsidiaryId
                }),
                search.createFilter({
                    name: 'custrecord_scv_loc_type',
                    operator: "anyof",
                    values: constLocationType.RECORDS.SANXUAT.ID
                }),
            ]);
        }

        constRecord.initQuickFindFieldSelect(_curRec, "custpage_location", {
            data: arrResult,
            valueExpr: "internalid",
            displayExpr: "name",
            reInsertOption: true
        }, false);
    }

    const loadFieldDataWorkCenter = (_field) => {
        let curRec = constRecord.getCurrentRecord();

        let locationId = curRec.getValue("custpage_location");

        let arrResult = [];

        if(!!locationId){
            arrResult = constEntityGroup.getDataSource(
                search.createFilter({
                    name: 'custentity_mfgmob_wclocation',
                    operator: "anyof",
                    values: locationId
                })
            );
        }

        constRecord.initQuickFindFieldSelect(curRec, "custpage_workcenter", {
            data: arrResult,
            valueExpr: "internalid",
            displayExpr: "groupname",
            reInsertOption: true
        }, false);
    }

    /**
     * Validation function to be executed when record is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid
     *
     * @since 2015.2
     */
    function saveRecord(scriptContext) {
        let curRec = scriptContext.currentRecord;

        let arrResultWOSchedule = getDataOfSublist(curRec, "custpage_sl_woschedule");
        if(arrResultWOSchedule.length == 0){
            _scvForm.showMsgError("Please select at least one line in the Work Order Schedule");
            return false;
        }

        return confirm("Are you sure you want to update?");
    }

    const onSearchResult = () =>{
        window.onbeforeunload = null;

        let isValid = _scvForm.validateFieldMandatory([
            "custpage_subsidiary", "custpage_location", "custpage_workcenter"
        ]);
        if(!isValid) return;

        let params = _scvForm.getParameter();

        let urlScript = url.resolveScript({
            scriptId: 'customscript_scv_sl_prod_plan',
            deploymentId: 'customdeploy_scv_sl_prod_plan',
            params: params
        });

        urlScript += "&isSearch=T";

        window.location.replace(urlScript);
    }

    const openStatusQueue = (_urlPopup, _width, _height, _title) =>{
        nlExtOpenWindow(_urlPopup, 'popupStatusQueue', _width, _height, this, true, _title);
    }

    const markAllOfSublist = (_sublistId, _isMark) =>{
        let curRec = _scvForm.currentRecord;
        let sizeSublist = curRec.getLineCount(_sublistId);
        let isMarkAll = _isMark == "T" ? true : false;
        
        for(let i = 1; i <= sizeSublist; i++){
            nlapiSelectLineItem(_sublistId,i)
            nlapiSetCurrentLineItemValue(_sublistId, "custpage_col_chk", isMarkAll, true, false)
            nlapiCommitLineItem(_sublistId)
        }
    }

    const onCalculate = () => {
        window.onbeforeunload = null;
        
        let curRec = _scvForm.currentRecord;

        _scvForm.showLoadingDialog(true);

        let params = _scvForm.getParameter();

        let arrResultWOSchedule = getDataOfSublist(curRec, "custpage_sl_woschedule");
        let arrResultWOLatest = getDataOfSublist(curRec, "custpage_sl_wolatest");
        let arrResultWOCMaintenance = getDataOfSublist(curRec, "custpage_sl_wocmaintenance");

        arrResultWOSchedule = alasql(`SELECT *
            FROM ?
            ORDER BY custpage_col_workcenter ASC,
                    custpage_col_priority::NUMBER ASC,
                    custpage_col_tksx ASC,
                    custpage_col_prodlotno ASC
            `, [arrResultWOSchedule])
            
        let objReqBody = {
            params: {...params},
            custpage_sl_woschedule: arrResultWOSchedule,
            custpage_sl_wolatest: arrResultWOLatest,
            custpage_sl_wocmaintenance: arrResultWOCMaintenance
        };

        _scvForm.ajax.postAsync(_scvForm.serviceScript.url, {
            action: "calculateProductionShedule", 
            body: JSON.stringify(objReqBody)
        }, function(_res, _paramsCallback){
            let objRes = _res.data;
            
            if(objRes.custpage_sl_woschedule.length > 0){
                updateLineSublistSchedule(curRec, objRes.custpage_sl_woschedule);
            }
            updateToGantt();

            _scvForm.showLoadingDialog(false);
            
        },function(request, status, error, _paramsCallback){
            _scvForm.showMsgError(error.message||status);
            _scvForm.showLoadingDialog(false);
        });
    }


    const updateLineSublistSchedule = (_curRec, _arrData) => {
        let sublistId = "custpage_sl_woschedule";

        for(let i = 0; i < _arrData.length; i++){
            let objLine = _arrData[i];

            _curRec.selectLine(sublistId, objLine.line)

            _curRec.setCurrentSublistValue(sublistId, "custpage_col_prodstartdt", nlapiStringToDate(objLine.custpage_col_prodstartdt, 'datetimetz'));
            _curRec.setCurrentSublistValue(sublistId, "custpage_col_prodenddt", nlapiStringToDate(objLine.custpage_col_prodenddt, 'datetimetz'));

            _curRec.commitLine(sublistId);
        }
    }

    const getDataOfSublist = (_curRec, _sublistId) => {
        let fields = _curRec.getValue(_sublistId + "fields");
        let arrFields = !!fields ? fields.split("\x01") : [];
        
        let sizeSublist = _curRec.getLineCount(_sublistId);

        let arrResult = [];

        for(let i = 0; i < sizeSublist; i++){
            let objRes = {
                line: i
            };

            if(_sublistId == "custpage_sl_woschedule"){
                let chk = _curRec.getSublistValue(_sublistId, "custpage_col_chk", i);
                if(!chk) continue;
            }

            for(let j = 0; j < arrFields.length; j++){
                let fieldId = arrFields[j];

                objRes[fieldId] = _curRec.getSublistValue(_sublistId, fieldId, i);
            }

            arrResult.push(objRes);
        }

        return arrResult;
    }

    window.l_sort = () =>{
        return;
    }

    const refreshGantt = () =>{
        if(sCurrentlySelectedTab == "tab_schedulechart"){
            jqxGantt("#scvGantt").refresh()
        }
        else{
            setTimeout(() => refreshGantt(), 100);
        }
    }

    const initDataGantt = () =>{
        jqxGantt("#scvGantt", {
            source: [],
            taskColumns: [
                {
                    label: 'Name',
                    value: 'label',
                    size: '40%'
                },
                {
                    label: 'From',
                    value: 'dateStart',
                    size: '30%',
                    formatFunction: function (e) {
                        return nlapiDateToString(e) + ` ${e.getHours().toString().padStart(2,'0')}:${e.getMinutes().toString().padStart(2,'0')}`;
                    }
                },
                {
                    label: 'To',
                    value: 'dateEnd',
                    size: '30%',
                    formatFunction: function (e) {
                        return nlapiDateToString(e) + ` ${e.getHours().toString().padStart(2,'0')}:${e.getMinutes().toString().padStart(2,'0')}`;
                    }
                }
            ],
            columnResize: false,
            treeMin: '30%',
            resourcePanelSize: '30%',
            resourceTimelineMode: 'histogram',
            view: 'week',
            timelineHeaderFormatFunction: function (date, type, isHeaderDetailsContainer) {
                const that = document.querySelector('jqx-gantt-chart');
                if (isHeaderDetailsContainer) {
                    return date.toLocaleDateString('en', { month: 'long', year: 'numeric' });
                }
                else {
                    return date.toLocaleDateString('en', { day: 'numeric', weekday: 'short' });
                }
            },
            hideResourcePanel: true,
            disableTaskDrag: true,
            disableWindowEditor: false
        });

        jqxGantt("#scvGantt").refresh();

        updateToGantt();
    }

    const initDataChart = (_arrResultWOSchedule) =>{
        let arrRawData = [];
        for(let i = 0; i < _arrResultWOSchedule.length; i++){
            let objResWOSchedule = _arrResultWOSchedule[i];

            if(!objResWOSchedule.custpage_col_prodstartdt) continue;

            let objResRaw = {};
            objResRaw.workDate = nlapiDateToString(objResWOSchedule.custpage_col_prodstartdt);
            objResRaw.workCenter = objResWOSchedule.custpage_col_workcenter;
            objResRaw.workCenter_display = objResWOSchedule.custpage_col_workcenter_display;
            objResRaw.workHours = objResWOSchedule.custpage_col_estcomtime;
            objResRaw.maxHours = 10;
            objResRaw.workDate_yyyymmdd = constFormat.dateTimeToChar(objResWOSchedule.custpage_col_prodstartdt, "YYYYMMDD");
            objResRaw.quantity = objResWOSchedule.custpage_col_qty * 1;

            arrRawData.push(objResRaw);
        }

        let arrWorkCenterGroup = alasql(`SELECT DISTINCT workDate, workDate_yyyymmdd, workCenter, workCenter_display FROM ?`, [arrRawData]);
        let arrWorkDateGroup = alasql(`SELECT DISTINCT workDate, workDate_yyyymmdd FROM ? ORDER BY workDate_yyyymmdd`, [arrWorkCenterGroup]);
        let arrResult = [];
        let arrColumnSeries = [], arrLineSeries = [];

        for(let i = 0; i < arrWorkDateGroup.length; i++){
            let objWorkDateGroup = arrWorkDateGroup[i];

            let arrWorkCenterGroup_filter = arrWorkCenterGroup.filter(e => e.workDate == objWorkDateGroup.workDate);
            for(let j = 0; j < arrWorkCenterGroup_filter.length; j++){
                let objWorkCenterGroup = arrWorkCenterGroup_filter[j];

                let arrRawData_filter = arrRawData.filter(e => e.workDate == objWorkDateGroup.workDate && e.workCenter == objWorkCenterGroup.workCenter);

                let objRes = {
                    workDate: objWorkDateGroup.workDate,
                };

                objRes[`workHours_${objWorkCenterGroup.workCenter}`] = 0;
                objRes[`quantity_${objWorkCenterGroup.workCenter}`] = 0;

                for(let k = 0; k < arrRawData_filter.length; k++){
                    let objRawData = arrRawData_filter[k];

                    objRes[`workCenter_${objWorkCenterGroup.workCenter}`] = objRawData.workCenter;
                    objRes[`workHours_${objWorkCenterGroup.workCenter}`] += objRawData.workHours * 1;
                    objRes[`maxHours_${objWorkCenterGroup.workCenter}`] = objRawData.maxHours;
                    objRes[`quantity_${objWorkCenterGroup.workCenter}`] += objRawData.quantity * 1;
                }

                arrResult.push(objRes);

                let idxColumnSeries = arrColumnSeries.findIndex(e => e.dataField == `workHours_${objWorkCenterGroup.workCenter}`);
                if(idxColumnSeries == -1){
                    arrColumnSeries.push({
                        dataField: 'workHours_'+ objWorkCenterGroup.workCenter, displayText: objWorkCenterGroup.workCenter_display + "(Hours)"
                    });
                }
                let idxLineSeries = arrLineSeries.findIndex(e => e.dataField == `quantity_${objWorkCenterGroup.workCenter}`);
                if(idxLineSeries == -1){
                    arrLineSeries.push({
                        dataField: 'quantity_'+ objWorkCenterGroup.workCenter, displayText: objWorkCenterGroup.workCenter_display + "(Quantity)",
                    });
                }
            }
        }
        
        let dataAdapter = new jQuery.jqx.dataAdapter({
            datatype: "array",
            localdata: arrResult
        });

        let settings = {
            title: "Production Schedule",
            description: "",
            showLegend: true,
            enableAnimations: true,
            padding: { left: 5, top: 5, right: 5, bottom: 5 },
            titlePadding: { left: 90, top: 0, right: 0, bottom: 10 },
            source: dataAdapter,
            xAxis: {
                dataField: 'workDate',
                gridLines: { visible: false },
                valuesOnTicks: false
            },
            columnSeriesOverlap: false,
            seriesGroups: [
                {
                    type: 'column',
                    valueAxis:
                    {
                        visible: true,
                        unitInterval: 24,
                        title: { text: 'Est.Com.Time (Hrs)' }
                    },
                    series: arrColumnSeries
                },
                {
                    type: 'line',
                    valueAxis:
                    {
                        visible: true,
                        position: 'right',
                        //unitInterval: 24,
                        title: { text: 'Quantity' },
                        gridLines: { visible: false },
                    },
                    series: arrLineSeries
                }
            ]
        };

        jQuery('#scvChart').jqxChart(settings);
    }

    const updateToGantt = () =>{
        let curRec = _scvForm.currentRecord;

        let arrResultWOSchedule = getDataOfSublist(curRec, "custpage_sl_woschedule");
        arrResultWOSchedule = alasql(`SELECT *
            FROM ?
            ORDER BY custpage_col_workcenter ASC,
                    custpage_col_priority::NUMBER ASC,
                    custpage_col_tksx ASC,
                    custpage_col_prodlotno ASC
            `, [arrResultWOSchedule])
        setTimeout(() => initDataChart(arrResultWOSchedule), 0);

        let arrResParent = alasql(`SELECT DISTINCT custpage_col_idxprocess FROM ?`, [arrResultWOSchedule]);
        
        let arrResult = [];

        for(let i = 0; i < arrResParent.length; i++){
            let objResParent = arrResParent[i];

            let objRes = {
                label: objResParent.custpage_col_idxprocess,
                custpage_col_idxprocess: objResParent.custpage_col_idxprocess,
                synchronized: true,
                expanded: true,
                disableResources: true,
                tasks: []
            };

            let arrDetail = arrResultWOSchedule.filter(e => e.custpage_col_idxprocess == objResParent.custpage_col_idxprocess);
            if(arrDetail.length > 0){
                objRes.label = arrDetail[0].custpage_col_workcenter_display;
            }
            
            for(let j = 0; j < arrDetail.length; j++){
                let objDetail = arrDetail[j];
                if(!objDetail.custpage_col_prodstartdt || !objDetail.custpage_col_prodenddt) continue;
                
                let objResTask = {
                    label: objDetail.custpage_col_wo,
                    dateStart: objDetail.custpage_col_prodstartdt,
                    dateEnd: objDetail.custpage_col_prodenddt,
                    custpage_col_idxprocess: objResParent.custpage_col_idxprocess,
                    custpage_col_wo_id: objDetail.custpage_col_wo_id,
                    lineSublist: objDetail.line
                };

                objRes.tasks.push(objResTask);
            }

            arrResult.push(objRes);
        }
        jqxGantt("#scvGantt").source = arrResult;

        jqxGantt("#scvGantt").refresh();

        refreshGantt();
    }

    const updateFromGantt = () =>{
        let curRec = _scvForm.currentRecord;
        
        let arrResult = jqxGantt("#scvGantt").source||[];

        let arrLineUpdate = [];

        for(let i = 0; i < arrResult.length; i++){
            let objRes = arrResult[i];

            let arrTask = objRes.tasks;

            for(let j = 0; j < arrTask.length; j++){
                let objTask = arrTask[j];

                arrLineUpdate.push({
                    line: objTask.lineSublist,
                    custpage_col_prodstartdt: nlapiDateToString(objTask.dateStart, "datetimetz"),
                    custpage_col_prodenddt: nlapiDateToString(objTask.dateEnd, "datetimetz"),
                });
            }
        }

        updateLineSublistSchedule(curRec, arrLineUpdate);
    }

    const onExportResult = async () =>{
        let curRec = _scvForm.currentRecord;
    
        let workbook = new ExcelJS.Workbook();

        let arrSublistId = [
            { id: "custpage_sl_woschedule", label: "WO for Scheduling"},
            { id: "custpage_sl_wolatest", label: "Latest WO Prod. Date"},
            { id: "custpage_sl_wocmaintenance", label: "WOC Maintenance"}
        ];

        let arrColumnHide = ["custpage_col_idxprocess", "custpage_col_wo_id", "custpage_col_workcenter_display"];

        arrSublistId.forEach(objSublist => {
            let sheet = workbook.addWorksheet(objSublist.label);

            let fields = curRec.getValue(objSublist.id + "fields");
            let arrFields = !!fields ? fields.split("\x01") : [];

            let labels = curRec.getValue(objSublist.id + "labels");
            let arrLabels = !!labels ? labels.split("\x01") : [];

            let arrColumnsXls = [];
            for(let i = 0; i < arrFields.length; i++){
                if(arrColumnHide.includes(arrFields[i])) continue;

                arrColumnsXls.push({
                    header: arrLabels[i] || arrFields[i],
                    key: arrFields[i],
                    width: 20
                })
            }
            sheet.columns = arrColumnsXls;

            let sizeSublist = curRec.getLineCount(objSublist.id);

            for(let lineNum = 0; lineNum < sizeSublist; lineNum++){
                let arrValuesRow = [];

                for(let i = 0; i < arrFields.length; i++){
                    let fieldId = arrFields[i];

                    if(arrColumnHide.includes(fieldId)) continue;

                    let value_temp = curRec.getSublistText(objSublist.id, fieldId, lineNum);
                    //jQuery(`#${objSublist.id}_${fieldId}${lineNum + 1}_fs #${fieldId}${lineNum + 1}`).val();
                    if(!value_temp){
                        value_temp = jQuery('#' + objSublist.id + 'row' + lineNum + ' td')[i].innerText;
                    }

                    if(!value_temp){
                        value_temp = curRec.getSublistValue(objSublist.id, fieldId, lineNum);
                    }
                    
                    arrValuesRow.push(value_temp);
                }

                sheet.addRow(arrValuesRow);
            }
        });

        libCsXLS.saveWorkbook(workbook, "Production Planning.xlsx");
    }

    const updatePriority = () =>{
        window._scvForm = _scvForm;
        window._scvArrLineSelected = constDataStore.getDataStore("arrLineSelected") || [];

        let urlPopup = _scvForm.modul.url.resolveScript({
            scriptId: 'customscript_scv_sl_prod_plan_p_priority',
            deploymentId: 'customdeploy_scv_sl_prod_plan_p_priority',
            params: {}
        });

        nlExtOpenWindow(urlPopup, 'popupUpdatePriority', 400, 600, this, true, "Update Priority");
    }
    return {
        pageInit,
        fieldChanged,
        saveRecord,
        onSearchResult,
        openStatusQueue,
        markAllOfSublist,
        onCalculate,
        updateToGantt,
        updateFromGantt,
        onExportResult,
        updatePriority
    };
    
});
