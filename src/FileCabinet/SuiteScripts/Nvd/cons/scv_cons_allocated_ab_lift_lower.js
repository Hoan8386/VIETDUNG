/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  23 Dec 2024         Huy Pham                Init, create file, Tính toán phân bổ trọng lượng nâng hạ trong sản xuất, from mr.Bính(https://app.clickup.com/t/86cx40ye7)
 *  24 Dec 2024         Huy Pham                Bổ sung logic Group Lifting/Lowering, from mr.Bính(meeting)
 */
define(['N/search', 'N/record',
    '../lib/scv_lib_function.js',
    '../cons/scv_cons_search.js'
],
    function(search, record,
        lbf,
        constSearch
    ) {
        const TYPE = "customrecord_scv_allocated_ab_lift_lower";
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
                type: "customrecord_scv_allocated_ab_lift_lower",
                filters:
                [
                    
                ],
                columns:
                [
                    "internalid",
                    "name", "custrecord_scv_ab_lift_lower_trans_h",
                    "custrecord_scv_ab_lift_lower_ab_doc_no", "custrecord_scv_ab_lift_lower_material",
                    "custrecord_scv_ab_lift_lower_lot_no", "custrecord_scv_ab_lift_lower_qc_serial"
                ]
            }, _filters);
            
            let arrResult = constSearch.fetchResultSearchRunEach(resultSearch, function(_objTmpl, _column){
                let objResTmpl = constSearch.getObjResultFromSearchByKey(_objTmpl, _column, [
                    "internalid",
                    "name", "custrecord_scv_ab_lift_lower_trans_h",
                    "custrecord_scv_ab_lift_lower_ab_doc_no", "custrecord_scv_ab_lift_lower_material",
                    "custrecord_scv_ab_lift_lower_lot_no", "custrecord_scv_ab_lift_lower_qc_serial"
                ]);

                return objResTmpl;
            });
            
            return arrResult;
        }

        const deleteByLiftLowerHeader = (_liftLowerId) =>{
            let arrResult = getDataSource(search.createFilter({
                name: 'custrecord_scv_ab_lift_lower_trans_h',
                operator: "anyof",
                values: _liftLowerId.split(",")
            }));
            arrResult.forEach(function(_objRes){
                record.delete({
                    type: TYPE,
                    id: _objRes.internalid
                });
            });
        }

        const allocateComponent = (_liftLowerId, _arrLineComponent) =>{
            let arrLiftLowerId = _liftLowerId.toString().split(",");

            arrLiftLowerId.forEach(_liftId =>{
                for(let i = 0; i < _arrLineComponent.length; i++){
                    let objComponent = _arrLineComponent[i];
    
                    let allocateAbsLiftLowerRec = record.create({
                        type: "customrecord_scv_allocated_ab_lift_lower",
                        isDynamic: true
                    });
    
                    lbf.setValueData(allocateAbsLiftLowerRec, [
                        "custrecord_scv_ab_lift_lower_ab_doc_no", "custrecord_scv_ab_lift_lower_material",
                        "custrecord_scv_ab_lift_lower_lot_no", "custrecord_scv_ab_lift_lower_qc_serial",
                        "custrecord_scv_ab_lift_lower_shift", "custrecord_scv_ab_lift_lower_mat_qty",
                        "custrecord_scv_ab_lift_lower_allo_qty", "custrecord_scv_ab_lift_lower_manual_qty",
                        "custrecord_scv_ab_lift_lower_trans_h", "custrecord_scv_ab_lift_lower_prod_lot",
                        "custrecord_scv_ab_lift_lower_subsidiary", "custrecord_scv_ab_lift_lower_location",
                        "custrecord_scv_ab_lift_lower_work_center", "custrecord_scv_ab_lift_lower_line_id",
                        "custrecord_scv_ab_lift_lower_unique_key"
                    ], [
                        objComponent.custpage_col_ab_id, objComponent.custpage_col_mat,
                        objComponent.custpage_col_matlot, objComponent.custpage_col_qcserial,
                        objComponent.custpage_col_shift, objComponent.custpage_col_mat_qty,
                        objComponent.custpage_col_mat_qty_allocate, objComponent.custpage_col_manual_qty,
                        _liftId, objComponent.custpage_col_prodlot,
                        objComponent.custpage_col_subsidiary, objComponent.custpage_col_locatiton,
                        objComponent.custpage_col_workcenter, objComponent.custpage_col_ab_lineid,
                        objComponent.custpage_col_lineuniquekey
                    ])
    
                    allocateAbsLiftLowerRec.save({enableSourcing: false, ignoreMandatoryFields: true});
                }
            })
        }
    
        return {
            TYPE,
            FIELD,
            SUBLIST,
            RECORDS,
            getDataSource,
            deleteByLiftLowerHeader,
            allocateComponent
        };
        
    });
    