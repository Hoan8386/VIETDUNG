/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  01 Mar 2025         Huy Pham                Init & create file, Tính tổng trọng lượng hàng hóa trên SO, from ms.Ngọc(https://app.clickup.com/t/86cy4j99n)
 *  30 Jun 2025         Huy Pham                Bổ sung xUnitConversionRate, from ms.Ngọc(https://app.clickup.com/t/86cy4j99n?comment=90160118827010)
 */
define([
    '../cons/scv_cons_search.js',
    '../cons/scv_cons_format.js'
],
    function(
        constSearch,
        constFormat
    ) {
        const TYPE = "workorder";
        const FIELD = {
            ID: "id",
            INACTIVE: "isinactive",
            NAME: "tranid"
        }
    
        const SUBLIST = {
            ITEM: {
                ID: "item",
                TYPE : "transactionline",
                FIELD: {}
            },
        }
    
        const RECORDS = {
            CUSTOM_FORM: {
                NVD_NOI_DIA: {
                    ID: 260,
                    NAME: "NVD Nội địa"
                }
            }
        }

        const getDataSource = (_filters) => {
            let resultSearch =  constSearch.createSearchWithFilter({
                type: "salesorder",
                filters:
                [
                    
                ],
                columns:
                [
                    "internalid",
                    "tranid", "subsidiary",
                ]
            }, _filters);
            
            let arrResult = constSearch.fetchResultSearchRunEach(resultSearch, function(_objTmpl, _column){
                let objResTmpl = constSearch.getObjResultFromSearchByKey(_objTmpl, _column, [
                    "internalid",
                    "tranid", "subsidiary",
                ]);

                return objResTmpl;
            });
            
            return arrResult;
        }

        const sumWeightItem = (curRec) =>{
            let customformId = curRec.getValue("customform");
            if(customformId != RECORDS.CUSTOM_FORM.NVD_NOI_DIA.ID) return;

            let itemSublistId = SUBLIST.ITEM.ID;
            let sizeItem = curRec.getLineCount(itemSublistId);

            let totalWeight = 0;

            for(let i = 0; i < sizeItem; i++){
                let weight = (curRec.getSublistValue(itemSublistId, "custcol_scv_so_trong_luong", i)||1) * 1;
                let unit_convertsion_rate = (curRec.getSublistValue(itemSublistId, "custcol_scv_unit_conversion_rate", i) || 1) * 1;
                let quantity = curRec.getSublistValue(itemSublistId, "quantity", i) * 1;

                totalWeight += weight * quantity * unit_convertsion_rate;
            }

            totalWeight = constFormat.roundNumber(totalWeight);
            
            curRec.setValue("custbody_scv_fr_trong_luong", totalWeight);

            return totalWeight;
        }

        return {
            TYPE,
            FIELD,
            SUBLIST,
            RECORDS,
            getDataSource,
            sumWeightItem
        };
        
    });
    