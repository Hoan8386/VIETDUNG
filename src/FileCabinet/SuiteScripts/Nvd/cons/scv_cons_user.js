/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  18 Mar 2024         Huy Pham			    Init, create file
 */
define(['N/runtime',
    '../cons/scv_cons_search.js',
    '../cons/scv_cons_role.js',
],
    function(runtime,
        constSearch,
        constRole
    ) {
        const TYPE = "";
        const FIELD = {
            ID: "id",
            INACTIVE: "isinactive",
            NAME: "name"
        }
    
        const SUBLIST = {
            
        }
    
        const RECORDS = {
        }

        const getCurrentUser = () =>{
            let curUser = runtime.getCurrentUser();

            let objRes = JSON.parse(JSON.stringify(curUser));
            objRes.salesrep = {};
            objRes.custentity_scv_partner_employee = "";
            objRes.isPartner = false;
            
            if([constRole.RECORDS.PARTNER.CENTER_TYPE, constRole.RECORDS.ADVANCE_PARTNER.CENTER_TYPE].includes(curUser.roleCenter)){
                objRes.isPartner = true;

                let partnerLKF = constSearch.getDataLookupFields("entity", objRes.id, "custentity_scv_partner_employee");

                if(!!partnerLKF.custentity_scv_partner_employee && partnerLKF.custentity_scv_partner_employee.length > 0){
                    objRes.custentity_scv_partner_employee = partnerLKF.custentity_scv_partner_employee[0].value;
                }
            }

            return objRes;
        }
        
        return {
            TYPE,
            FIELD,
            SUBLIST,
            RECORDS,
            getCurrentUser
        };
        
    });
    