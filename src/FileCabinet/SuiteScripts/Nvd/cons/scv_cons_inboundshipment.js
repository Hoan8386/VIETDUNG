/**
 * Nội dung: 
 * Key:
 * * =======================================================================================
 *  Date                Author                  Description
 *  27 Feb 2025         Huy Pham                Init, create file, Chặn nhập vượt qty, from mr.Hải(https://app.clickup.com/t/86cy3dgvr)
 * 
 */
define(['N/query'
],
    function(query
    ) {
        const TYPE = "inboundShipment";
        const FIELD = {
            ID: "id",
            INACTIVE: "isinactive",
            NAME: "name"
        }
    
        const SUBLIST = {
        }
    
        const RECORDS = {
        }

        const getDataSourceItem = (_filters) => {
            if(!_filters?.inboundshipment) return [];

            let strWhere = `where inboundshipment= ${_filters.inboundshipment.toString()}`;

            let arrResult = query.runSuiteQL({
                query: `select id, inboundshipment, shipmentitemtransaction, quantityexpected, custrecord_scv_inb_positive_tolerance
                    from InboundShipmentItem
                    ${strWhere}
                    `
            }).asMappedResults();

            return arrResult;
        }

        return {
            TYPE,
            FIELD,
            SUBLIST,
            RECORDS,
            getDataSourceItem
        };
        
    });
    