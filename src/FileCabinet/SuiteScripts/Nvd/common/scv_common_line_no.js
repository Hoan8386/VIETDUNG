/**
 * @NApiVersion 2.1
 */
define([
        'N/record',
        'N/query',
    ],
    (
        record,
        query,
    ) => {

        const setLineNoCustomPurchase = (rec, idSublist) => {
            let lcLines = rec.getLineCount(idSublist);
            for (let i = 0; i < lcLines; i++) {
                rec.setSublistValue(idSublist, "custcol_scv_line_no", i, (i + 1));
            }
        }

        const setLineNoCustomRecord = (recMain, recSublist, fieldPointToMainRec, fieldStt) => {
            const sql = `
                SELECT id
                FROM ${recSublist}
                WHERE ${fieldPointToMainRec} = ${recMain.id}
                ORDER BY id
            `;

            const results = query.runSuiteQL({query: sql}).asMappedResults();

            let line = 1;
            results.forEach((row) => {
                record.submitFields({
                    type: recSublist,
                    id: row.id,
                    values: {
                        [`${fieldStt}`]: line
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    }
                });
                line++;
            });
        }

        return {
            setLineNoCustomPurchase,
            setLineNoCustomRecord
        }

    });
