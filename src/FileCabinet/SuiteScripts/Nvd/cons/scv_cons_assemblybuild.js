/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  22 Nov 2024         Huy Pham                Init, create file, Tính toán phân bổ trọng lượng nâng hạ trong sản xuất, from mr.Bính(https://app.clickup.com/t/86cx40ye7)
 *  05 Feb 2025         Huy Pham			    Thống kê tiêu hao hàng loạt: createAssemblyByWorkOrder, from mr.Bính(https://app.clickup.com/t/86cxwt5k9)
 *  17 Mar 2025         Huy Pham                Thống kê tiêu hao hàng loạt: createAssemblyByWorkOrder - Bổ sung field mapping (user create + shift mobile), from mr.Việt(https://app.clickup.com/t/86cxwt5k9?comment=90160098112235)
 */
define(['N/record', 
    '../cons/scv_cons_search.js',
    '../cons/scv_cons_format.js'
],
    function(record, 
        constSearch,
        constFormat
    ) {
        const TYPE = "assemblybuild";
        const FIELD = {
            ID: "id",
            INACTIVE: "isinactive",
            NAME: "name"
        }
    
        const SUBLIST = {
            COMPONENT: {
                ID: "component",
                TYPE : "transactionline",
                FIELD: {}
            },
        }
    
        const RECORDS = {
        }

        const getDataSource = (_filters) => {
            let resultSearch =  constSearch.createSearchWithFilter({
                type: "assemblybuild",
                filters:
                [
                    
                ],
                columns:
                [
                    "internalid",
                    "tranid", "subsidiary"
                ]
            }, _filters);
            
            let arrResult = constSearch.fetchResultSearchRunEach(resultSearch, function(_objTmpl, _column){
                let objResTmpl = constSearch.getObjResultFromSearchByKey(_objTmpl, _column, [
                    "internalid",
                    "tranid", "subsidiary"
                ]);

                return objResTmpl;
            });
            
            return arrResult;
        }

        const allocateComponent = (_asbRecId, _arrLineComponent) =>{
            let asbRec = record.load({type: "assemblybuild", id: _asbRecId, isDynamic: true});

            let componentSublistId = SUBLIST.COMPONENT.ID;
            let inventoryAssignmentSulistId = 'inventoryassignment';

            let sizeComponentSublist = asbRec.getLineCount(componentSublistId);

            for(let i = 0; i < sizeComponentSublist; i++){
                let linenumber = asbRec.getSublistValue(componentSublistId, "linenumber", i);

                let objLine_find = _arrLineComponent.find(e => e.linenumber == linenumber);
                if(!objLine_find) continue;

                asbRec.selectLine(componentSublistId, i);

                asbRec.setCurrentSublistValue(componentSublistId, "quantity", objLine_find.quantity);

                let inventoryDetailRec = asbRec.getCurrentSublistSubrecord(componentSublistId, "componentinventorydetail");
                let sizeInventoryDetail = inventoryDetailRec.getLineCount(inventoryAssignmentSulistId);
                for(let j = 0; j < sizeInventoryDetail; j++){
                    let lotno = inventoryDetailRec.getSublistValue(inventoryAssignmentSulistId, "issueinventorynumber", j);
                    if(lotno != objLine_find.inventorynumber) continue;

                    inventoryDetailRec.selectLine(inventoryAssignmentSulistId, j);

                    inventoryDetailRec.setCurrentSublistValue(inventoryAssignmentSulistId, "quantity", objLine_find.quantity);

                    inventoryDetailRec.commitLine(inventoryAssignmentSulistId);
                }

                asbRec.commitLine(componentSublistId);
            }

            asbRec.save({enableSourcing: false, ignoreMandatoryFields: true});
        }

        /**
         * Task: https://app.clickup.com/t/86cxwt5k9
         * Script Used: 
         *  + scv_sl_wo2asb.js
         *  + scv_mr_wo2asb.js
         * */
        const createAssemblyByWorkOrder = (_objResData) => {
            let asbRec = record.transform({
                fromType: "workorder", fromId: _objResData.custpage_col_wo_id,
                toType: "assemblybuild", isDynamic: true,
            });

            if(!!_objResData.custpage_col_trandt){
                let trandate = constFormat.parseDate(_objResData.custpage_col_trandt);
                asbRec.setValue("trandate", trandate);
            }

            if(!!_objResData.custpage_col_mfgdt){
                let mfgdate = constFormat.parseDate(_objResData.custpage_col_mfgdt);
                asbRec.setValue("custbody_scv_mfg_date", mfgdate);
            }

            asbRec.setValue("quantity", _objResData.custpage_col_built_qty);
            asbRec.setValue("custbody_scv_weight_total", _objResData.custpage_col_tlg_total);
            asbRec.setValue("custbody_scv_weight_pallet", _objResData.custpage_col_tlg_pallet);
            asbRec.setValue("custbody_scv_weight_other", _objResData.custpage_col_tlg_khac);
            asbRec.setValue("custbody_scv_weight_goods", _objResData.custpage_col_tlg_hang);
            asbRec.setValue("custbody_scv_quantity_kg", _objResData.custpage_col_tlg_dm);
            asbRec.setValue("custbody_scv_diff_tolerence", _objResData.custpage_col_percentdiff);
            asbRec.setValue("custbody_scv_shift", _objResData.custpage_col_mfgmob_shift);
            asbRec.setValue("custbody_scv_employee_ycxvt", _objResData.custbody_scv_employee_ycxvt);
            asbRec.setValue("custbody_scv_actual_prod_time", _objResData.custpage_col_actprodtime);
            
            let assignmentSublistId = "inventoryassignment";
            let bodyInvDetailRec = asbRec.getSubrecord("inventorydetail");
            let arrLineInvDetailBody = _objResData.inventorydetail;

            while(bodyInvDetailRec.getLineCount(assignmentSublistId) > 0){
                bodyInvDetailRec.removeLine(assignmentSublistId, 0);
            }

            for(let i = 0; i < arrLineInvDetailBody.length; i++){
                let objLine = arrLineInvDetailBody[i];

                bodyInvDetailRec.selectNewLine(assignmentSublistId);

                bodyInvDetailRec.setCurrentSublistValue(assignmentSublistId, "receiptinventorynumber", objLine.custpage_inventorynumber);

                if(!!objLine.custpage_expirationdate){
                    objLine.custpage_expirationdate = constFormat.parseDate(objLine.custpage_expirationdate);
                    bodyInvDetailRec.setCurrentSublistValue(assignmentSublistId, "expirationdate", objLine.custpage_expirationdate);
                }
                if(!!objLine.custpage_inventorystatus){
                    bodyInvDetailRec.setCurrentSublistValue(assignmentSublistId, "inventorystatus", objLine.custpage_inventorystatus);
                }
                if(!!objLine.custpage_binnumber){
                    bodyInvDetailRec.setCurrentSublistValue(assignmentSublistId, "binnumber", objLine.custpage_binnumber);
                }

                bodyInvDetailRec.setCurrentSublistValue(assignmentSublistId, "quantity", objLine.custpage_quantity);

                bodyInvDetailRec.commitLine(assignmentSublistId);
            }

            let componentSublistId = SUBLIST.COMPONENT.ID;
            let sizeComponentSublist = asbRec.getLineCount(componentSublistId);

            let arrLine = _objResData.lines;
            
            for(let i = 0; i < sizeComponentSublist; i++){
                let orderline = asbRec.getSublistValue(componentSublistId, "orderline", i);
                let objLine = arrLine.find(e => e.custpage_col_line == orderline);
                if(!objLine) continue;
                
                asbRec.selectLine(componentSublistId, i);

                asbRec.setCurrentSublistValue(componentSublistId, "quantity", objLine.custpage_col_issue_qty_allocate);
                
                let arrLineInvDetailComponent = objLine.inventorydetail;
                
                if(arrLineInvDetailComponent.length > 0){
                    let lineInvDetailRec = asbRec.getCurrentSublistSubrecord(componentSublistId, "componentinventorydetail");

                    while(lineInvDetailRec.getLineCount(assignmentSublistId) > 0){
                        lineInvDetailRec.removeLine(assignmentSublistId, 0);
                    }

                    for(let j = 0; j < arrLineInvDetailComponent.length; j++){
                        let objLineInvDetailComponent = arrLineInvDetailComponent[j];
                        
                        lineInvDetailRec.selectLine(assignmentSublistId, j);
    
                        if(!!objLineInvDetailComponent.custpage_issueinventorynumber){
                            lineInvDetailRec.setCurrentSublistValue(assignmentSublistId, "issueinventorynumber", objLineInvDetailComponent.custpage_issueinventorynumber);
                        }
                        if(!!objLineInvDetailComponent.custpage_binnumber){
                            lineInvDetailRec.setCurrentSublistValue(assignmentSublistId, "binnumber", objLineInvDetailComponent.custpage_binnumber);
                        }
                        if(!!objLineInvDetailComponent.custpage_inventorystatus){
                            lineInvDetailRec.setCurrentSublistValue(assignmentSublistId, "inventorystatus", objLineInvDetailComponent.custpage_inventorystatus);
                        }

                        lineInvDetailRec.setCurrentSublistValue(assignmentSublistId, "quantity", objLineInvDetailComponent.custpage_quantity);
    
                        lineInvDetailRec.commitLine(assignmentSublistId);
                    }
                }

                asbRec.commitLine(componentSublistId);
            }

            let asbRecId = asbRec.save({enableSourcing: false, ignoreMandatoryFields: true});
            
            return asbRecId;
        }
    
        return {
            TYPE,
            FIELD,
            SUBLIST,
            RECORDS,
            getDataSource,
            allocateComponent,
            createAssemblyByWorkOrder
        };
        
    });
    