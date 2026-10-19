/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  2 Mar 2025          Huy Pham			    Init, create file, Chức năng tính toán Số lượng lỗi lật tấm, from mr.NĐHuy(https://app.clickup.com/t/86cy51faq)
 */
define(['N/search',
    '../cons/scv_cons_format.js',
    '../cons/scv_cons_search.js',
    '../cons/scv_cons_search_error_qty.js'
],
    function(search,
        constFormat,
        constSearch,
        constSearchErrorQty
    ) {
        const TYPE = "customrecord_scv_detail_shift";
        const FIELD = {
            ID: "id",
            INACTIVE: "isinactive",
            NAME: "name"
        }
    
        const SUBLIST = {
        }
    
        const RECORDS = {
        }

        const getDataSource = (_filters) => {
            let resultSearch =  constSearch.createSearchWithFilter({
                type: "customrecord_scv_detail_shift",
                filters:
                [
                    ["isinactive","is","F"]
                ],
                columns:
                [
                    "internalid",
                    "name"
                ]
            }, _filters);
            
            let arrResult = constSearch.fetchResultSearchRunEach(resultSearch, function(_objTmpl, _column){
                let objResTmpl = constSearch.getObjResultFromSearchByKey(_objTmpl, _column, [
                    "internalid",
                    "name"
                ]);

                return objResTmpl;
            });
            
            return arrResult;
        }

        /**
         * line: custrecord_scv_ds_date custrecord_scv_ds_to custrecord_scv_ds_error_des
         */
        const calcSingleError = (_curRec) =>{debugger
            let inspectDate = '';
            let custrecord_scv_ds_inslot = _curRec.getValue("custrecord_scv_ds_inslot");
            if(custrecord_scv_ds_inslot){
                let lkINSPL = search.lookupFields({
                    type: "customrecord_scv_insp_lot",
                    id: custrecord_scv_ds_inslot,
                    columns: ["custrecord_scv_inspl_kcs_receipt_date"]
                });console.log('lkINSPL', lkINSPL)
                inspectDate = lkINSPL.custrecord_scv_inspl_kcs_receipt_date;
            }
           
            let custrecord_scv_ds_to = _curRec.getValue("custrecord_scv_ds_to");
            custrecord_scv_ds_to = custrecord_scv_ds_to.sort((a, b) => a - b).toString();

            let custrecord_scv_ds_error_des = _curRec.getValue("custrecord_scv_ds_error_des");

            if(!inspectDate || !custrecord_scv_ds_to || !custrecord_scv_ds_error_des) return;

            let arrDataErrorQty = getDataErrorQty(_curRec, {
                custrecord_scv_ds_date: inspectDate,
                custrecord_scv_ds_to: custrecord_scv_ds_to,
                custrecord_scv_ds_error_des: custrecord_scv_ds_error_des
            });

            let ttl_single_error = 0;
            arrDataErrorQty.forEach(obj => {
                ttl_single_error += obj.custrecord_scv_ds_single_error * 1;
            })

            let new_single_error = ttl_single_error == 0 ? 1 : 0;

            _curRec.setValue("custrecord_scv_ds_single_error", new_single_error);

            return new_single_error;
        }

        //line: custrecord_scv_ds_error custrecord_scv_ds_single_error
        const calcMultiError = (_curRec) =>{
            let count_error = _curRec.getValue("custrecord_scv_ds_error") * 1;
            let single_error = _curRec.getValue("custrecord_scv_ds_single_error") * 1;
            let old_multi_error = _curRec.getValue("custrecord_scv_ds_multi_error") * 1;

            let new_multi_error = count_error - single_error;

            if(new_multi_error == old_multi_error) return old_multi_error;

            _curRec.setValue("custrecord_scv_ds_multi_error", new_multi_error);

            return new_multi_error;
        }

        const getDataErrorQty = (_curRec, _params) =>{
            let myFilters = [];

            if(!!_params.custrecord_scv_ds_date){
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_ds_date', 
                    operator: "on", 
                    values: _params.custrecord_scv_ds_date
                }))
            }
            if(!!_params?.custrecord_scv_ds_to?.toString()){
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_ds_to', 
                    operator: "anyof", 
                    values: _params.custrecord_scv_ds_to.toString().split(",")
                }))
            }
            if(!!_params?.custrecord_scv_ds_error_des?.toString()){
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_ds_error_des', 
                    operator: "anyof", 
                    values: _params.custrecord_scv_ds_error_des.toString().split(",")
                }))
            }
            let arrErrorQty = constSearchErrorQty.getDataSource(myFilters);

            return arrErrorQty;
        }

        return {
            TYPE,
            FIELD,
            SUBLIST,
            RECORDS,
            getDataSource,
            calcSingleError,
            calcMultiError
        };
        
    });
    