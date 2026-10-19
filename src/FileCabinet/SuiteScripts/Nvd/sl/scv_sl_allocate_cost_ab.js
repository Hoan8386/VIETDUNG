/**
 * Nội dung:
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  23 Sep 2025         Khanh Tran			    Init, create file. Phát triển chức năng phân bổ chi phí sản xuất gia công kỹ thuật, form mr.Phúc(https://app.clickup.com/t/86d0pypjy)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/task', 'N/format', 'N/runtime', 'N/search', 'N/redirect', 'N/cache',
    '../lib/scv_lib_function.js',

    '../cons/scv_cons_form.js',
    '../cons/scv_cons_subsidiary.js',

    '../cons/scv_cons_search_allocate_cost_for_ab.js',
    '../cons/scv_cons_search_ab_summary_by_wo.js',
],
    /**
 * @param{task} task
 */
    (task, format, runtime, search, redirect, cache,
        lbf,

        constForm,
        constSubsidiary,

        cSearchAllocateCostForAb,
        cSearchAbSummaryByWo
    ) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */

        const curScript = {
            ID: 'customscript_scv_sl_allocate_cost_ab',
            DEPLOYID_UI: 'customdeploy_scv_sl_allocate_cost_ab'
        }

        const onRequest = (scriptContext) => {
            constForm.setContext(scriptContext);

            let request = scriptContext.request;
            let params = request.parameters;
            let myCache = cache.getCache({ name: 'scv_mr_allocate_cost_ab' });
            let mrTaskId = params.mrTaskId ? myCache.get({key: 'mrTaskId'}) : '';

            if (request.method == 'GET') {
                onCreateFormUI(params);

                if (mrTaskId) {
                    let taskStatus = task.checkStatus(mrTaskId).status;

                    if (taskStatus === 'COMPLETE' || taskStatus === 'FAILED'){
                        myCache.remove({key: 'mrTaskId'});
                    }

                    constForm.addPageInitMessage({type: 'information', message: 'Job is: ' + taskStatus, duration: -1});
                }

                constForm.writePage();

            } else {
                let parametersToRedirect = {
                    custpage_subsidiary: params.custpage_subsidiary,
                    custpage_kypb: params.custpage_kypb
                };

                let arrResult = getDataSlResult(request);

                let mrTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: 'customscript_scv_mr_allocate_cost_ab',
                    deploymentId: 'customdeploy_scv_mr_allocate_cost_ab'
                });

                mrTask.params = {custscript_scv_mr_allocate_cost_ab: JSON.stringify(arrResult)};

                mrTaskId = mrTask.submit();

                myCache.put({key: 'mrTaskId', value: mrTaskId});

                parametersToRedirect.mrTaskId = mrTaskId;

                redirect.toSuitelet({
                    scriptId: curScript.ID,
                    deploymentId: curScript.DEPLOYID_UI,
                    parameters: parametersToRedirect
                });
            }
        }

        const getDataSlResult = (request) => {
            let sublistId = 'custpage_sl_result';
            let arrResult = [], arrSl = [];

            for(let i = 0; i < request.getLineCount(sublistId); i++){
                let json_data = request.getSublistValue(sublistId, 'custpage_col_json_data', i);
                let objLine = {...JSON.parse(json_data)};

                arrSl.push({
                    ab_internalid: objLine.ab_internalid,
                    item_internalid: objLine.item_internalid,
                    amount: objLine.amount*1
                })
            }

            arrResult = lbf.onGroupByArray(arrSl, ['ab_internalid']);
            arrResult.forEach(obj => {
                obj.component = arrSl.filter(e => e.ab_internalid == obj.ab_internalid);
            })
            
            return arrResult;
        }

        const onCreateFormUI = (params) => {
            constForm.createForm('Phân bổ chi phí gia công kỹ thuật', '../cssl/scv_cs_sl_allocate_cost_ab.js');

            constForm.addPageLink([
                cSearchAllocateCostForAb.ID, cSearchAbSummaryByWo.ID
            ]);

            constForm.addButton({id: 'custpage_btn_search', label: 'Search', functionName: 'onSearchResult()'});

            let mainGrp = constForm.addFieldGroup({id: 'fieldgrp_main', label: 'Criteria'});

            let curUser = runtime.getCurrentUser();

            if(!('custpage_subsidiary' in params)){
                params.custpage_subsidiary = curUser.subsidiary;
            }

            constForm.addField({
                id: 'custpage_subsidiary', label: 'Công ty/Chi nhánh', container: mainGrp.id,
                type: 'select'
            }, true, {
                lookup: {
                    data: constSubsidiary.getDataSubsidiaryByUserRole(),
                    displayExpr: 'name', valueExpr: 'id'
                },
                defaultValue: params.custpage_subsidiary
            });
            
            constForm.addField({
                id: 'custpage_fromdt', label: 'Từ ngày', type: 'date', container: mainGrp.id
            }, true, {
                layoutType: 'startrow',
                defaultValue: params.custpage_fromdt
            });
            
            constForm.addField({
                id: 'custpage_todt', label: 'Đến ngày', type: 'date', container: mainGrp.id
            }, true, {
                layoutType: 'endrow',
                defaultValue: params.custpage_todt
            });
            
            constForm.addField({
                id: 'custpage_phieuht', label: 'Phiếu hoàn thành', type: 'text', container: mainGrp.id
            }, false, {
                defaultValue: params.custpage_phieuht
            });

            constForm.addSublist({
                id: 'custpage_sl_result',
                type: 'list',
                label: 'Results'
            });

            constForm.addFieldOfSublist('custpage_sl_result', [
                {id: 'custpage_col_stt', label: 'STT', type: 'float'},
                {id: 'custpage_col_account', label: 'Tài khoản', type: 'text'},
                {id: 'custpage_col_amt', label: 'Giá trị', type: 'float'},
                {id: 'custpage_col_cost_group', label: 'Nhóm chi phí sản xuất', type: 'text'},
                {id: 'custpage_col_wo_number', label: 'Lệnh sản xuất', type: 'text'},
                {id: 'custpage_col_ab_number', label: 'Phiếu thống kê', type: 'text'},
                {id: 'custpage_col_gtpb', label: 'Giá trị đã phân bổ', type: 'float'},
                {id: 'custpage_col_chenhlech', label: 'Chênh lệch', type: 'float'},
                {id: 'custpage_col_json_data', label: 'JSON DATA', type: 'textarea', displayType: 'hidden'},
            ]);

            if (params.isSearch === 'T') {
                let arrResult = getDataSource(params);

                constForm.setDataOfSublist('custpage_sl_result', arrResult);

                if (arrResult.length > 0) constForm.addSubmitButton({label: 'Submit'});
            }
        }

        const getDataSource = (params) => {
            let arrResult = [];
            let arrAllocateCostForAbSS01 = getDataAllocateCostForAb(params);
            let arrAbSummaryByWoSS02 = getDataAbSummaryByWo(params);

            arrAbSummaryByWoSS02.forEach((objSS02, index) => {
                let objSS01 = arrAllocateCostForAbSS01.find(e => e.key_mapping == objSS02.key_mapping) || {
                    amount: 0
                };
                let chenhlech = (objSS01.amount * 1) - (objSS02.ab_amount * 1);
                if (chenhlech * 1 === 0) return;

                let json_data = JSON.stringify({
                    ...objSS02,
                    amount: objSS01.amount * 1
                });
                let objRes = {
                    custpage_col_account: objSS02.account_display,
                    custpage_col_amt: objSS01.amount * 1,
                    custpage_col_cost_group: objSS02.cost_group_name,
                    custpage_col_wo_number: objSS02.wo_number,
                    custpage_col_ab_number: objSS02.ab_number,
                    custpage_col_gtpb: objSS02.ab_amount * 1,
                    custpage_col_chenhlech: chenhlech,
                    custpage_col_json_data: json_data
                };

                arrResult.push(objRes);
            })

            arrResult.sort((a, b) => {
                if (a.custpage_col_wo_number !== b.custpage_col_wo_number) {
                    return (a.custpage_col_wo_number || '').localeCompare(b.custpage_col_wo_number || '');
                }
                
                return (a.custpage_col_cost_group || '').localeCompare(b.custpage_col_cost_group || '');
            });

            arrResult.forEach((obj, idx) => {
                obj.custpage_col_stt = idx + 1;
            });

            return arrResult;
        }

        const getDataAllocateCostForAb = (params) => {
            let arrFilter = [];

            if (params.custpage_subsidiary) {
                arrFilter.push(search.createFilter({
                    name: 'subsidiary', operator: 'anyof', values: params.custpage_subsidiary
                }));
            }

            return cSearchAllocateCostForAb.getDataSource(arrFilter, params);
        }

        const getDataAbSummaryByWo = (params) => {
            let arrFilter = [];

            if (params.custpage_subsidiary) {
                arrFilter.push(search.createFilter({
                    name: 'subsidiary', operator: 'anyof', values: params.custpage_subsidiary
                }));
            }

            if (params.custpage_fromdt) {
                arrFilter.push(search.createFilter({
                    name: 'trandate',
                    operator: 'onorafter',
                    values: params.custpage_fromdt
                }));
            }

            if (params.custpage_todt) {
                arrFilter.push(search.createFilter({
                    name: 'trandate',
                    operator: 'onorbefore',
                    values: params.custpage_todt
                }));
            }

            if (params.custpage_phieuht) {
                arrFilter.push(search.createFilter({
                    name: 'tranid',
                    operator: 'contains',
                    values: params.custpage_phieuht
                }));
            }

            return cSearchAbSummaryByWo.getDataSource(arrFilter, params);
        }

        return {onRequest}

    });
