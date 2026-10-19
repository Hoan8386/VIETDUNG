/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  07 Mar 2024         Huy Pham			    Init, create file
 */
define(['N/record', 'N/search', 'N/query', 'N/runtime',
    '../cons/scv_cons_record.js',
    '../cons/scv_cons_search.js'
],
    function(record, search, query, runtime,
        constRecord,
        constSearch
    ) {
        const TYPE = "subsidiary";

        const FIELD = {
            ID: "id",
            INACTIVE: "isinactive",
            NAME: "name",
            NAMENOHIERARCHY: "namenohierarchy",
            LEGALNAME: "legalname"
        }
    
        const SUBLIST = {
            
        }
    
        const RECORDS = {
            COMPANY: {
                ID: 1,
                NAME: "Company"
            },
            CONG_TY_CP_NHOM_VD: {
                ID: 5,
                NAME: "Công ty Cổ phần Nhôm Việt Dũng"
            }
        }

        const SUBSIDIARY_OPTION = {
            ALL: {
                ID: "ALL",
                NAME: "All"
            },
            ALLACTIVE: {
                ID: "ALLACTIVE",
                NAME: "All Active"
            },
            OWN: {
                ID: "OWN",
                NAME: "Own"
            },
            SELECTED: {
                ID: "SELECTED",
                NAME: "Selected"
            }
        }

        const getDataSubsidiaryByUserRole = () => {
            let curUser = runtime.getCurrentUser();
            let objRole = query.runSuiteQL({
                query: `SELECT id, subsidiaryoption, subsidiaryrestriction
                from role
                where id = '${curUser.role}'`
            }).asMappedResults()[0];
            
            let subsidiary_op = objRole.subsidiaryoption;
            let myFilter = [];
            switch (subsidiary_op){
                case SUBSIDIARY_OPTION.ALL.ID:
                    myFilter = [];
                    break;
                case SUBSIDIARY_OPTION.ALLACTIVE.ID:
                    myFilter = [['isinactive', 'is', false]];
                    break;
                case SUBSIDIARY_OPTION.OWN.ID:
                    let entityLKF = search.lookupFields({type: "entity", id: curUser.id, columns: "subsidiary"});
                    let sub_id = "";
                    if(!!entityLKF.subsidiary){
                        if(entityLKF.subsidiary.length > 0){
                            sub_id = entityLKF.subsidiary[0].value;
                        }
                    }
    
                    myFilter = ['internalid', "anyOf", sub_id];
                    break;
                case SUBSIDIARY_OPTION.SELECTED.ID:
                    let arrSubSel = !!objRole.subsidiaryrestriction ? objRole.subsidiaryrestriction.split(",") : [];
                    if(arrSubSel.length > 0){
                        myFilter = ['internalid', "anyOf", arrSubSel]
                    }
                    break;
            }

            let resultSearch = constSearch.createSearchWithFilter({
                type: "subsidiary",
                filters: myFilter,
                columns:
                [
                    "name", "namenohierarchy", "legalname",
                    search.createColumn({
                        name: "address",
                        join: "address",
                        label: "Address"
                    }),
                    "iselimination"
                ]
            });
            let arrResult = constSearch.fetchResultSearchRunEach(resultSearch, function(_objTmpl, _column){
                let objResTmpl = constSearch.getObjResultFromSearchByKey(_objTmpl, _column, [
                    "name", "namenohierarchy", "legalname",
                    "address", "iselimination"
                ]);

                objResTmpl.id = _objTmpl.id * 1;

                return objResTmpl;
            });
            return arrResult;
        }

        const initLoadFieldSubsidiaryByUserRole = (_subsidiaryField) =>{
            let curUser = runtime.getCurrentUser()
            let arrResult = getDataSubsidiaryByUserRole();
            for(let i = 0; i < arrResult.length; i++){
                let objSub = arrResult[i];

                let isSelected = curUser.subsidiary == objSub.id ? true : false

                _subsidiaryField.addSelectOption({value: objSub.id, text: objSub.namenohierarchy, isSelected: isSelected});
            }

            return arrResult;
        }

        const getInfoSubsidiaryById = (_subsidiaryId) => {
            if(!isOneWorld()){
                _subsidiaryId = RECORDS.COMPANY.ID;
            }

            if(!_subsidiaryId) return [];

            let resultSQL = query.runSuiteQL({
                query: `SELECT id, name, fullname, legalname, BUILTIN.DF(mainaddress) as mainaddress_display,
                    federalidnumber, state, email,
                    custrecord_scv_sub_code,
                    custrecord_scv_o2c_if_add,
                    custrecord_scv_sub_phone,
                    custrecord_scv_website,
                    custrecord_scv_sub_ktt
                from subsidiary
                where id IN (${_subsidiaryId.toString()})
                order by id asc`
            });
            return resultSQL.asMappedResults();
        }

        const mappingSubsidiaryCompany = (_arrData, _subsidiaryId = "") =>{
            let objSubsidiary = {};
            if(isOneWorld()){
                if(!!_subsidiaryId){
                    objSubsidiary = getInfoSubsidiaryById(_subsidiaryId)[0];
                }
            }else{
                _subsidiaryId = RECORDS.COMPANY.ID;
                objSubsidiary = getInfoSubsidiaryById(_subsidiaryId)[0];
            }

            _arrData.map(e => {
                e.subsidiary_id = _subsidiaryId;
                e.subsidiary_name = objSubsidiary.name
            });

            return _arrData;
        }

        const isOneWorld = () =>{
            let isOW = true;
            try{
                //in server
                isOW = runtime.isFeatureInEffect({feature:'SUBSIDIARIES'})
            }catch(err){
                //in Client
                isOW = _dynamicData.reflet.features.SUBSIDIARIES == 'SUBSIDIARIES' ? true : false;
            }

            return isOW;
        }

        const loadRecord = (_internalId) =>{
            let curRec = constRecord.loadRecord(TYPE, _internalId)

            return curRec;
        }

        const getCurrentRecord = () =>{
            return constRecord.getCurrentRecord();
        }

        return {
            TYPE,
            FIELD,
            SUBLIST,
            RECORDS,
            getDataSubsidiaryByUserRole,
            initLoadFieldSubsidiaryByUserRole,
            getInfoSubsidiaryById,
            isOneWorld,
            mappingSubsidiaryCompany,
            loadRecord,
            getCurrentRecord
        };
        
    });
    