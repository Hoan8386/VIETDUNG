/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  08 Nov 2024		    Huy Pham                Init & create file, move from Adv, from mr.Việt(https://app.clickup.com/t/86cx0fvqd)
 */
define(['N/format'
],
    function(format
    ) {
        const TYPE = "customlist_scv_import_valuetype";
        const FIELD = {
            ID: "id",
            INACTIVE: "isinactive",
            NAME: "name"
        }
    
        const SUBLIST = {
            
        }
    
        const RECORDS = {
            PK: {
                ID: 1,
                NAME: "Primary Key"
            },
            UNIQUE: {
                ID: 2,
                NAME: "Unique Import"
            },
            TEXT: {
                ID: 3,
                NAME: "Text Name"
            },
            VALUE: {
                ID: 4,
                NAME: "Value/ID"
            },
            DATE: {
                ID: 5,
                NAME: "Date"
            },
            CHECKBOX: {
                ID: 6,
                NAME: "Checkbox"
            },
            TRANSACTION_TRANSFORM_FROM: {
                ID: 7,
                NAME: "TransactionTransform From (Internal ID)"
            }
        }

        const formatDataValueType = (_valueType, _valueInput) =>{
            if(_valueType == RECORDS.DATE.ID){
                if(typeof(_valueInput) == "string"){
                    return format.parse({value: _valueInput, type: "date"});
                }
            }
            else if(_valueType == RECORDS.CHECKBOX.ID){
                let str_valueInput = _valueInput.toString().toLowerCase().trim();
                if(["yes", "1", "true", "t"].includes(str_valueInput)){
                    return true;
                }
                else if(["no", "0", "false", "f"].includes(str_valueInput)){
                    return false;
                }
            }

            return _valueInput;
        }

        return {
            TYPE,
            FIELD,
            SUBLIST,
            RECORDS,
            formatDataValueType
        };
        
    });
    