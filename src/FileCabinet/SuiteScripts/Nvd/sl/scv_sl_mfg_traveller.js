/**
 * =======================================================================================
 *  Date                Author                  Description
 *  18 Nov 2024		    Khanh Tran			    Init, create file. Màn hình phiếu giao việc và phiếu in liên quan from mr. Bính(https://app.clickup.com/t/86cx3591d)
 *  19 Dec 2024		    Hung Nguyen			    NVD - MFG - Mẫu in Phiếu yêu cầu sản xuất from Thao(https://app.clickup.com/t/86cxc6ehq)
 *  02 June 2025        Thanh Ngo               NVD - MFG - Update lấy dữ liệu phiếu yêu cầu sản xuất from Mr.Phuc Truong
 */
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/render', 'N/runtime', 'N/search', 'N/ui/serverWidget', 'N/url', 'N/redirect', 'N/query', 'N/task', 'N/cache', 'N/ui/message', 'N/file',
        '../lib/scv_lib_function.js',
        '../cons/scv_cons_search_wo_printing.js',
        '../cons/scv_cons_search_wo_printing_details.js',
        '../cons/scv_cons_search_wo_so_tksx.js',
        '../cons/scv_cons_location.js',
        '../cons/scv_cons_record.js',
        '../cons/scv_cons_subsidiary.js',
        '../common/scv_common_theo_doi_phieu_in',
        '../common/scv_common_pdf'
    ],
    /**
     * @param{record} record
     * @param{runtime} runtime
     * @param{search} search
     * @param{serverWidget} serverWidget
     * @param{url} url
     */
    (record, render, runtime, search, serverWidget, url, redirect, query, task, cache, message, file,
        lbf,
        constSearchWOPrint,
        constSearchWOPrintDtl,
        cSearchWoSoTksx,
        constLocation,
        constRecord,
        constSubsidiary,
        comPhieuIn,
        comPdf
    ) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const CUR_SCRIPT = {
            ID: 'customscript_scv_sl_mfg_traveller',
            DEPLOYID_UI: 'customdeploy_scv_sl_mfg_traveller',
            DEPLOYID_DATA: 'customdeploy_scv_sl_mfg_traveller_data'
        }

        const ProductLossCategory = {
            'PHOI_MAU': '303',
        }

        const ProductLossReason = {
            'KHAC': '20',
        }

        const onRequest = (scriptContext) => {
            let response = scriptContext.response;
            let request = scriptContext.request;
            let params = request.parameters;
            let curScript = runtime.getCurrentScript();
            let myCache = cache.getCache({
                name: 'crunMfgTraveller',
                scope: cache.Scope.PUBLIC
            });

            let mrTaskId = params.mrTaskId;
            if (!mrTaskId) {
                mrTaskId = myCache.get({key: 'mrTaskId', loader: 'loader'});
            }

            let messageInfo = '';
            if (lbf.isContainValue(mrTaskId)) {
                let taskStatus = task.checkStatus(mrTaskId);
                messageInfo = 'Update Work Order is: ' + taskStatus.status;
                if (taskStatus.status === 'COMPLETE' || taskStatus.status === 'FAILED') {
                    myCache.remove({key: 'mrTaskId'});
                }
            }

            if (curScript.deploymentId === CUR_SCRIPT.DEPLOYID_DATA) {
                let objResponse = {data: [], isSuccess: true, msg: ''};
                response.setHeader({name: 'Content-Type', value: 'application/json'});
                response.write(JSON.stringify(objResponse));
            } else {
                let arrSS_woPrint, arrSS_woPrintDtl;
                let arrTheoDoiPhieuIn = getDataTheoDoiPhieuIn();
                // thanhdev add 02/06/2025
                if(params.isExportYcsxPdf === 'T'){
                    let pdfFile = buildFilePdfYcsx(params);
                    // comPhieuIn.createPhieuTheoDoi4Suitelet(params.arrWoIds, 'Manufacturing Traveller', 'CUSTTMPL_SCV_YCSX_MT');
                    response.writeFile(pdfFile, true);
                }
                if(params.isExportPgvPdf === 'T'){
                    let pdfFile = buildFilePdfPgv(params);
                    // comPhieuIn.createPhieuTheoDoi4Suitelet(params.arrWoIds, 'Manufacturing Traveller', 'CUSTTMPL_SCV_PGV_MT');
                    response.writeFile(pdfFile, true);
                }
                if(params.isExportPgvPdf2 === 'T'){
                    let pdfFile = buildFilePdfPgv(params, true);
                    response.writeFile(pdfFile, true);
                }
                // -------------------- thanhdev end
                if(params.isSearch === 'T'){
                    arrSS_woPrint = getDataSS_woPrint(params);
                    arrSS_woPrintDtl = getDataSS_woPrintDtl(params);
                }
                // tạm thời không cần quan tâm
                // if (params.isgetdata === 'T') {
                //     function groupBy(array, keys) {
                //         return array.reduce((result, currentItem) => {
                //             // Generate a unique group key based on the specified keys
                //             const groupKey = keys.map(key => currentItem[key]).join('|');
                //             if (!result[groupKey]) {
                //                 result[groupKey] = [];
                //             }
                //             result[groupKey].push(currentItem);
                //             return result;
                //         }, {});
                //     }
                //
                //     const groupedData = groupBy(arrSS_woPrint, ['subsidiary', 'work_center', 'wo_type']);
                //     const groupedResult = Object.entries(groupedData).map(([key, lines]) => {
                //         const [subsidiary, work_center, wo_type] = key.split('|');
                //         return { subsidiary, work_center, wo_type, lines };
                //     });
                //     response.write(JSON.stringify({
                //         result: groupedResult,
                //     } || {}));
                //     return;
                // }
                // if (params.action === 'getUrlTemplate') {
                //     response.write(JSON.stringify({urlTemplate: getUrlFileTemplate()}));
                //     return;
                // }
                if (scriptContext.request.method === 'GET') {
                    let arrColWO = getColSlWO();
                    let arrColComponent = getColSlComponent();
                    let arrColTheoDoiPhieuIn = getColSlTheoDoiPhieuIn();
                    let slWorkorders_Name = arrSS_woPrint ? `Lệnh SX (${arrSS_woPrint.length})` : 'Lệnh SX';
                    let mainForm = onCreateFormUI(params, messageInfo, arrColWO, arrColComponent, arrColTheoDoiPhieuIn, slWorkorders_Name);
                    if(params.isSearch === 'T'){
                        if(!mrTaskId){
                            mainForm.form.addSubmitButton('Submit');
                        }

                        renderDataSublist(mainForm.slWorkorders, arrColWO, arrSS_woPrint);
                        renderDataSublist(mainForm.slComponents, arrColComponent, arrSS_woPrintDtl);
                        renderDataSublist(mainForm.slTheoDoiPhieuIn, arrColTheoDoiPhieuIn, arrTheoDoiPhieuIn);
                    }
                    response.writePage(mainForm.form);
                } else {
                    let sublistId = 'custpage_sl_workorders';
                    let lc = request.getLineCount({group: sublistId});
                    let prod_lot, vCheck, list_data = [];
                    for (let i = 0; i < lc; i++) {
                        vCheck = request.getSublistValue({group: sublistId, name: 'custpage_col_check', line: i});
                        if (vCheck === true || vCheck === 'T') {
                            wo_id = request.getSublistValue({group: sublistId, name: 'custpage_col_wo_id', line: i});
                            prod_lot = request.getSublistValue({
                                group: sublistId,
                                name: 'custpage_col_prod_lot',
                                line: i
                            });
                            list_data.push({id: wo_id, prod_lot: prod_lot});
                        }
                    }
                    let mrTaskId = '';
                    let mrTask = task.create({
                        taskType: task.TaskType.MAP_REDUCE,
                        scriptId: 'customscript_scv_mr_mfg_traveller',
                        deploymentId: 'customdeploy_scv_mr_mfg_traveller'
                    });
                    mrTask.params = {custscript_scv_mr_mfg_traveller: JSON.stringify(list_data)};
                    mrTaskId = mrTask.submit();
                    myCache.put({key: 'mrTaskId', value: mrTaskId});
                    let parametersToRedirect = copyParameters(params);
                    parametersToRedirect.mrTaskId = mrTaskId;
                    redirect.toSuitelet({
                        scriptId: CUR_SCRIPT.ID,
                        deploymentId: CUR_SCRIPT.DEPLOYID_UI,
                        parameters: parametersToRedirect
                    });
                }
            }
        }

        const copyParameters = (params) => {
            return {
                custpage_work_center: params.custpage_work_center.replaceAll('\u0005', ','),
                custpage_wo_type: params.custpage_wo_type.replaceAll('\u0005', ','),
                custpage_subsidiary: params.custpage_subsidiary,
                custpage_location: params.custpage_location,
                custpage_wo_fromdt: params.custpage_wo_fromdt,
                custpage_wo_todt: params.custpage_wo_todt,
                custpage_assembly: params.custpage_assembly,
            }
        }

        // tạm thời chưa dùng tới
        const getUrlFileTemplate = () => {
            let pathFile = '../xls/scv_xlsx_pgv_wo.xlsx';
            let fileLoad = file.load({id: pathFile});
            return fileLoad.url;
        }

        const renderDataSublist = (sl, arrColSl, arrData) => {
            arrData.forEach((objData, index) => {
                arrColSl.forEach(col => {
                    let val = objData[col.id];
                    if (val || val === 0) sl.setSublistValue({id: 'custpage_col_' + col.id, line: index, value: val});
                })
            })
        }

        const getDataSS_woPrintDtl = (params) => {
            let myFilters = [];
            if (params.custpage_subsidiary) {
                myFilters.push(
                    search.createFilter({
                        name: 'subsidiary', operator: 'anyof', values: params.custpage_subsidiary
                    })
                );
            }

            if (params.custpage_wo_fromdt) {
                myFilters.push(
                    search.createFilter({
                        name: 'trandate', operator: 'onorafter', values: params.custpage_wo_fromdt
                    })
                );
            }

            if (params.custpage_wo_todt) {
                myFilters.push(
                    search.createFilter({
                        name: 'trandate', operator: 'onorbefore', values: params.custpage_wo_todt
                    })
                );
            }

            if (params.custpage_assembly) {
                myFilters.push(
                    search.createFilter({
                        name: 'item', operator: 'anyof', values: params.custpage_assembly
                    })
                );
            }

            if (params.custpage_wo_type) {
                myFilters.push(
                    search.createFilter({
                        name: 'custbody_scv_work_order_type', operator: 'anyof', values: params.custpage_wo_type.split(',')
                    })
                );
            }

            if (params.custpage_location) {
                myFilters.push(
                    search.createFilter({
                        name: 'location', operator: 'anyof', values: params.custpage_location
                    })
                );
            }

            if (params.custpage_work_center) {
                myFilters.push(
                    search.createFilter({
                        name: 'custbody_mfgmob_workcenter', operator: 'anyof', values: params.custpage_work_center.split(',')
                    })
                );
            }

            if (params.custpage_so_tksx) {
                myFilters.push(
                    search.createFilter({
                        name: 'custbody_scv_so_thong_ke_sx',  operator: 'contains', values: params.custpage_so_tksx
                    })
                );
            }

            // thanhdev add filter 2/6/2024
            if(params.arrWoIds){
                let arrWoIds = params.arrWoIds.split(',');
                if (arrWoIds && arrWoIds.length > 0) {
                    myFilters.push(
                        search.createFilter({
                            name: 'internalid',  operator: 'anyof', values: arrWoIds
                        })
                    );
                }
                // thanhdev end
            }

            if (params.custpage_approve_fromdt) {
                myFilters.push(
                    search.createFilter({
                        name: 'custbody_scv_date_approve_wo',  operator: 'onorafter', values: params.custpage_approve_fromdt
                    })
                );
            }

            if (params.custpage_approve_todt) {
                myFilters.push(
                    search.createFilter({
                        name: 'custbody_scv_date_approve_wo',  operator: 'onorbefore', values: params.custpage_approve_todt
                    })
                );
            }
            if( params.custpage_status) {
                myFilters.push(
                    search.createFilter({
                        name: 'status', operator: 'anyof', values: params.custpage_status
                    })
                );
            }

            return constSearchWOPrintDtl.getDataSource(myFilters);
        }

        const getDataSS_woPrint = (params) => {
            let myFilters = [];
            if (params.custpage_subsidiary) {
                myFilters.push(
                    search.createFilter({
                        name: 'subsidiary', operator: 'anyof', values: params.custpage_subsidiary
                    })
                );
            }

            if (params.custpage_wo_fromdt) {
                myFilters.push(
                    search.createFilter({
                        name: 'trandate', operator: 'onorafter', values: params.custpage_wo_fromdt
                    })
                );
            }

            if (params.custpage_wo_todt) {
                myFilters.push(
                    search.createFilter({
                        name: 'trandate', operator: 'onorbefore', values: params.custpage_wo_todt
                    })
                );
            }

            if (params.custpage_assembly) {
                myFilters.push(
                    search.createFilter({
                        name: 'item', operator: 'anyof', values: params.custpage_assembly
                    })
                );
            }

            if (params.custpage_wo_type) {
                myFilters.push(
                    search.createFilter({
                        name: 'custbody_scv_work_order_type', operator: 'anyof', values: params.custpage_wo_type.split(',')
                    })
                );
            }

            if (params.custpage_location) {
                myFilters.push(
                    search.createFilter({
                        name: 'location', operator: 'anyof', values: params.custpage_location
                    })
                );
            }

            if (params.custpage_work_center) {
                myFilters.push(
                    search.createFilter({
                        name: 'custbody_mfgmob_workcenter',  operator: 'anyof', values: params.custpage_work_center.split(',')
                    })
                );
            }

            if (params.custpage_so_tksx) {
                myFilters.push(
                    search.createFilter({
                        name: 'custbody_scv_so_thong_ke_sx',  operator: 'contains', values: params.custpage_so_tksx
                    })
                );
            }

            // thanhdev add filter 2/6/2024
            if(params.arrWoIds){
                let arrWoIds = params.arrWoIds.split(',');
                if (arrWoIds && arrWoIds.length > 0) {
                    myFilters.push(
                        search.createFilter({
                            name: 'internalid',  operator: 'anyof', values: arrWoIds
                        })
                    );
                }
                // thanhdev end
            }

            if (params.custpage_approve_fromdt) {
                myFilters.push(
                    search.createFilter({
                        name: 'custbody_scv_date_approve_wo',  operator: 'onorafter', values: params.custpage_approve_fromdt
                    })
                );
            }

            if (params.custpage_approve_todt) {
                myFilters.push(
                    search.createFilter({
                        name: 'custbody_scv_date_approve_wo',  operator: 'onorbefore', values: params.custpage_approve_todt
                    })
                );
            }

            if(params.custpage_status) {
                myFilters.push(
                    search.createFilter({
                        name: 'status', operator: 'anyof', values: params.custpage_status
                    })
                );
            }

            return constSearchWOPrint.getDataSource(myFilters);
        }

        const onCreateFormUI = (params, messageInfo, arrColWO, arrColComponent, arrColTheoDoiPhieuIn, slWorkorders_Name) => {
            let mainForm = serverWidget.createForm({title: 'Manufacturing Traveller'});
            if (!!messageInfo) {
                mainForm.addPageInitMessage({type: message.Type.INFORMATION, message: messageInfo, duration: -1});
            }
            lbf.pinHeaderSublist(mainForm);
            mainForm.clientScriptModulePath = '../cs/scv_cs_sl_mfg_traveller.js';
            mainForm.addButton({id: 'custpage_btn_search', label: 'Tìm', functionName: 'onSearchResult()'});
            mainForm.addButton({id: 'custpage_scv_btn_print_ycsx_pdf', label: 'YCSX', functionName: 'onExportYCSXPdf()'});
            mainForm.addButton({id: 'custpage_scv_btn_print_pgv_pdf', label: 'PGV', functionName: 'onExportPGVPdf()'});
            mainForm.addButton({id: 'custpage_scv_btn_print_pgv_pdf', label: 'PGV 2.0', functionName: 'onExportPGVPdf2()'});
            let filterGrp = lbf.addFieldGroup(mainForm, 'fieldgrp_main', 'Filters');
            let tab_workorders = mainForm.addTab({id: 'tab_workorders', label: 'Lệnh SX'});
            let tab_components = mainForm.addTab({id: 'tab_components', label: 'Thành phần'});
            let tab_theodoiphieuin = mainForm.addTab({id: 'tab_theodoiphieuin', label: 'Theo dõi phiếu in'});

            let custpage_subsidiary = mainForm.addField({
                id: 'custpage_subsidiary', type: 'select', label: 'Công ty/Chi nhánh', container: filterGrp.id
            }).setHelpText('Công ty/Chi nhánh')
            custpage_subsidiary.isMandatory = true;

            let custpage_wo_fromdt = mainForm.addField({
                id: 'custpage_wo_fromdt', type: 'date', label: 'SX từ ngày', container: filterGrp.id
            }).setHelpText('SX từ ngày').updateLayoutType({layoutType: 'startrow'})

            let custpage_wo_todt = mainForm.addField({
                id: 'custpage_wo_todt', type: 'date', label: 'Đến ngày', container: filterGrp.id
            }).setHelpText('SX Đến ngày').updateLayoutType({layoutType: 'endrow'})

            let custpage_assembly = mainForm.addField({
                id: 'custpage_assembly', type: 'select', label: 'Thành phẩm', container: filterGrp.id
            }).setHelpText('Thành phẩm')

            let custpage_approve_fromdt = mainForm.addField({
                id: 'custpage_approve_fromdt', type: 'date', label: 'Duyệt từ ngày', container: filterGrp.id
            }).setHelpText('Duyệt từ ngày').updateLayoutType({layoutType: 'startrow'})

            let custpage_approve_todt = mainForm.addField({
                id: 'custpage_approve_todt', type: 'date', label: 'Duyệt đến ngày', container: filterGrp.id
            }).setHelpText('Duyệt đến ngày').updateLayoutType({layoutType: 'endrow'})

            let custpage_wo_type = mainForm.addField({
                id: 'custpage_wo_type',
                type: 'multiselect',
                label: 'Loại SX',
                source: 'customrecord_scv_work_order_type',
                container: filterGrp.id
            }).setHelpText('Loại SX').updateBreakType({breakType: 'STARTCOL'})

            let custpage_location = mainForm.addField({
                id: 'custpage_location', type: 'select', label: 'Kho', container: filterGrp.id
            }).setHelpText('Kho')
            custpage_location.isMandatory = true;

            let custpage_status = mainForm.addField({
                id: 'custpage_status', type: 'select', label: 'Trạng thái', source: 'transactionstatus',container: filterGrp.id
            }).setHelpText('Status');
            custpage_status.addSelectOption({value: '', text : ''});
            custpage_status.addSelectOption({value: 'WorkOrd:D', text: 'In Process'});
            custpage_status.addSelectOption({value: 'WorkOrd:B', text: 'Released'});

            let custpage_work_center = mainForm.addField({
                id: 'custpage_work_center', type: 'multiselect', label: 'Máy', container: filterGrp.id
            }).setHelpText('Máy').updateBreakType({breakType: 'STARTCOL'})
            custpage_work_center.isMandatory = true;

            let custpage_so_tksx = mainForm.addField({
                id: 'custpage_so_tksx', type: 'text', label: 'Số thống kê sản xuất', container: filterGrp.id
            }).setHelpText('Số thống kê sản xuất')

            constSubsidiary.initLoadFieldSubsidiaryByUserRole(custpage_subsidiary);
            onLoadLocationBySub(custpage_location, params.custpage_subsidiary)
            onLoadWoCenterByLocation(custpage_work_center, params.custpage_location);
            onLoadItemAssembly(custpage_assembly);
            if (params.custpage_work_center) custpage_work_center.defaultValue = params.custpage_work_center.split(',')
            if (params.custpage_wo_type) custpage_wo_type.defaultValue = params.custpage_wo_type.split(',')

            custpage_subsidiary.defaultValue = params.custpage_subsidiary;
            custpage_location.defaultValue = params.custpage_location;
            custpage_wo_fromdt.defaultValue = params.custpage_wo_fromdt;
            custpage_wo_todt.defaultValue = params.custpage_wo_todt;
            custpage_assembly.defaultValue = params.custpage_assembly;
            custpage_approve_fromdt.defaultValue = params.custpage_approve_fromdt;
            custpage_approve_todt.defaultValue = params.custpage_approve_todt;
            custpage_so_tksx.defaultValue = params.custpage_so_tksx;
            custpage_status.defaultValue = params.custpage_status;
            let slWorkorders = mainForm.addSublist({
                id: 'custpage_sl_workorders',
                type: 'list',
                label: slWorkorders_Name,
                tab: tab_workorders.id
            });
            let slComponents = mainForm.addSublist({
                id: 'custpage_sl_components',
                type: 'list',
                label: 'Thành phần',
                tab: tab_components.id
            });

            let slTheoDoiPhieuIn = mainForm.addSublist({
                id: 'custpage_sl_theo_doi_phieu_in',
                type: 'list',
                label: 'Theo dõi phiếu in',
                tab: tab_theodoiphieuin.id
            });

            slWorkorders.addMarkAllButtons();
            onCreateSublistColumn(slWorkorders, arrColWO);
            onCreateSublistColumn(slComponents, arrColComponent);
            onCreateSublistColumn(slTheoDoiPhieuIn, arrColTheoDoiPhieuIn);
            return {
                form: mainForm,
                slWorkorders: slWorkorders,
                slComponents: slComponents,
                slTheoDoiPhieuIn : slTheoDoiPhieuIn
            };
        }

        const onLoadItemAssembly = (assembly_field) => {
            let arrResult = [];
            let assemblyitemSearchObj = search.create({
                type: 'assemblyitem',
                filters: [
                    ["type", "anyof", "Assembly"]
                ],
                columns: [
                    search.createColumn({name: "itemid", label: "Tên"})
                ]
            });
            assemblyitemSearchObj = assemblyitemSearchObj.run().getRange(0, 1000);
            for (let objSearch of assemblyitemSearchObj) {
                let objRes = {
                    id: objSearch.id,
                    name: objSearch.getValue("itemid"),
                };
                arrResult.push(objRes);
            }

            assembly_field.addSelectOption({value: '', text: ''});
            for (let obj of arrResult) {
                assembly_field.addSelectOption({value: obj.id, text: obj.name});
            }
        }

        const onLoadWoCenterByLocation = (wo_center_field, locationsId) => {
            let result = [];
            if(locationsId) result = constLocation.getEntityGroupById(locationsId);

            constRecord.initLoadFieldServer(wo_center_field, {
                displayExpr: "groupname", valueExpr: "id", data: result
            }, true)
        }

        const onLoadLocationBySub = (location_field, subsidiary) => {
            let sql = `
                SELECT location.id, location.name, LocationSubsidiaryMap.subsidiary, location.custrecord_scv_loc_type 
                FROM location
                JOIN LocationSubsidiaryMap 
                ON location.id = LocationSubsidiaryMap.location
                WHERE isinactive = 'F' and location.custrecord_scv_loc_type = 1`;
            if (subsidiary) sql += ` AND LocationSubsidiaryMap.subsidiary IN (${subsidiary})`;

            let resultSQL = query.runSuiteQL({query: sql});
            let resultQuery = resultSQL.asMappedResults();
            location_field.addSelectOption({value: '', text: ''});
            for (let obj of resultQuery) {
                location_field.addSelectOption({value: obj.id, text: obj.name});
            }
        }

        const onCreateSublistColumn = (sl, arrColumn) => {
            for (let col of arrColumn) {
                if (['amt'].includes(col.id)) {
                    sl.addField({
                        id: 'custpage_col_' + col.id,
                        type: col.type,
                        label: col.label,
                        source: col.source || []
                    })
                        .updateDisplayType({displayType: col.displayType || 'inline'})
                        .updateDisplayType({displayType: 'disabled'});
                } else {
                    sl.addField({
                        id: 'custpage_col_' + col.id,
                        type: col.type,
                        label: col.label,
                        source: col.source || []
                    })
                        .updateDisplayType({displayType: col.displayType || 'inline'})
                }
            }

        }

        const getColSlTheoDoiPhieuIn = () => {
            return [
                {id: 'custrecord_scv_print_tran', label: 'Wo', type: 'text'},
                {id: 'custrecord_scv_print_template', label: 'Mẫu in', type: 'text'},
                {id: 'custrecord_scv_print_times_count', label: 'Lần in thứ', type: 'text'},
                {id: 'custrecord_scv_print_time', label: 'Thời gian in', type: 'text'},
                //{id: 'custrecord_scv_print_person', label: 'Người in', type: 'text'},
                {id: 'custrecord_scv_suitelet_name', label: 'Tên màn hình', type: 'text'},
                {id: 'custrecord_scv_print_person_legal_name', label: 'Tên người in', type: 'text'},
            ]
        }

        const getColSlComponent = () => {
            return [
                {id: 'wo_name', label: 'Số Lệnh SX', type: 'text'},
                {id: 'so_source', label: 'Đơn bán', type: 'text'},
                {id: 'item', label: 'Item', type: 'text'},
                {id: 'prod_lot', label: 'Số lô', type: 'text'},
                {id: 'qc_serial', label: 'Số QC Serial', type: 'textarea'},
                {id: 'qty', label: 'Số lượng', type: 'float'},
                {id: 'units', label: 'ĐVT', type: 'text'},
                {id: 'wo_type', label: 'Loại lệnh SX', type: 'text'},
                {id: 'date', label: 'Ngày', type: 'text'},
                {id: 'status', label: 'Trạng thái', type: 'text'},
                {id: 'subsidiary', label: 'Công ty/Chi nhánh', type: 'text'},
            ]
        }

        const getColSlWO = () => {
            return [
                {id: 'check', label: 'Chọn', type: 'checkbox', displayType: 'entry'},
                {id: 'priority', label: 'Ưu tiên', type: 'text'},
                {id: 'wo_name', label: 'Số lệnh sx', type: 'text'},
                {id: 'so_source', label: 'Đơn bán', type: 'text'},
                {id: 'assembly', label: 'Thành phẩm ', type: 'text'},
                {id: 'prod_lot', label: 'Số lô', type: 'text'},
                {id: 'so_tksx', label: 'Số thống kê sản xuất', type: 'text'},
                {id: 'qc_serial', label: 'Số QC Serial', type: 'textarea'},
                {id: 'qty', label: 'Số lượng', type: 'float'},
                {id: 'units', label: 'ĐVT', type: 'text'},
                {id: 'qty_da_sx', label: 'Số lượng đã SX', type: 'float'},
                {id: 'qty_reamin', label: 'Số lượng còn lại', type: 'float'},
                {id: 'wo_type', label: 'Loại lệnh sx', type: 'text'},
                {id: 'date', label: 'Ngày', type: 'text'},
                {id: 'status', label: 'Trạng thái', type: 'text'},
                {id: 'memo_one', label: 'Ghi chú 01', type: 'textarea'},
                {id: 'memo_two', label: 'Ghi chú 02', type: 'textarea'},
                {id: 'thong_tin_in', label: 'Người in phiếu', type: 'text'},
                {id: 'nguoi_duyet', label: 'Người duyệt', type: 'text'},
                {id: 'thoi_gian_phe_duyet', label: 'Thời gian duyệt', type: 'text'},
                {id: 'subsidiary', label: 'Công ty/Chi nhánh', type: 'text'},
                {id: 'work_center', label: 'Tổ đội', type: 'text'},
                {id: 'wo_id', label: 'Mã lệnh sx', type: 'text', displayType: 'hidden'},
            ]
        }

        const getDataTheoDoiPhieuIn = () => {
            let queryGetDataIn =
                `SELECT p.custrecord_scv_print_times_count,
                        p.custrecord_scv_suitelet_name,
                        p.custrecord_scv_print_template,
                        p.custrecord_scv_print_time,
                        p.custrecord_scv_print_person,
                        p.custrecord_scv_print_person_legal_name,
                        t.trandisplayname as custrecord_scv_print_tran
                 FROM customrecord_scv_print_check AS p
                      JOIN transaction AS t ON p.custrecord_scv_print_tran = t.id
                 WHERE p.custrecord_scv_suitelet_name = 'Manufacturing Traveller'
                   AND p.custrecord_scv_print_template IN ('CUSTTMPL_SCV_YCSX_MT', 'CUSTTMPL_SCV_PGV_MT')
                 ORDER BY p.custrecord_scv_print_tran ASC, p.custrecord_scv_print_template asc , p.custrecord_scv_print_time ASC
                `;

            return query.runSuiteQL({query: queryGetDataIn}).asMappedResults();
        }

        const buildFilePdfYcsx = (params) => {
            let arrSS_woPrint = getDataSS_woPrint(params);
            log.error('arrSS_woPrint', JSON.stringify(arrSS_woPrint));
            let trangThai = arrSS_woPrint.map(item => item.status).filter((v, i, a) => a.indexOf(v) === i).join(', ');
            let objRender = comPdf.initTemplateRender('CUSTTMPL_SCV_YCSX_MT');
            comPdf.addFontVietnamese(objRender);

            objRender.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'data',
                data: {
                    items: arrSS_woPrint,
                    legalname: constSubsidiary.getInfoSubsidiaryById(params.custpage_subsidiary)[0].legalname,
                    fromdate: params.custpage_wo_fromdt,
                    todate: params.custpage_wo_todt,
                    trangthai: trangThai
                }
            })

            return objRender.renderAsPdf();
        }

        const buildFilePdfPgv = (params, isVer2 = false) => {
            let objRender = comPdf.initTemplateRender('CUSTTMPL_SCV_PGV_MT');
            comPdf.addFontVietnamese(objRender);
            let arrSSWoPrint = getDataSS_woPrint(params);
            arrSSWoPrint = arrSSWoPrint.sort((a, b) =>
                // parseFloat(a.priority) - parseFloat(b.priority) ||
                parseFloat(a.so_tksx) - parseFloat(b.so_tksx) ||
                parseFloat(b.chieu_dai) - parseFloat(a.chieu_dai));

            let arrSSWoPrintDtl = getDataSS_woPrintDtl(params);
            // let result = groupResultByCriteria(arrSSWoPrint, arrSSWoPrintDtl);
            // nhìn lởm, check sau
            let altResult = groupHeaderAndDetail(arrSSWoPrint, arrSSWoPrintDtl);
            let objChanKy = getLatestItemDetails(altResult);

            let groupLoaiSx = [...new Set(altResult.map(s=> s.wo_type))].join(', ');
            let groupLoaiMay = [...new Set(altResult.map(s=> s.work_center))].join(', ');
            let groupCongTy = [...new Set(altResult.map(s=> s.subsidiary))].join(', ');
            let groupTtsx = getTtsx(params);
            let empName = getCurrentEmployeeName();

            objRender.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'customData',
                data: {
                    items: altResult,
                    itemsLength : altResult.length,
                    empName: empName,
                    congTy : groupCongTy,
                    loaiSx: groupLoaiSx,
                    may: groupLoaiMay,
                    ttsx:  groupTtsx,
                    isVer2 : isVer2 === true ? 'T' : 'F',
                    objChanKy
                }
            });

            return objRender.renderAsPdf();
        }

        const getLatestItemDetails = (items) => {
            if (!items || items.length === 0) return null;

            let latestItem = [...items].sort((a, b) => {
                const parseDate = str => {
                    const [date, time] = str.split(' ');
                    const [day, month, year] = date.split('/').map(Number);
                    const [hour, minute] = time.split(':').map(Number);
                    return new Date(year, month - 1, day, hour, minute);
                };

                return parseDate(b.last_modified) - parseDate(a.last_modified);
            });

            return {
                nguoi_duyet: latestItem[0].nguoi_duyet ,
                thong_tin_in: latestItem[0].thong_tin_in ,
                thoi_gian_phe_duyet: latestItem[0].thoi_gian_phe_duyet ,
                nguoi_kiem_soat: latestItem[0].nguoi_kiem_soat ,
                thoi_gian_kiem_soat: latestItem[0].thoi_gian_kiem_soat
            };
        };

        const getTtsx = (params) => {
            let myFilters = [];
            if (params.custpage_location) {
                myFilters.push(
                    search.createFilter({
                        name: 'location', operator: 'anyof', values: params.custpage_location
                    })
                );
            }

            if (params.custpage_work_center) {
                myFilters.push(
                    search.createFilter({
                        name: 'custbody_mfgmob_workcenter',  operator: 'anyof', values: params.custpage_work_center.split(',')
                    })
                );
            }

            if (params.custpage_status) {
                myFilters.push(
                    search.createFilter({
                        name: 'status', operator: 'anyof', values: params.custpage_status
                    })
                );
            }

            let a = cSearchWoSoTksx.getDataSource(myFilters);
            if (a.length === 0) return '';
            return [...new Set(a.map(s => s.so_thong_ke_sx))].join(', ');
        }

        const groupResultByCriteria = (arrSSWoPrint, arrSSWoPrintDtl) => {
            let groupedData = groupBy(arrSSWoPrint, arrSSWoPrintDtl, ['subsidiary', 'work_center', 'wo_type']);
            for (let key in groupedData) {
                let [subsidiary, work_center, wo_type] = groupedData[key].key.split('|');
                groupedData[key].subsidiary = subsidiary;
                groupedData[key].work_center = work_center;
                groupedData[key].wo_type = wo_type;
            }
            return groupedData;
        }

        const groupHeaderAndDetail = (arrSSWoPrint, arrSSWoPrintDtl) => {
            let arrResult = [];
            // for (let currentItem of arrSSWoPrint) {
            arrSSWoPrint.forEach( currentItem =>    {
                currentItem.arrItem = joinItemsByWorkOrder(currentItem.wo_name, arrSSWoPrintDtl);
                if(currentItem.memo_one && currentItem.memo_two) {
                    currentItem.memo_one = `${currentItem.memo_one}, ${currentItem.memo_two}`;
                }else if(currentItem.memo_two) {
                    currentItem.memo_one = currentItem.memo_two;
                }

                arrResult.push(currentItem);

                let arrWoByProducts = getWoByProductsOfWorkOrder(currentItem.wo_id);
                currentItem.rowspan = arrWoByProducts.length + 1;
                if (arrWoByProducts.length > 0) {
                    for (let i = 0; i < arrWoByProducts.length; i++) {
                        let phePham = {...currentItem};
                        phePham.tolerance_min_quantity = '';
                        phePham.tolerance_max_quantity = '';
                        phePham.tolerance_min_percent = '';
                        phePham.tolerance_max_percent = '';
                        phePham.displayname = arrWoByProducts[i].custrecord_scv_by_prod_item_display;
                        phePham.qty = arrWoByProducts[i].custrecord_scv_by_product_qty;
                        phePham.memo_one = arrWoByProducts[i].custrecord_scv_by_prod_loss_category_display;
                        phePham.units = arrWoByProducts[i].units;
                        phePham.rowspan = 0;
                        arrResult.push(phePham);
                    }
                }
            })
            return arrResult;
        }

        const groupBy = (arrSSWoPrint, arrSSWoPrintDtl, keys) => {
            let groupedObject = {};
            for (let currentItem of arrSSWoPrint) {
                const groupKey = keys.map(key => currentItem[key]).join('|');
                if (!groupedObject[groupKey]) {
                    groupedObject[groupKey] = [];
                }
                currentItem.arrItem = joinItemsByWorkOrder(currentItem.wo_name, arrSSWoPrintDtl);
                if(currentItem.memo_one && currentItem.memo_two) {
                    currentItem.memo_one = `${currentItem.memo_one}, ${currentItem.memo_two}`;
                }else if(currentItem.memo_two) {
                    currentItem.memo_one = currentItem.memo_two;
                }

                groupedObject[groupKey].push(currentItem);
                let arrWoByProducts = getWoByProductsOfWorkOrder(currentItem.wo_id);
                currentItem.rowspan = arrWoByProducts.length + 1;
                if (arrWoByProducts.length > 0) {
                    for (let i = 0; i < arrWoByProducts.length; i++) {
                        let phePham = {...currentItem};
                        phePham.displayname = arrWoByProducts[i].custrecord_scv_by_prod_item_display;
                        phePham.qty = arrWoByProducts[i].custrecord_scv_by_product_qty;
                        phePham.memo_one = arrWoByProducts[i].custrecord_scv_by_prod_loss_category_display;
                        phePham.units = arrWoByProducts[i].units;
                        phePham.rowspan = 0;
                        groupedObject[groupKey].push(phePham);
                    }
                }
            }
            return Object.entries(groupedObject).map(([key, value]) => ({key, value}));
        }

        const joinItemsByWorkOrder = (woName, arrSSWoPrintDtl) => {
            let arrItem = [];
            let stt = 1;


            for (let i = 0; i < arrSSWoPrintDtl.length; i++) {
                let textLot = '';
                if (arrSSWoPrintDtl[i].wo_name === woName) {
                    if(arrSSWoPrintDtl[i].lot) {
                        let lot = arrSSWoPrintDtl[i].lot ? ` - ${arrSSWoPrintDtl[i].lot}` : '';
                        let lotStatus = arrSSWoPrintDtl[i].lot_status ? ` (${arrSSWoPrintDtl[i].lot_status})` : '';
                        textLot = `${lot}${lotStatus}`;
                    }
                    if(arrSSWoPrintDtl[i].qc_serial) {
                        arrItem.push(`${stt++}. ${arrSSWoPrintDtl[i].displayname} - ${arrSSWoPrintDtl[i].qc_serial}${textLot}`);
                    }else{
                        arrItem.push(`${stt++}. ${arrSSWoPrintDtl[i].displayname}${textLot}`);
                    }
                }
            }
            return arrItem.join('<br/>');
        }

        const getWoByProductsOfWorkOrder = (idWorkOrder) => {
            let recWorkOrder = record.load({
                type: 'workorder',
                id: idWorkOrder
            })

            let itemLines = recWorkOrder.getLineCount('recmachcustrecord_scv_by_product_wo');
            let arrItem = [];

            for (let i = 0; i < itemLines; i++) {

                let lossCategory = recWorkOrder.getSublistValue('recmachcustrecord_scv_by_product_wo', 'custrecord_scv_by_prod_loss_category', i);
                let lossReason = recWorkOrder.getSublistValue('recmachcustrecord_scv_by_product_wo', 'custrecord_scv_by_prod_loss_reason', i);

                if (lossCategory === ProductLossCategory.PHOI_MAU && lossReason === ProductLossReason.KHAC) {
                    let assemblyItemId = recWorkOrder.getSublistValue('recmachcustrecord_scv_by_product_wo', 'custrecord_scv_by_product_assembly_item', i);
                    let itemLength = assemblyItemId ? search.lookupFields({
                        type: 'item',
                        id: assemblyItemId,
                        columns: ['custitem_scv_length']
                    }).custitem_scv_length : '';

                    let item = {
                        custrecord_scv_by_prod_item_display: recWorkOrder.getSublistValue('recmachcustrecord_scv_by_product_wo', 'custrecord_scv_by_prod_item_display', i)
                            .substring(recWorkOrder.getSublistValue('recmachcustrecord_scv_by_product_wo', 'custrecord_scv_by_prod_item_display', i).indexOf('_') + 1),
                        units : recWorkOrder.getSublistValue('recmachcustrecord_scv_by_product_wo', 'custrecord_scv_uom_display', i),
                        custrecord_scv_by_prod_loss_category_display: recWorkOrder.getSublistValue('recmachcustrecord_scv_by_product_wo', 'custrecord_scv_by_prod_loss_category_display', i),
                        unit: search.lookupFields({
                            type: 'item',
                            id: recWorkOrder.getSublistValue('recmachcustrecord_scv_by_product_wo', 'custrecord_scv_by_prod_item', i),
                            columns: ['unitstype']
                        }),
                        custrecord_scv_by_product_qty: recWorkOrder.getSublistValue('recmachcustrecord_scv_by_product_wo', 'custrecord_scv_by_product_qty', i),
                        chieu_dai: parseFloat(itemLength) || 0,
                    };
                    arrItem.push(item);
                }
            }

            arrItem.sort((a, b) => b.chieu_dai - a.chieu_dai);

            return arrItem;
        }

        const getCurrentEmployeeName = () => {
            let empName = '';
            let empUser = runtime.getCurrentUser().id;
            if (empUser) {
                let lkFEmp = search.lookupFields({
                    type: 'employee',
                    id: empUser,
                    columns: ['firstname']
                });
                empName = lkFEmp.firstname;
            }
            return empName;
        }

        return {onRequest}

    });
