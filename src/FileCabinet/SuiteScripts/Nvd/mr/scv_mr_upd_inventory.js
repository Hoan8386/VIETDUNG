/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/search', 'N/record', 'N/log', '../lib/scv_lib_report'],
    (search, record, log, libRep) => {

        const getInputData = (context) => {
            let datas = []
            libRep.doSearchSSRangeLabelId('customsearch3829', 1000, datas, []);
            return datas;
        }

        const map = (context) => {
            try {
                const values = JSON.parse(context.value);

                const lotId = values["Lot Number ID"];
                const lotName = values["Inventory Number"];

                const valSeriMau = values["seri_mau"];
                const valMemo    = values["memo"];
                const valTlLoi   = values["tl_loi"];

                if (!lotId) {
                    log.error('Skip', 'Không có Lot ID');
                    return;
                }

                log.error('valSeriMau', valSeriMau)
                log.error('valMemo', valMemo)
                log.error('valTlLoi', valTlLoi)

                record.submitFields({
                    type: 'inventorynumber',
                    id: lotId,
                    values: {
                        'custitemnumber_scv_item_num_color_seri': valSeriMau || '',
                        'memo': valMemo || '',
                        'custitemnumber_scv_core_weight': valTlLoi || ''
                    },
                    options: {
                        ignoreMandatoryFields: true
                    }
                });

            } catch (e) {
                log.error('Error Updating Lot', e);
            }
        }

        return {
            getInputData: getInputData,
            map: map
        };
    });