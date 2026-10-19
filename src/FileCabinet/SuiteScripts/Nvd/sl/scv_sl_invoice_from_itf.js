/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/cache', 'N/https', 'N/record', 'N/redirect', 'N/search', 'N/ui/message', 'N/ui/serverWidget', 'N/task',
        '../lib/scv_lib_report.js'],
    (cache, https, record, redirect, search, message, serverWidget, task, libRep) => {
        
        const getMyCache = () => {
            return cache.getCache({
                name: 'cacheCreateInvoiceFromItf',
                scope: cache.Scope.PUBLIC
            });
        }
    
        const onRequest = (scriptContext) => {
            let params = scriptContext.request.parameters;
            if (scriptContext.request.method === "GET") {
                const SS_ITF_INVOICE = 'customsearch_scv_itf_invoice_code';
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
                    scriptId: 'customscript_scv_sl_invoice_from_itf',
                    deploymentId: 'customdeploy_scv_sl_invoice_from_itf',
                    parameters: copyParameters(params, objProcess)
                });
            }
        }
        
        const copyParameters = (params, objProcess) => {
            const fields = [
                'custpage_subsidiary',
                'custpage_customer',
                'custpage_fromdate',
                'custpage_todate',
                'custpage_itemfulfillment',
                'custpage_salesorder',
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
        
        const pushFilterItfInvoice = (f, params) => {
            f.push(search.createFilter({
                name: 'subsidiary',
                operator: search.Operator.ANYOF,
                values: params.custpage_subsidiary
            }));
            
            if (params.custpage_customer) {
                f.push(search.createFilter({
                    name: 'entity',
                    operator: search.Operator.ANYOF,
                    values: params.custpage_customer
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
            
            if (params.custpage_itemfulfillment) {
                f.push(search.createFilter({
                    name: 'internalid',
                    operator: search.Operator.ANYOF,
                    values: params.custpage_itemfulfillment
                }));
            }
            
            if (params.custpage_salesorder) {
                f.push(search.createFilter({
                    name: 'createdfrom',
                    operator: search.Operator.ANYOF,
                    values: params.custpage_salesorder
                }));
            }
        }
        
        const createForm = (params) => {
            let form = serverWidget.createForm({title: 'Tạo hóa đơn hàng loạt từ phiếu xuất'});
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
            
            form.clientScriptModulePath = '../cssl/scv_cs_sl_invoice_from_itf.js';
            let group_filter = 'group_filter';
            let group_default = 'group_default';
            form.addFieldGroup({id: group_filter, label: 'Bộ lọc'});
            form.addFieldGroup({id: group_default, label: 'Mặc định'});
            form.addButton({id: 'custpage_search', label: 'Tìm kiếm', functionName: 'doSearchResult()'});
            if(!messageInfo || isCompelete)  {
                form.addSubmitButton("Tạo hóa đơn");
            }
            
            let fieldSubsidiary = form.addField({
                id: 'custpage_subsidiary',
                type: serverWidget.FieldType.SELECT,
                label: 'Subsidiary',
                container: group_filter
            });
            fieldSubsidiary.isMandatory = true;
            libRep.addAllSelectSubsidiary(fieldSubsidiary, params.custpage_subsidiary);
            
            let fieldCustomer = form.addField({
                id: 'custpage_customer',
                type: serverWidget.FieldType.SELECT,
                label: 'Customer',
                container: group_filter,
                source: 'customer'
            });
            fieldCustomer.defaultValue = params.custpage_customer;
            
            let fieldFromdate = form.addField({
                id: 'custpage_fromdate',
                type: serverWidget.FieldType.DATE,
                label: 'Từ ngày XK',
                container: group_filter
            }).updateLayoutType({layoutType: serverWidget.FieldLayoutType.STARTROW});
            fieldFromdate.isMandatory = true;
            fieldFromdate.defaultValue = params.custpage_fromdate;
            
            let fieldTodate = form.addField({
                id: 'custpage_todate',
                type: serverWidget.FieldType.DATE,
                label: 'Đến ngày XK',
                container: group_filter
            }).updateLayoutType({layoutType: serverWidget.FieldLayoutType.ENDROW});
            fieldTodate.isMandatory = true;
            fieldTodate.defaultValue = params.custpage_todate;
            
            let fieldItemFulfillment = form.addField({
                id: 'custpage_itemfulfillment',
                type: serverWidget.FieldType.SELECT,
                label: 'Phiếu xuất kho',
                container: group_filter,
                source: record.Type.ITEM_FULFILLMENT
            });
            fieldItemFulfillment.defaultValue = params.custpage_itemfulfillment;
            
            let fieldSalesOrder = form.addField({
                id: 'custpage_salesorder',
                type: serverWidget.FieldType.SELECT,
                label: 'Đơn bán hàng',
                container: group_filter,
                source: record.Type.SALES_ORDER
            });
            fieldSalesOrder.defaultValue = params.custpage_salesorder;
            
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
            let sublistId = 'result_invoice';
            let listFieldLine = [
                {id: 'check', type: serverWidget.FieldType.CHECKBOX, label: 'CHECK'},
                {
                    id: 'tranid',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Số chứng từ XK'
                },
                {
                    id: 'trandate',
                    type: serverWidget.FieldType.DATE,
                    label: 'Ngày xuất kho'
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
                    label: 'Đơn bán hàng'
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
        
        const processTransformToInvoice = (scriptContext) => {
            let messageInfo = '', mrTaskId = '';
            let params = scriptContext.request.parameters;
            let postingperiod = getPostingPeriod(params.custpage_trandate);
            let listDataCheck = getListDataCheck(scriptContext).map(o => {return {itfid: o.internalid, createdfrom: o.createdfrom, trandate: params.custpage_trandate, postingperiod}});
            if(listDataCheck.length) {
                requestSuiteletChunk(listDataCheck, 5, 0);
                messageInfo = 'Tạo hóa đơn thành công!';
                if(listDataCheck.length) {
                    let mrTask = task.create({
                        taskType: task.TaskType.MAP_REDUCE,
                        scriptId: 'customscript_scv_mr_invoice_from_itf',
                        deploymentId: 'customdeploy_scv_mr_invoice_from_itf'
                    });
                    mrTask.params = {
                        custscript_scv_mr_invoice_from_itf_value: JSON.stringify(listDataCheck)
                    };
                    mrTaskId = mrTask.submit();
                    getMyCache().put({key: 'mrTaskId', value: mrTaskId});
                    
                    messageInfo = 'Tạo hóa đơn đang cho vào lịch chạy!';
                }
            }
            return {messageInfo, mrTaskId};
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
            https.requestSuitelet.promise({
                scriptId: 'customscript_scv_sl_transform_itf_to_inv',
                deploymentId: 'customdeploy_scv_sl_transform_itf_to_inv',
                body: {listData: JSON.stringify(listData)}
            });
        }
        
        const getListDataCheck = (scriptContext) => {
            let {sublistId, listFieldLine} = getMaster();
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
                    for (let objCol of listFieldLine) {
                        objData[objCol.id] = scriptContext.request.getSublistValue({
                            group: sublistId,
                            name: objCol.id,
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
