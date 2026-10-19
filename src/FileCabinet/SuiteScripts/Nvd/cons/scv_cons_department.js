/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  2 Mar 2025          Huy Pham			    Init, create file
 */
define([
    '../cons/scv_cons_search.js',
],
    function(
        constSearch,
    ) {
        const TYPE = "department";
        const FIELD = {
            ID: "id",
            INACTIVE: "isinactive",
            NAME: "name"
        }
    
        const SUBLIST = {
        }
    
        const RECORDS = {
            PHONG_KE_TOAN: {
                ID: 6,
                NAME: "Phòng Kế toán"
            },
            PHONG_VAT_TU: {
                ID: 7,
                NAME: "Phòng Vật tư"
            },
            PHONG_XNK: {
                ID: 8,
                NAME: "Phòng Xuất nhập khẩu"
            },
            TO_BOC_XEP: {
                ID: 22,
                NAME: "Tổ bốc xếp"
            },
            PHONG_KHO_VAN: {
                ID: 15,
                NAME: "Phòng kho vận"
            },
            TO_PHU_TRO: {
                ID: 21,
                NAME: "Tổ phụ trợ"
            },
        }

        const getDataSource = (_filters) => {
            let resultSearch =  constSearch.createSearchWithFilter({
                type: "department",
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

        return {
            TYPE,
            FIELD,
            SUBLIST,
            RECORDS,
            getDataSource,
        };
        
    });
    