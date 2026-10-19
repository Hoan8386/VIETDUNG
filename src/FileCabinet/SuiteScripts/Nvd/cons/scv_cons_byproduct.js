/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  25 Nov 2024         Huy Pham                Init & create file, Chức năng load default Các item phụ phẩm, thu hồi, from mr.Bính(https://app.clickup.com/t/86cx4wmbg)
 */
define([
    '../cons/scv_cons_search.js'
],
    function(
        constSearch
    ) {
        const TYPE = "customrecord_scv_by_product";
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
                type: "customrecord_scv_by_product",
                filters:
                [
                    
                ],
                columns:
                [
                    "internalid",
                    "custrecord_scv_by_prod_item", "custrecord_scv_by_product_qty"
                ]
            }, _filters);
            
            let arrResult = constSearch.fetchResultSearchRunEach(resultSearch, function(_objTmpl, _column){
                let objResTmpl = constSearch.getObjResultFromSearchByKey(_objTmpl, _column, [
                    "internalid",
                    "custrecord_scv_by_prod_item", "custrecord_scv_by_product_qty"
                ]);

                return objResTmpl;
            });
            
            return arrResult;
        }

        const addLineDefaultOfRecord = (curRec) =>{
            let sublistId = "";

            if(curRec.type == "workorder"){
                sublistId = "recmachcustrecord_scv_by_product_wo";
            }
            else if(curRec.type == "assemblybuild"){
                sublistId = "recmachcustrecord_scv_by_product_wo_completion";
            }
            if(!sublistId) return false;

            let listDefaultId = curRec.getValue("custbody_scv_by_product_list_default");
            if(!listDefaultId) return false;

            let sizeSublist = curRec.getLineCount(sublistId);
            if(sizeSublist > 0) return false;

            let resultSearch = constSearch.loadSearchWithFilter(listDefaultId);

            let arrResult = constSearch.fetchResultSearchRunEach(resultSearch, function(_objTmpl, _column){
                let objResTmpl = constSearch.getObjResultFromSearchWithLabel(_objTmpl, _column);
                objResTmpl.internalid = _objTmpl.id;

                return objResTmpl;
            });
            if(arrResult.length == 0) return false;

            let isDynamic = curRec.isDynamic;

            for(let i = 0; i < arrResult.length; i++){
                let itemId = arrResult[i].internalid;

                if(isDynamic){
                    curRec.selectNewLine(sublistId);
                    curRec.setCurrentSublistValue(sublistId, "custrecord_scv_by_prod_item", itemId);
                    curRec.commitLine(sublistId);
                }
                else{
                    curRec.insertLine(sublistId, i);
                    curRec.setSublistValue({sublistId: sublistId, fieldId: "custrecord_scv_by_prod_item", line: i, value: itemId});
                }
            }

            return true;
        }
    
        return {
            TYPE,
            FIELD,
            SUBLIST,
            RECORDS,
            getDataSource,
            addLineDefaultOfRecord
        };
        
    });
    