/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/cache', 'N/https', 'N/record', 'N/redirect', 'N/search', 'N/ui/message', 'N/ui/serverWidget', 'N/task',
        '../lib/scv_lib_report.js', '../common/scv_common_vendorbill.js', '../olib/alasql/alasql.min@1.7.3.js'],
    (cache, https, record, redirect, search, message, serverWidget, task, libRep, comVdb, alasql) => {
        
        const getMyCache = () => {
            return cache.getCache({
                name: 'cacheCreateVendorBillFromItr',
                scope: cache.Scope.PUBLIC
            });
        }
        
        const onRequest = (scriptContext) => {
            let params = scriptContext.request.parameters;
            if (scriptContext.request.method === "GET") {
                let response = scriptContext.response;
                let listDataItr = [];
                if (params.isSearch === "T") {
                    let filterItr = [];
                    pushFilterItr(filterItr, params);
                    libRep.doSearchSSRangeLabelId(comVdb.SavedSearchId.ITR_BILL_CODE, 1000, listDataItr, filterItr);
                }
                
                let form = createForm(params);
                let sublist = addSublist(form);
                setSublistValueLine(listDataItr, sublist);
                response.writePage(form);
            } else if (scriptContext.request.method === "POST") {
                let objProcess = processTransformToVendorBill(scriptContext);
                
                redirect.toSuitelet({
                    scriptId: 'customscript_scv_sl_vendorbill_from_itr',
                    deploymentId: 'customdeploy_scv_sl_vendorbill_from_itr',
                    parameters: copyParameters(params, objProcess)
                });
            }
        }
        
        const copyParameters = (params, objProcess) => {
            const fields = [
                'custpage_type',
                'custpage_subsidiary',
                'custpage_vendor',
                'custpage_fromdate',
                'custpage_todate',
                'custpage_itemreceipt',
                'custpage_purchaseorder',
                'custpage_trandate'
            ];
            let paramsCopy = JSON.parse(JSON.stringify(objProcess));
            for (let key of fields) {
                if (params.hasOwnProperty(key)) {
                    paramsCopy[key] = params[key];
                }
            }
            return paramsCopy;
        }
        
        const pushFilterItr = (f, params) => {
            f.push(search.createFilter({
                name: 'subsidiary',
                operator: search.Operator.ANYOF,
                values: params.custpage_subsidiary
            }));
            
            if (params.custpage_vendor) {
                f.push(search.createFilter({
                    name: 'entity',
                    operator: search.Operator.ANYOF,
                    values: params.custpage_vendor
                }));
            }
            
            if (params.custpage_fromdate) {
                f.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.ONORAFTER,
                    values: params.custpage_fromdate
                }));
            }
            
            if (params.custpage_todate) {
                f.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.ONORBEFORE,
                    values: params.custpage_todate
                }));
            }
            
            if (params.custpage_itemreceipt) {
                f.push(search.createFilter({
                    name: 'internalid',
                    operator: search.Operator.ANYOF,
                    values: params.custpage_itemreceipt
                }));
            }
            
            if (params.custpage_purchaseorder) {
                f.push(search.createFilter({
                    name: 'createdfrom',
                    operator: search.Operator.ANYOF,
                    values: params.custpage_purchaseorder
                }));
            }
        }
        
        const createForm = (params) => {
            let form = serverWidget.createForm({title: 'Tạo hóa đơn từ phiếu nhập'});
            let mrTaskId = params.mrTaskId;
            if (!mrTaskId) {
                mrTaskId = getMyCache().get({key: 'mrTaskId', loader: 'loader'});
            }
            let messageInfo = '', isCompelete = false;
            if (mrTaskId) {
                let taskStatus = task.checkStatus(mrTaskId);
                messageInfo = 'TaskId ' + mrTaskId + ' is: ' + taskStatus.status;
                if (taskStatus.status === 'COMPLETE' || taskStatus.status === 'FAILED') {
                    getMyCache().remove({key: 'mrTaskId'});
                    isCompelete = true;
                }
            }
            if(messageInfo || params.messageInfo) {
                form.addPageInitMessage({type: message.Type.INFORMATION, message: messageInfo || params.messageInfo, duration: -1});
            }
            
            form.clientScriptModulePath = '../cssl/scv_cs_sl_vendorbill_from_itr.js';
            let group_filter = 'group_filter';
            let group_default = 'group_default';
            form.addFieldGroup({id: group_filter, label: 'Bộ lọc'});
            form.addFieldGroup({id: group_default, label: 'Mặc định'});
            form.addButton({id: 'custpage_search', label: 'Tìm kiếm', functionName: 'doSearchResult()'});
            if(!messageInfo || isCompelete)  {
                form.addSubmitButton("Tạo hóa đơn");
            }
            
            let fieldType = form.addField({
                id: 'custpage_type',
                type: serverWidget.FieldType.SELECT,
                label: 'Phân loại',
                container: group_filter
            });
            fieldType.isMandatory = true;
            let listType = [
                {value: comVdb.Type.NHIEU_PHIEU_NHAP, text: '1. Tạo hóa đơn từ nhiều phiếu nhập'},
                {value: comVdb.Type.HANG_LOAT, text: '2. Tạo hóa đơn hàng loạt'}
            ];
            libRep.addSelectType(fieldType, params.custpage_type || comVdb.Type.NHIEU_PHIEU_NHAP, listType, false);
            
            let fieldSubsidiary = form.addField({
                id: 'custpage_subsidiary',
                type: serverWidget.FieldType.SELECT,
                label: 'Subsidiary',
                container: group_filter
            });
            fieldSubsidiary.isMandatory = true;
            libRep.addAllSelectSubsidiary(fieldSubsidiary, params.custpage_subsidiary);
            
            let fieldVendor = form.addField({
                id: 'custpage_vendor',
                type: serverWidget.FieldType.SELECT,
                label: 'Đối tượng',
                container: group_filter,
                source: 'vendor'
            });
            fieldVendor.defaultValue = params.custpage_vendor;
            
            let fieldFromdate = form.addField({
                id: 'custpage_fromdate',
                type: serverWidget.FieldType.DATE,
                label: 'Từ ngày NK',
                container: group_filter
            }).updateLayoutType({layoutType: serverWidget.FieldLayoutType.STARTROW});
            fieldFromdate.isMandatory = true;
            fieldFromdate.defaultValue = params.custpage_fromdate;
            
            let fieldTodate = form.addField({
                id: 'custpage_todate',
                type: serverWidget.FieldType.DATE,
                label: 'Đến ngày NK',
                container: group_filter
            }).updateLayoutType({layoutType: serverWidget.FieldLayoutType.ENDROW});
            fieldTodate.isMandatory = true;
            fieldTodate.defaultValue = params.custpage_todate;
            
            let fieldItemReceipt = form.addField({
                id: 'custpage_itemreceipt',
                type: serverWidget.FieldType.SELECT,
                label: 'Phiếu nhập kho',
                container: group_filter,
                source: record.Type.ITEM_RECEIPT
            });
            fieldItemReceipt.defaultValue = params.custpage_itemreceipt;
            
            let fieldPurchaseOrder = form.addField({
                id: 'custpage_purchaseorder',
                type: serverWidget.FieldType.SELECT,
                label: 'Đơn hàng',
                container: group_filter,
                source: record.Type.PURCHASE_ORDER
            });
            fieldPurchaseOrder.defaultValue = params.custpage_purchaseorder;
            
            let fieldTrandate = form.addField({
                id: 'custpage_trandate',
                type: serverWidget.FieldType.DATE,
                label: 'Ngày hạch toán',
                container: group_default,
            });
            fieldTrandate.isMandatory = true;
            fieldTrandate.defaultValue = params.custpage_trandate;
            
            return form;
        }
        
        const getMaster = () => {
            let sublistId = 'result_vendorbill';
            let listFieldLine = [
                {id: 'check', type: serverWidget.FieldType.CHECKBOX, label: 'CHECK'},
                {
                    id: 'sochungtu',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Số chứng từ NK'
                },
                {
                    id: 'trandate',
                    type: serverWidget.FieldType.DATE,
                    label: 'Ngày nhập kho'
                },
                {
                    id: 'entity',
                    type: serverWidget.FieldType.TEXT,
                    label: 'entity', display: serverWidget.FieldDisplayType.HIDDEN
                },
                {
                    id: 'entity_display',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Đối tượng'
                },
                {
                    id: 'memo',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Diễn giải'
                },
                {
                    id: 'sodonhang',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Đơn hàng'
                },
                {
                    id: 'ngaydonhang',
                    type: serverWidget.FieldType.DATE,
                    label: 'Ngày đơn hàng'
                },
                {
                    id: 'internalid',
                    type: serverWidget.FieldType.TEXT,
                    label: 'internalid', display: serverWidget.FieldDisplayType.HIDDEN
                },
                {
                    id: 'createdfrom',
                    type: serverWidget.FieldType.TEXT,
                    label: 'createdfrom', display: serverWidget.FieldDisplayType.HIDDEN
                },
                {
                    id: 'subsidiary',
                    type: serverWidget.FieldType.TEXT,
                    label: 'subsidiary', display: serverWidget.FieldDisplayType.HIDDEN
                },
                {
                    id: 'currency',
                    type: serverWidget.FieldType.TEXT,
                    label: 'currency', display: serverWidget.FieldDisplayType.HIDDEN
                }
            ];
            
            return {sublistId, listFieldLine}
        }
        
        const addSublist = (form) => {
            let {sublistId, listFieldLine} = getMaster();
            let sublist = form.addSublist({
                id: sublistId,
                type: serverWidget.SublistType.LIST,
                label: 'Kết quả'
            });
            sublist.addMarkAllButtons();
            libRep.addFieldHeaderColList(sublist, listFieldLine);
            return sublist;
        }
        
        const setSublistValueLine = (listData, sublist) => {
            let {listFieldLine} = getMaster();
            for (let i = 0; i < listData.length; i++) {
                let objData = listData[i];
                for (let objCol of listFieldLine) {
                    let tempValue = objData[objCol.id];
                    if (tempValue || tempValue === 0) {
                        sublist.setSublistValue({id: objCol.id, line: i, value: tempValue});
                    }
                }
            }
        }
        
        const getPostingPeriod = (trandate) => {
            let sqlAp = `select ap.id from accountingperiod ap where ap.startdate <= '${trandate}' and ap.enddate >= '${trandate}' and ap.isquarter = 'F' and ap.isyear = 'F' and ap.isadjust = 'F'`;
            let listAp = [];
            libRep.doSearchSqlAll(listAp, sqlAp, []);
            return listAp[0]?.id;
        }
        
        const processTransformToVendorBill = (scriptContext) => {
            let messageInfo = '', mrTaskId = '';
            let params = scriptContext.request.parameters;
            let postingperiod = getPostingPeriod(params.custpage_trandate);
            let listDataCheck = getListDataCheck(scriptContext);
            if(listDataCheck.length > 0) {
                if(params.custpage_type === comVdb.Type.HANG_LOAT || listDataCheck.length === 1) {
                    listDataCheck = listDataCheck.map(o => {return {irid: o.internalid, createdfrom: o.createdfrom, trandate: params.custpage_trandate, postingperiod, type: params.custpage_type}});
                    requestSuiteletChunk(listDataCheck, 8, 0);
                    messageInfo = 'Tạo hóa đơn thành công!';
                    if(listDataCheck.length) {
                        ({mrTaskId, messageInfo} = createTask(listDataCheck));
                    }
                } else if (params.custpage_type === comVdb.Type.NHIEU_PHIEU_NHAP) {
                    ({mrTaskId, messageInfo} = createVendorBillFromItemReceipt(listDataCheck, params, postingperiod));
                }
            }
            return {messageInfo, mrTaskId};
        }
        
        const createTask = (listDataCheck) => {
            let messageInfo = 'Tạo hóa đơn đang cho vào lịch chạy!';
            let mrTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: 'customscript_scv_mr_vendorbill_from_itr',
                deploymentId: 'customdeploy_scv_mr_vendorbill_from_itr'
            });
            mrTask.params = {
                custscript_scv_mr_bill_from_itr_value: JSON.stringify(listDataCheck)
            };
            let mrTaskId = mrTask.submit();
            getMyCache().put({key: 'mrTaskId', value: mrTaskId});
            return {mrTaskId, messageInfo}
        }
        
        const createVendorBillFromItemReceipt = (listDataCheck, params, postingperiod) => {
            let messageInfo = 'Tạo hóa đơn thành công!', mrTaskId = '';
            let listEntityPo = alasql("select distinct dt.entity, dt.subsidiary, dt.currency from ? dt where dt.entity is not null", [listDataCheck]);
            let listEightPo = listEntityPo.splice(0, 8);
            let listDataCheckEight = alasql("select dt.* from ? dt join ? et on dt.entity = et.entity and dt.subsidiary = et.subsidiary and dt.currency = et.currency", [listDataCheck, listEightPo]);
            comVdb.createVendorBillFromItemReceipt(alasql, libRep, listDataCheckEight, listEightPo, {trandate: params.custpage_trandate, postingperiod});
            
            if(listEntityPo.length > 0) {
                let listDataCheckRemain = alasql("select dt.* from ? dt join ? et on dt.entity = et.entity and dt.subsidiary = et.subsidiary", [listDataCheck, listEntityPo]);
                ({mrTaskId, messageInfo} = createTask([{type: params.custpage_type, options: {trandate: params.custpage_trandate, postingperiod}, listDataCheck: listDataCheckRemain, listEntityPo}]));
            }
            return {mrTaskId, messageInfo};
        }
        
        const requestSuiteletChunk = (listDataCheck, num, i) => {
            if(i < num) {
                let listDataDozen = listDataCheck.splice(0, 1);
                requestSuitelet(listDataDozen);
                if(listDataCheck.length) {
                    requestSuiteletChunk(listDataCheck, num, i + 1);
                }
            }
        }
        
        const requestSuitelet = (listData) => {
            https.requestSuitelet({
                scriptId: 'customscript_scv_sl_transform_ir_to_vb',
                deploymentId: 'customdeploy_scv_sl_transform_ir_to_vb',
                body: {listData: JSON.stringify(listData)}
            });
        }
        
        const getListDataCheck = (scriptContext) => {
            let {sublistId} = getMaster();
            let listFieldIdsLine = ['entity', 'internalid', 'createdfrom', 'subsidiary', 'currency'];
            let lineCnt = scriptContext.request.getLineCount({group: sublistId});
            let listDataCheck = [];
            for (let i = 0; i < lineCnt; i++) {
                let getcheck = scriptContext.request.getSublistValue({
                    group: sublistId,
                    name: "check",
                    line: i,
                });
                if (getcheck === "T") {
                    let objData = {};
                    for (let fieldId of listFieldIdsLine) {
                        objData[fieldId] = scriptContext.request.getSublistValue({
                            group: sublistId,
                            name: fieldId,
                            line: i,
                        });
                    }
                    listDataCheck.push(objData);
                }
            }
            return listDataCheck;
        }
        
        return {
            onRequest
        };
    });
