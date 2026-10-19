/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/format', 'N/record', 'N/redirect', 'N/runtime', 'N/search', 'N/ui/serverWidget',
        '../lib/scv_lib_report.js', '../lib/scv_lib_cmms.js', '../olib/lodash.min.js'],
    
    (format, record, redirect, runtime, search, serverWidget, libRep, libCmms, lodash) => {
        
        const SavedSearchId = {
            TO_FROM_PLAN: 'customsearch_scv_cmms_to_from_plan'
        }
        
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            let request = scriptContext.request;
            let parameters = request.parameters;
            let response = scriptContext.response;
            
            let subsidiary = parameters.custpage_subsidiary || (runtime.getCurrentUser().subsidiary + '');
            parameters.custpage_subsidiary = subsidiary;
            let isRun = parameters.custpage_subsidiary && parameters.custpage_period && parameters.issearch === 'T';
            
            let master = getMaster();
            
            if (request.method === 'GET') {
                let form = createForm(parameters, subsidiary);
                let sublist = createSublist(form, master.sublistId);
                libRep.addFieldHeaderColList(sublist, master.col);
                
                let listData = isRun ? getListDataChiTietMay(parameters, subsidiary) : [];
                if (listData.length > 0) {
                    listData = buildDataKeHoachBaoDuong(listData, parameters);
                    setSublistValueLine(master, sublist, listData);
                }
                response.writePage(form);
            } else {
                let lineCountGroup = request.getLineCount({group: master.sublistId});
                let transactionId;
                let listData = getListDataKeHoachBaoDuongLine(master, request, lineCountGroup);
                let listEquipmentIds = Array.from(new Set(listData.filter(o => o.custrecord_scv_cmms_mp_equipment_l).map(o => o.custrecord_scv_cmms_mp_equipment_l)));
                let listToFromPlan = [];
                let filterToFromPlan = [search.createFilter({
                    name: 'custrecord_scv_cmms_bom_equipment',
                    operator: search.Operator.ANYOF,
                    values: listEquipmentIds
                })];
                libRep.doSearchSSRangeLabelId(SavedSearchId.TO_FROM_PLAN, 1000, listToFromPlan, filterToFromPlan);
                
                let listDataGroup = lodash.groupBy(listData, o => o.custrecord_scv_cmms_mp_asset_l);
                for (let assetId in listDataGroup) {
                    let recKeHoachBaoDuong = record.create({
                        type: libCmms.CmmsRecordType.KE_HOACH_BAO_DUONG,
                        isDynamic: true
                    });
                    let listDataLine = listDataGroup[assetId];
                    setHeaderFieldKeHoachBaoDuong(recKeHoachBaoDuong, parameters, listDataLine[0]);
                    setCurrentSublistValueKeHoachBaoDuongChiTiet(recKeHoachBaoDuong, listDataLine);
                    setCurrentSublistValueBgPlan(recKeHoachBaoDuong, listDataLine, listToFromPlan, assetId);
                    transactionId = recKeHoachBaoDuong.save({ignoreMandatoryFields: true});
                }
                
                if (transactionId) {
                    redirect.toRecord({type: libCmms.CmmsRecordType.KE_HOACH_BAO_DUONG, id: transactionId});
                } else {
                    redirect.toSuitelet({
                        scriptId: 'customscript_scv_sl_cmms_kehoach_scbd',
                        deploymentId: 'customdeploy_scv_sl_cmms_kehoach_scbd',
                        isExternal: false,
                        parameters: copyParameters(parameters)
                    });
                }
            }
            
        }
        
        const setDateZeroNeed = (currentDate) => {
            //currentDate.setFullYear(startDate.getFullYear());
           // currentDate.setMonth(startDate.getMonth());
            //currentDate.setDate(startDate.getDate());
            currentDate.setMinutes(0);
            currentDate.setSeconds(0);
            currentDate.setMilliseconds(0);
        }
        
        const getStartDate = (parameters) => {
            let lkAccountPeriod = search.lookupFields({
                type: search.Type.ACCOUNTING_PERIOD,
                id: parameters.custpage_period,
                columns: ['startdate']
            });
            
            return lkAccountPeriod.startdate;
        }
        
        const buildDataKeHoachBaoDuong = (listData, parameters) => {
            //let startDate = format.parse({type: format.Type.DATE, value: getStartDate(parameters)});
            const hourStart = 8;
            let currentDate = format.parse({type: format.Type.DATE, value: getStartDate(parameters)});//libCmms.getDateNow(7);
            currentDate.setHours(hourStart);
            setDateZeroNeed(currentDate);
            let currentToDate = format.parse({type: format.Type.DATE, value: getStartDate(parameters)});//libCmms.getDateNow(7);
            setDateZeroNeed(currentToDate);
            let currentMonth = String(currentDate.getMonth() + 1);
            
            let listNewData = [];
            for (let objData of listData) {
                let listDay;
                if (objData.custrecord_scv_cmms_eq_dayofmonth) {
                    listDay = objData.custrecord_scv_cmms_eq_dayofmonth.split(libCmms.CmmsCharToSplit.SEMICOLON);
                } else {
                    listDay = ['1'];
                }
                let isNotInMfMonth = !isInMfMonth(currentMonth, objData);
                for (let day of listDay) {
                    let objNewData = JSON.parse(JSON.stringify(objData));
                    currentDate.setDate(parseInt(day, 10));
                    currentToDate.setDate(parseInt(day, 10));
                    currentToDate.setHours(hourStart + parseInt(objData.custrecord_scv_cmms_eq_duration || 0, 10));
                    
                    objNewData.custrecord_scv_cmms_mp_fromdate_l = isNotInMfMonth ? '' : format.format({
                        type: format.Type.DATE,
                        value: currentDate
                    });
                    objNewData.custrecord_scv_cmms_mp_todate_l = isNotInMfMonth ? '' : format.format({
                        type: format.Type.DATE,
                        value: currentToDate
                    });
                    objNewData.custrecord_scv_cmms_mp_type_l = libCmms.CmmsScbdType.HANG_THANG;
                    objNewData.custrecord_scv_cmms_mp_fromtime_l = isNotInMfMonth ? '' : format.format({
                        type: format.Type.TIMEOFDAY,
                        value: currentDate
                    });//'08:00 am';
                    objNewData.custrecord_scv_cmms_mp_totime_l = isNotInMfMonth ? '' : format.format({
                        type: format.Type.TIMEOFDAY,
                        value: currentToDate
                    });//'08:00 am';
                    
                    if(isNotInMfMonth) {
                        objNewData.custrecord_scv_cmms_eq_workitem = '';
                        objNewData.custrecord_scv_cmms_eq_workitem_display = '';
                        objNewData.custrecord_scv_cmms_eq_workitem_hidden = '';
                        objNewData.custrecord_scv_cmms_wi_description = '';
                        objNewData.custrecord_scv_cmms_wi_description_hidden = '';
                    }
                    listNewData.push(objNewData);
                }
            }
            return listNewData;
        }
        
        const isInMfMonth = (currentMonth, objData) => {
            let isInMonth = false;
            if (objData.custrecord_scv_cmms_mf_month) {
                let inMonths = objData.custrecord_scv_cmms_mf_month.split(libCmms.CmmsCharToSplit.SEMICOLON);
                isInMonth = inMonths.includes(currentMonth);
            }
            return isInMonth;
        }
        
        const copyParameters = (parameters) => {
            return {
                custpage_subsidiary: parameters.custpage_subsidiary,
                custpage_period: parameters.custpage_period,
                custpage_period_text: parameters.custpage_period_text,
                custpage_famasset: parameters.custpage_famasset,
                custpage_department_use: parameters.custpage_department_use,
                custpage_department_manage: parameters.custpage_department_manage
            }
        }
        
        const prefixNameKHBD = 'Kế hoạch bảo dưỡng';
        
        const setHeaderFieldKeHoachBaoDuong = (recKeHoachBaoDuong, parameters, objFirstData) => {
            recKeHoachBaoDuong.setValue('altname', `${prefixNameKHBD} ${objFirstData.custrecord_scv_cmms_mp_asset_l_diaplay} ${parameters.custpage_period_text}`);
            recKeHoachBaoDuong.setValue('custrecord_scv_cmms_mp_subsidiary', parameters.custpage_subsidiary);
            recKeHoachBaoDuong.setValue('custrecord_scv_cmms_mp_period', parameters.custpage_period);
            recKeHoachBaoDuong.setValue('custrecord_scv_cmms_mp_asset', objFirstData.custrecord_scv_cmms_mp_asset_l);
            recKeHoachBaoDuong.setText({fieldId: 'custrecord_scv_cmms_mp_fromdate', text: parameters.custpage_fromdate_default});
            recKeHoachBaoDuong.setText({fieldId: 'custrecord_scv_cmms_mp_todate', text: parameters.custpage_todate_default});
        }
        
        const setCurrentSublistValueKeHoachBaoDuongChiTiet = (recKeHoachBaoDuong, listData) => {
            for (let objData of listData) {
                setCurrentSublistValueKeHoachBaoDuongChiTietLine(recKeHoachBaoDuong, libCmms.CmmsSublistId.KHBD_CHI_TIET, objData);
            }
        }
        
        const setCurrentSublistValueKeHoachBaoDuongChiTietLine = (recKeHoachBaoDuong, sublistId, objData) => {
            recKeHoachBaoDuong.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord_scv_cmms_mp_asset_l',
                value: objData.custrecord_scv_cmms_mp_asset_l
            });
            try {
                recKeHoachBaoDuong.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_scv_cmms_mp_component_l',
                    value: objData.custrecord_scv_cmms_mp_component_l
                });
            } catch (e) {
                log.error('Error set component', e);
            }
            try {
                recKeHoachBaoDuong.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_scv_cmms_mp_equipment_l',
                    value: objData.custrecord_scv_cmms_mp_equipment_l
                });
            } catch (e) {
                log.error('Error set equipment', e);
            }
            
            recKeHoachBaoDuong.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord_scv_cmms_mp_type_l',
                value: objData.custrecord_scv_cmms_mp_type_l
            });
            recKeHoachBaoDuong.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord_scv_cmms_mp_workitem_l',
                value: objData.custrecord_scv_cmms_mp_workitem_l
            });
            recKeHoachBaoDuong.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord_scv_cmms_mp_description_l',
                value: objData.custrecord_scv_cmms_mp_description_l
            });
            recKeHoachBaoDuong.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord_scv_cmms_mp_department_l',
                value: objData.custrecord_scv_cmms_mp_department_l
            });
            
            recKeHoachBaoDuong.setCurrentSublistText({
                sublistId: sublistId,
                fieldId: 'custrecord_scv_cmms_mp_fromdate_l',
                text: objData.custrecord_scv_cmms_mp_fromdate_l
            });
            recKeHoachBaoDuong.setCurrentSublistText({
                sublistId: sublistId,
                fieldId: 'custrecord_scv_cmms_mp_fromtime_l',
                text: objData.custrecord_scv_cmms_mp_fromtime_l
            });
            recKeHoachBaoDuong.setCurrentSublistText({
                sublistId: sublistId,
                fieldId: 'custrecord_scv_cmms_mp_todate_l',
                text: objData.custrecord_scv_cmms_mp_todate_l
            });
            recKeHoachBaoDuong.setCurrentSublistText({
                sublistId: sublistId,
                fieldId: 'custrecord_scv_cmms_mp_totime_l',
                text: objData.custrecord_scv_cmms_mp_totime_l
            });
            
            recKeHoachBaoDuong.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord_scv_cmms_mp_memo_l',
                value: objData.custrecord_scv_cmms_mp_memo_l
            });
            
            recKeHoachBaoDuong.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord_scv_cmms_mp_actual_workitem_l',
                value: objData.custrecord_scv_cmms_mp_actual_workitem_l
            });
            recKeHoachBaoDuong.setCurrentSublistText({
                sublistId: sublistId,
                fieldId: 'custrecord_scv_cmms_mp_actual_fromdate_l',
                text: objData.custrecord_scv_cmms_mp_actual_fromdate_l
            });
            recKeHoachBaoDuong.setCurrentSublistText({
                sublistId: sublistId,
                fieldId: 'custrecord_scv_cmms_mp_actual_todate_l',
                text: objData.custrecord_scv_cmms_mp_actual_todate_l
            });
            recKeHoachBaoDuong.commitLine({sublistId: sublistId});
        }
        
        const setCurrentSublistValueBgPlan = (recKeHoachBaoDuong, listDataLine, listToFromPlan, assetId) => {
            let listEquipmentIds = Array.from(new Set(listDataLine.map(o => o.custrecord_scv_cmms_mp_equipment_l)));
            listEquipmentIds.forEach(equipmentId => {
                let componentId = listDataLine.find(o => o.custrecord_scv_cmms_mp_equipment_l === equipmentId)?.custrecord_scv_cmms_mp_component_l;
                let listToFromPlanChildren = listToFromPlan.filter(o => o.equipment === equipmentId);
                listToFromPlanChildren.forEach(objToFromPlan => {
                    recKeHoachBaoDuong.setCurrentSublistValue({
                        sublistId: libCmms.CmmsSublistId.KHBD_BG_PLAN,
                        fieldId: 'custrecord_scv_cmms_bg_asset',
                        value: assetId
                    });
                    recKeHoachBaoDuong.setCurrentSublistValue({
                        sublistId: libCmms.CmmsSublistId.KHBD_BG_PLAN,
                        fieldId: 'custrecord_scv_cmms_bg_component',
                        value: componentId
                    });
                    recKeHoachBaoDuong.setCurrentSublistValue({
                        sublistId: libCmms.CmmsSublistId.KHBD_BG_PLAN,
                        fieldId: 'custrecord_scv_cmms_bg_equipment',
                        value: equipmentId
                    });
                    
                    setCurrentSublistValueBgPlanLine(recKeHoachBaoDuong, libCmms.CmmsSublistId.KHBD_BG_PLAN, objToFromPlan);
                });
            });
        }
        
        const setCurrentSublistValueBgPlanLine = (recKeHoachBaoDuong, sublistId, objToFromPlan) => {
            recKeHoachBaoDuong.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord_scv_cmms_bg_item',
                value: objToFromPlan.item
            });
            recKeHoachBaoDuong.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord_scv_cmms_bg_unit',
                value: objToFromPlan.unit
            });
            recKeHoachBaoDuong.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord_scv_cmms_bg_estimatequantity',
                value: objToFromPlan.quantity
            });
            recKeHoachBaoDuong.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord_scv_cmms_bg_estimaterate',
                value: objToFromPlan.rate
            });
            recKeHoachBaoDuong.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord_scv_cmms_bg_estimateamount',
                value: objToFromPlan.amount
            });
            recKeHoachBaoDuong.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord_scv_cmms_bg_actualitem',
                value: objToFromPlan.item
            });
            recKeHoachBaoDuong.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord_scv_cmms_bg_actualquantity',
                value: objToFromPlan.quantity
            });
            recKeHoachBaoDuong.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord_scv_cmms_bg_actualrate',
                value: objToFromPlan.rate
            });
            recKeHoachBaoDuong.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord_scv_cmms_bg_actualamount',
                value: objToFromPlan.amount
            });
            
            recKeHoachBaoDuong.commitLine({sublistId: sublistId});
        }
        
        const getListDataKeHoachBaoDuongLine = (master, request, lineCountGroup) => {
            let listData = [];
            let department_default = request.parameters.custpage_department_default;
            let fromdate_default = request.parameters.custpage_fromdate_default;
            let todate_default = request.parameters.custpage_todate_default;
            let ttbd_fromdate_default = request.parameters.custpage_ttbd_fromdate_default;
            let ttbd_todate_default = request.parameters.custpage_ttbd_todate_default;
            // let currentDate = format.parse({value: getStartDate(request.parameters), type: format.Type.DATE});
            // let currentMonth = String(currentDate.getMonth() + 1);
            for (let line = 0; line < lineCountGroup; line++) {
                let chiTietMayId = request.getSublistValue({group: master.sublistId, name: 'id', line: line});
                // let custrecord_scv_cmms_mf_month = request.getSublistValue({
                //     group: master.sublistId,
                //     name: 'custrecord_scv_cmms_mf_month',
                //     line: line
                // });
                let workitem = request.getSublistValue({
                    group: master.sublistId,
                    name: 'custrecord_scv_cmms_eq_workitem',
                    line: line
                });
                if (chiTietMayId && workitem) {//&& isInMfMonth(currentMonth, {custrecord_scv_cmms_mf_month})
                    listData.push({
                        custrecord_scv_cmms_mp_asset_l: request.getSublistValue({
                            group: master.sublistId,
                            name: 'custrecord_scv_cmms_eq_asset',
                            line: line
                        }),
                        custrecord_scv_cmms_mp_asset_l_diaplay: request.getSublistValue({
                            group: master.sublistId,
                            name: 'custrecord_scv_cmms_eq_asset_display_hidden',
                            line: line
                        }),
                        custrecord_scv_cmms_mp_component_l: request.getSublistValue({
                            group: master.sublistId,
                            name: 'custrecord_scv_cmms_eq_component',
                            line: line
                        }),
                        custrecord_scv_cmms_mp_equipment_l: chiTietMayId,
                        custrecord_scv_cmms_mp_type_l: request.getSublistValue({
                            group: master.sublistId,
                            name: 'custrecord_scv_cmms_mp_type_l',
                            line: line
                        }),
                        custrecord_scv_cmms_mp_workitem_l: workitem,
                        custrecord_scv_cmms_mp_actual_workitem_l: workitem,
                        custrecord_scv_cmms_mp_description_l: request.getSublistValue({
                            group: master.sublistId,
                            name: 'custrecord_scv_cmms_wi_description',
                            line: line
                        }),
                        custrecord_scv_cmms_mp_department_l: request.getSublistValue({
                            group: master.sublistId,
                            name: 'department',
                            line: line
                        }) || department_default,
                        custrecord_scv_cmms_mp_fromdate_l: fromdate_default || request.getSublistValue({
                            group: master.sublistId,
                            name: 'custrecord_scv_cmms_mp_fromdate_l',
                            line: line
                        }),
                        custrecord_scv_cmms_mp_fromtime_l: request.getSublistValue({
                            group: master.sublistId,
                            name: 'custrecord_scv_cmms_mp_fromtime_l',
                            line: line
                        }),
                        custrecord_scv_cmms_mp_todate_l: todate_default || request.getSublistValue({
                            group: master.sublistId,
                            name: 'custrecord_scv_cmms_mp_todate_l',
                            line: line
                        }),
                        custrecord_scv_cmms_mp_totime_l: request.getSublistValue({
                            group: master.sublistId,
                            name: 'custrecord_scv_cmms_mp_totime_l',
                            line: line
                        }),
                        custrecord_scv_cmms_mp_memo_l: request.getSublistValue({
                            group: master.sublistId,
                            name: 'custrecord_scv_cmms_mp_memo_l',
                            line: line
                        }),
                        custrecord_scv_cmms_mp_actual_fromdate_l: ttbd_fromdate_default,
                        custrecord_scv_cmms_mp_actual_todate_l: ttbd_todate_default,
                    });
                }
            }
            return listData;
        }
        
        const setSublistValueLine = (master, sublist, listData) => {
            let line = 0;
            let listDataGroup = lodash.groupBy(listData, o => o.custrecord_scv_cmms_eq_asset + '>>' + o.custrecord_scv_cmms_eq_component);
            let colChildren = master.col.filter(o => o.id !== 'custrecord_scv_cmms_eq_asset_display' && o.id !== 'custrecord_scv_cmms_eq_component_display');
            for (let key in listDataGroup) {
                let listDataChildren = listDataGroup[key];
                line = setSublistValueLineGroup(sublist, listDataChildren, line);
                
                for (let objData of listDataChildren) {
                    for (let objCol of colChildren) {
                        let tempValue = objData[objCol.id];
                        if (tempValue) {
                            sublist.setSublistValue({id: objCol.id, line: line, value: tempValue});
                        }
                        if (objCol.id === 'custrecord_scv_cmms_eq_asset_display_hidden' && objData.custrecord_scv_cmms_eq_asset_display) {
                            sublist.setSublistValue({
                                id: objCol.id,
                                line: line,
                                value: objData.custrecord_scv_cmms_eq_asset_display
                            });
                        }
                    }
                    line++;
                }
            }
            
        }
        
        const setSublistValueLineGroup = (sublist, listDataChildren, lineIp) => {
            let line = lineIp;
            let objDataChildZero = listDataChildren[0];
            sublist.setSublistValue({
                id: 'custrecord_scv_cmms_eq_asset_display',
                line: line,
                value: objDataChildZero.custrecord_scv_cmms_eq_asset_display
            });
            line++;
            sublist.setSublistValue({
                id: 'co_sequencecode',
                line: line,
                value: objDataChildZero.custrecord_scv_cmms_co_sequencecode
            });
            sublist.setSublistValue({
                id: 'custrecord_scv_cmms_eq_component_display',
                line: line,
                value: objDataChildZero.custrecord_scv_cmms_eq_component_display
            });
            line++;
            return line;
        }
        
        const createForm = (parameters, subsidiary) => {
            let form = serverWidget.createForm({title: "Kế hoạch sửa chữa bảo dưỡng"});
            form.clientScriptModulePath = '../cs/scv_cs_cmms_kehoach_scbd.js';
            form.addButton({id: 'custpage_bt_search', label: 'Tìm kiếm', functionName: 'searchReport()'});
            let container = 'fieldgroup_dc_main', containerDefaultValues = 'fieldgroup_dc_default_values';
            form.addFieldGroup({id: container, label: 'Filter'});
            form.addFieldGroup({id: containerDefaultValues, label: 'Giá trị mặc định'});
            
            let fieldSubsidiary = form.addField({
                id: 'custpage_subsidiary',
                type: serverWidget.FieldType.SELECT,
                label: 'CÔNG TY',
                container: container
            });
            fieldSubsidiary.isMandatory = true;
            libRep.addSelectSubsidiary(fieldSubsidiary, subsidiary);
            
            let fieldPeriod = form.addField({
                id: 'custpage_period',
                type: serverWidget.FieldType.SELECT,
                label: 'Kỳ', //source: 'accountingperiod',
                container: container
            });
            fieldPeriod.isMandatory = true;
            let sqlAcc = `select acc.id value, acc.periodname text from accountingperiod acc where acc.isinactive = 'F' and acc.isadjust = 'F' and acc.isquarter = 'F' and acc.isyear = 'F' and acc.closed = 'F'`;
            libRep.addSelectionViaSql(fieldPeriod, sqlAcc, [], true, parameters.custpage_period);
            
            let fieldFamAsset = form.addField({
                id: 'custpage_famasset',
                type: serverWidget.FieldType.SELECT,
                label: 'Tài sản', source: 'customrecord_ncfar_asset',
                container: container
            });
            fieldFamAsset.defaultValue = parameters.custpage_famasset;
            
            let fieldDepartmentUse = form.addField({
                id: 'custpage_department_use',
                type: serverWidget.FieldType.SELECT,
                label: 'Bộ phận sử dụng', source: 'department',
                container: container
            });
            fieldDepartmentUse.defaultValue = parameters.custpage_department_use;
            
            let fieldDepartmentManage = form.addField({
                id: 'custpage_department_manage',
                type: serverWidget.FieldType.SELECT,
                label: 'Bộ phận quản lý', source: 'department',
                container: container
            });
            fieldDepartmentManage.defaultValue = parameters.custpage_department_manage;
            
            libRep.addFieldHidden(form, 'custpage_period_text', parameters.custpage_period_text);
            
            let fieldDepartmentDefault = form.addField({
                id: 'custpage_department_default',
                type: serverWidget.FieldType.SELECT,
                label: 'Bộ phận', source: 'department',
                container: containerDefaultValues
            });
            fieldDepartmentDefault.defaultValue = parameters.custpage_department_default;
            
            let fieldFromDateDefault = form.addField({
                id: 'custpage_fromdate_default',
                type: serverWidget.FieldType.DATE,
                label: 'KHBD - Từ ngày',
                container: containerDefaultValues
            });
            fieldFromDateDefault.defaultValue = parameters.custpage_fromdate_default;
            fieldFromDateDefault.updateLayoutType({layoutType: serverWidget.FieldLayoutType.STARTROW});
            
            let fieldToDateDefault = form.addField({
                id: 'custpage_todate_default',
                type: serverWidget.FieldType.DATE,
                label: 'KHBD - Đến ngày',
                container: containerDefaultValues
            });
            fieldToDateDefault.defaultValue = parameters.custpage_todate_default;
            fieldToDateDefault.updateLayoutType({layoutType: serverWidget.FieldLayoutType.ENDROW});
            
            let fieldTtbdFromDateDefault = form.addField({
                id: 'custpage_ttbd_fromdate_default',
                type: serverWidget.FieldType.DATE,
                label: 'TTBD - Từ ngày',
                container: containerDefaultValues
            });
            fieldTtbdFromDateDefault.defaultValue = parameters.custpage_ttbd_fromdate_default;
            fieldTtbdFromDateDefault.updateLayoutType({layoutType: serverWidget.FieldLayoutType.STARTROW});
            
            let fieldTtbdToDateDefault = form.addField({
                id: 'custpage_ttbd_todate_default',
                type: serverWidget.FieldType.DATE,
                label: 'TTBD - Đến ngày',
                container: containerDefaultValues
            });
            fieldTtbdToDateDefault.defaultValue = parameters.custpage_ttbd_todate_default;
            fieldTtbdToDateDefault.updateLayoutType({layoutType: serverWidget.FieldLayoutType.ENDROW});
            
            form.addSubmitButton({label: 'Tạo kế hoạch'});
            
            return form;
        }
        
        const createSublist = (form, sublistId) => {
            //sublist.addMarkAllButtons();
            return form.addSublist({
                id: sublistId,
                type: serverWidget.SublistType.LIST,
                label: 'Kết quả'
            });
        }
        
        const getMaster = () => {
            let col = [
                {id: 'custrecord_scv_cmms_eq_asset', label: 'Tài sản', type: 'text', display: 'hidden'},
                {id: 'custrecord_scv_cmms_eq_asset_display', label: 'Tài sản', type: 'text', display: 'disabled'},
                {id: 'custrecord_scv_cmms_eq_asset_display_hidden', label: 'Tài sản', type: 'text', display: 'hidden'},
                {id: 'co_sequencecode', label: 'Mã sắp xếp', type: 'text', display: 'disabled'},
                {id: 'custrecord_scv_cmms_eq_component', label: 'Thành phần', type: 'text', display: 'hidden'},
                {
                    id: 'custrecord_scv_cmms_eq_component_display',
                    label: 'Thành phần',
                    type: 'text',
                    display: 'disabled'
                },
                {id: 'name', label: 'Chi tiết máy', type: 'text', display: 'disabled'},
                {id: 'id', label: 'Internal ID', type: 'text', display: 'hidden'},
                {
                    id: 'custrecord_scv_cmms_mp_type_l',
                    label: 'Loại SCBD',
                    type: serverWidget.FieldType.SELECT,
                    display: serverWidget.FieldDisplayType.ENTRY,
                    source: 'customlist_scv_cmms_type'
                },
                {
                    id: 'custrecord_scv_cmms_eq_workitem_hidden',
                    label: 'Công việc thực hiện',
                    type: 'text',
                    display: serverWidget.FieldDisplayType.HIDDEN
                },
                {
                    id: 'custrecord_scv_cmms_eq_workitem',
                    label: 'Công việc thực hiện',
                    type: serverWidget.FieldType.SELECT,
                    display: serverWidget.FieldDisplayType.DISABLED,
                    source: 'customrecord_scv_cmms_workitem',
                    isEntry: true
                },
                {
                    id: 'custrecord_scv_cmms_eq_workitem_display',
                    label: 'Công việc thực hiện',
                    type: 'text',
                    display: 'hidden'
                },
                {
                    id: 'custrecord_scv_cmms_eq_workitem_default',
                    label: 'Công việc thực hiện',
                    type: 'text',
                    display: 'hidden'
                },
                {
                    id: 'custrecord_scv_cmms_wi_description_hidden',
                    label: 'Mô tả',
                    type: 'text',
                    display: serverWidget.FieldDisplayType.HIDDEN
                },
                {id: 'custrecord_scv_cmms_wi_description', label: 'Mô tả', type: serverWidget.FieldType.TEXT, display: serverWidget.FieldDisplayType.DISABLED, isEntry: true},
                {
                    id: 'custrecord_scv_cmms_wi_description_default',
                    label: 'Mô tả',
                    type: 'text',
                    display: serverWidget.FieldDisplayType.HIDDEN
                },
                {
                    id: 'department',
                    label: 'Bộ phận',
                    type: serverWidget.FieldType.SELECT,
                    display: serverWidget.FieldDisplayType.ENTRY,
                    source: 'department'
                },
                
                {
                    id: 'custrecord_scv_cmms_mp_fromdate_l',
                    label: 'KHBD - Từ ngày',
                    type: serverWidget.FieldType.DATE,
                    display: serverWidget.FieldDisplayType.ENTRY
                },
                {
                    id: 'custrecord_scv_cmms_mp_fromtime_l',
                    label: 'KHBD - Từ giờ',
                    type: serverWidget.FieldType.TIMEOFDAY,
                    display: serverWidget.FieldDisplayType.HIDDEN
                },
                {
                    id: 'custrecord_scv_cmms_mp_todate_l',
                    label: 'KHBD - Đến ngày',
                    type: serverWidget.FieldType.DATE,
                    display: serverWidget.FieldDisplayType.ENTRY
                },
                {
                    id: 'custrecord_scv_cmms_mp_totime_l',
                    label: 'KHBD - Đến giờ',
                    type: serverWidget.FieldType.TIMEOFDAY,
                    display: serverWidget.FieldDisplayType.HIDDEN
                },
                
                {
                    id: 'custrecord_scv_cmms_mp_memo_l',
                    label: 'Ghi chú',
                    type: serverWidget.FieldType.TEXT,
                    display: serverWidget.FieldDisplayType.ENTRY
                },
                {
                    id: 'custrecord_scv_cmms_mf_month',
                    label: 'MF Month',
                    type: serverWidget.FieldType.TEXT,
                    display: serverWidget.FieldDisplayType.HIDDEN
                }
            ];
            return {sublistId: 'custpage_sl_result', col};
        }
        
        const getListDataChiTietMay = (parameters, subsidiary) => {
            let listData = [], params = [subsidiary];
            let strWhereAdd = '';
            if (parameters.custpage_famasset) {
                strWhereAdd += ' and eqm.custrecord_scv_cmms_eq_asset = ?';
                params.push(parameters.custpage_famasset);
            }
            if (parameters.custpage_department_use) {
                strWhereAdd += ' and asset.custrecord_assetdepartment = ?';
                params.push(parameters.custpage_department_use);
            }
            if (parameters.custpage_department_manage) {
                strWhereAdd += ' and asset.custrecord_scv_managedepartment = ?';
                params.push(parameters.custpage_department_manage);
            }
            let sqlChiTietMay = `
                select eqm.id, eqm.name, eqm.custrecord_scv_cmms_eq_asset, (asset.name || ' ' || asset.altname) custrecord_scv_cmms_eq_asset_display,
                    eqm.custrecord_scv_cmms_eq_component, cpn.name custrecord_scv_cmms_eq_component_display, cpn.custrecord_scv_cmms_co_sequencecode,
                    eqm.custrecord_scv_cmms_eq_workitem, eqm.custrecord_scv_cmms_eq_workitem custrecord_scv_cmms_eq_workitem_hidden, wi.name custrecord_scv_cmms_eq_workitem_display,
                    eqm.custrecord_scv_cmms_eq_workitem custrecord_scv_cmms_eq_workitem_default, wi.custrecord_scv_cmms_wi_description custrecord_scv_cmms_wi_description_default,
                    wi.custrecord_scv_cmms_wi_description, wi.custrecord_scv_cmms_wi_description custrecord_scv_cmms_wi_description_hidden,
                    eqm.custrecord_scv_cmms_eq_dayofmonth, freq.custrecord_scv_cmms_mf_month, eqm.custrecord_scv_cmms_eq_duration
                from customrecord_scv_cmms_equipment eqm
                    join customrecord_ncfar_asset asset on eqm.custrecord_scv_cmms_eq_asset = asset.id
                    join customrecord_scv_cmms_component cpn on cpn.id = eqm.custrecord_scv_cmms_eq_component
                    join customrecord_scv_cmms_maintenance_freq freq on freq.id = eqm.custrecord_scv_cmms_eq_maint_frequency
                    left join customrecord_scv_cmms_workitem wi on wi.id = eqm.custrecord_scv_cmms_eq_workitem
                where asset.custrecord_assetsubsidiary = ? ${strWhereAdd} order by cpn.custrecord_scv_cmms_co_sequencecode
            `;
            libRep.doSearchSqlAll(listData, sqlChiTietMay, params);
            return listData;
        }
        
        return {onRequest}
        
    });
