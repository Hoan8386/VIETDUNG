/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/cache', 'N/format', 'N/record', 'N/redirect', 'N/runtime', 'N/search', 'N/ui/message', 'N/ui/serverWidget', 'N/task',
        '../common/scv_common_phephupham_price.js',
        '../lib/scv_lib_report.js',
        '../olib/lodash.min.js'],
    (cache, format, record, redirect, runtime, search, message, serverWidget, task, cmPppPrice, libRep, lodash) => {
        
        const getMyCache = () => {
            return cache.getCache({
                name: 'cacheUpdatePhepHuPhamPrice',
                scope: cache.Scope.PUBLIC
            });
        }
        
        const onRequest = (scriptContext) => {
            let params = scriptContext.request.parameters;
            if (scriptContext.request.method === "GET") {
                const SS_ITF_INVOICE = 'customsearch_scv_update_scrapt_return';
                let response = scriptContext.response;
                let listDataItfInvoice = [];
                if (params.isSearch === "T") {
                    let filterItfInvoice = [];
                    pushFilterItfInvoice(filterItfInvoice, params);
                    libRep.doSearchSSRangeLabelId(SS_ITF_INVOICE, 1000, listDataItfInvoice, filterItfInvoice);
                }
                
                let form = createForm(params);
                let sublist = addSublist(form);
                setSublistValueLine(listDataItfInvoice, sublist);
                response.writePage(form);
            } else if (scriptContext.request.method === "POST") {
                let objProcess = processTransformToInvoice(scriptContext);
                
                redirect.toSuitelet({
                    scriptId: 'customscript_scv_sl_phephupham_price',
                    deploymentId: 'customdeploy_scv_sl_phephupham_price',
                    parameters: copyParameters(params, objProcess)
                });
            }
        }
        
        const copyParameters = (params, objProcess) => {
            const fields = [
                'custpage_subsidiary',
                'custpage_location',
                'custpage_fromdate',
                'custpage_todate',
                'custpage_item'
            ];
            let paramsCopy = JSON.parse(JSON.stringify(objProcess));
            for (let key of fields) {
                if (params.hasOwnProperty(key)) {
                    paramsCopy[key] = params[key];
                }
            }
            return paramsCopy;
        }
        
        const pushFilterItfInvoice = (f, params) => {
            f.push(search.createFilter({
                name: 'subsidiary',
                operator: search.Operator.ANYOF,
                values: params.custpage_subsidiary
            }));
            
            if (params.custpage_location) {
                f.push(search.createFilter({
                    name: 'location',
                    operator: search.Operator.ANYOF,
                    values: params.custpage_location
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
            
            if (params.custpage_item) {
                f.push(search.createFilter({
                    name: 'item',
                    operator: search.Operator.ANYOF,
                    values: params.custpage_item
                }));
            }
        }
        
        const createForm = (params) => {
            let form = serverWidget.createForm({title: 'Update giá cho phế phụ phẩm thu hồi'});
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
            if (messageInfo || params.messageInfo) {
                form.addPageInitMessage({
                    type: message.Type.INFORMATION,
                    message: messageInfo || params.messageInfo,
                    duration: -1
                });
            }
            
            form.clientScriptModulePath = '../cssl/scv_cs_sl_phephupham_price.js';
            let group_filter = 'group_filter';
            form.addFieldGroup({id: group_filter, label: 'Bộ lọc'});
            form.addButton({id: 'custpage_search', label: 'Tìm kiếm', functionName: 'doSearchResult()'});
            if (!messageInfo || isCompelete) {
                form.addSubmitButton("Cập nhật");
            }
            
            let subsidiary = params.custpage_subsidiary;
            if (!subsidiary) {
                subsidiary = String(runtime.getCurrentUser().subsidiary);
                params.custpage_subsidiary = subsidiary;
            }
            let fieldSubsidiary = form.addField({
                id: 'custpage_subsidiary',
                type: serverWidget.FieldType.SELECT,
                label: 'Subsidiary',
                container: group_filter
            });
            fieldSubsidiary.isMandatory = true;
            libRep.addAllSelectSubsidiary(fieldSubsidiary, subsidiary);
            
            let fieldLocation = form.addField({
                id: 'custpage_location',
                type: serverWidget.FieldType.SELECT,
                label: 'Location',
                container: group_filter
            });
            let fl = [['subsidiary', 'anyOf', subsidiary], 'and', ['isinactive', 'is', false]];
            libRep.addSelection(fieldLocation, 'location', ['internalid', 'namenohierarchy'], fl, true, params.custpage_location);
            
            let dateDefault = getDateDefault(params);
            let fieldFromdate = form.addField({
                id: 'custpage_fromdate',
                type: serverWidget.FieldType.DATE,
                label: 'Từ ngày',
                container: group_filter
            }).updateLayoutType({layoutType: serverWidget.FieldLayoutType.STARTROW});
            fieldFromdate.isMandatory = true;
            fieldFromdate.defaultValue = dateDefault.fromdate;
            
            let fieldTodate = form.addField({
                id: 'custpage_todate',
                type: serverWidget.FieldType.DATE,
                label: 'Đến ngày',
                container: group_filter
            }).updateLayoutType({layoutType: serverWidget.FieldLayoutType.ENDROW});
            fieldTodate.isMandatory = true;
            fieldTodate.defaultValue = dateDefault.todate;
            
            let fieldItem = form.addField({
                id: 'custpage_item',
                type: serverWidget.FieldType.SELECT,
                label: 'Item',
                container: group_filter,
                source: 'item'
            });
            fieldItem.defaultValue = params.custpage_item;
            
            return form;
        }
        
        const getDateDefault = (parameters) => {
            let fromdate = parameters.custpage_fromdate;
            let todate = parameters.custpage_todate;
            if (!fromdate) {
                let dFrom = new Date();
                dFrom.setDate(1);
                fromdate = format.format({type: format.Type.DATE, value: dFrom});
                let dTo = new Date();
                dTo.setMonth(dTo.getMonth() + 1);
                dTo.setDate(0);
                todate = format.format({type: format.Type.DATE, value: dTo});
            }
            return {fromdate, todate}
        }
        
        const getMaster = () => {
            let sublistId = 'custpage_result';
            let listFieldLine = [
                {id: 'check', type: serverWidget.FieldType.CHECKBOX, label: 'CHECK'},
                {
                    id: 'location_display',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Kho'
                },
                {
                    id: 'document_number',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Số giao dịch'
                },
                {
                    id: 'trandate',
                    type: serverWidget.FieldType.DATE,
                    label: 'Ngày'
                },
                {
                    id: 'memo',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Diễn giải'
                },
                {
                    id: 'item_upccode',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Mã Item'
                },
                {
                    id: 'item_name',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Tên Item'
                },
                {
                    id: 'quantity',
                    type: serverWidget.FieldType.FLOAT,
                    label: 'Số lượng'
                },
                {
                    id: 'item_rate',
                    type: serverWidget.FieldType.FLOAT,
                    label: 'Đơn giá hiện tại'
                },
                {
                    id: 'item_giathuhoi',
                    type: serverWidget.FieldType.FLOAT,
                    label: 'Giá thu hồi'
                },
                {
                    id: 'internalid',
                    type: serverWidget.FieldType.TEXT,
                    label: 'internalid', display: serverWidget.FieldDisplayType.HIDDEN
                },
                {
                    id: 'item',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Item', display: serverWidget.FieldDisplayType.HIDDEN
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
        
        const processTransformToInvoice = (scriptContext) => {
            let messageInfo = '', mrTaskId = '';
            let listDataCheck = getListDataCheck(scriptContext);
            if (listDataCheck.length) {
                let groupDataCheck = lodash.groupBy(listDataCheck, 'internalid');
                let listKeysCheck = Object.keys(groupDataCheck);
                
                let listDataCheckFirst = listKeysCheck.splice(0, 8);
                updatePhepHuPhamPrice(listDataCheckFirst, groupDataCheck);
                messageInfo = 'Cập nhật giá phế phụ phẩm thu hồi thành công!';
                if (listKeysCheck.length) {
                    let listData = [];
                    for (let i = 0; i < listKeysCheck.length; i++) {
                        listData.push(groupDataCheck[listKeysCheck[i]]);
                    }
                    let mrTask = task.create({
                        taskType: task.TaskType.MAP_REDUCE,
                        scriptId: 'customscript_scv_mr_phephupham_price',
                        deploymentId: 'customdeploy_scv_mr_phephupham_price'
                    });
                    mrTask.params = {
                        custscript_scv_mr_phephupham_price_value: JSON.stringify(listData)
                    };
                    mrTaskId = mrTask.submit();
                    getMyCache().put({key: 'mrTaskId', value: mrTaskId});
                    
                    messageInfo = 'Cập nhật giá phế phụ phẩm thu hồi đang cho vào lịch chạy!';
                }
            }
            return {messageInfo, mrTaskId};
        }
        
        const updatePhepHuPhamPrice = (listDataCheckFirst, groupDataCheck) => {
            for (let i = 0; i < listDataCheckFirst.length; i++) {
                let internalid = listDataCheckFirst[i];
                let listItemOfIA = groupDataCheck[internalid];
                cmPppPrice.updatePhephuphamPrice(listItemOfIA);
            }
        }
        
        const getListDataCheck = (scriptContext) => {
            let {sublistId} = getMaster();
            let listFieldIds = ['internalid', 'item', 'item_giathuhoi'];
            let lineCnt = scriptContext.request.getLineCount({group: sublistId});
            let listDataCheck = [];
            for (let i = 0; i < lineCnt; i++) {
                let getcheck = scriptContext.request.getSublistValue({
                    group: sublistId,
                    name: "check",
                    line: i,
                });
                if (getcheck === true || getcheck === "T") {
                    let objData = {};
                    for (let fieldId of listFieldIds) {
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
