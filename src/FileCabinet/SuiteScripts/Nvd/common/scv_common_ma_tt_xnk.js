/**
 * @NApiVersion 2.1
 */
define(['N/query'],

    (query) => {

        const trungMaThanhToan = (rec) => {
            const maThanhToan = rec.getValue({fieldId: 'name'});
            if (!maThanhToan) return true;

            const idRec = rec.id;
            const hasIdCondition = ( idRec !== ''  && idRec !== null);
            const queryText = `
                SELECT id
                FROM customrecord_scv_ma_tt_xnk
                WHERE name = ? ${hasIdCondition ? 'AND id != ?' : ''}
            `;
            const params = hasIdCondition ? [maThanhToan, idRec] : [maThanhToan];

            const results = query.runSuiteQL({
                query: queryText,
                params: params
            }).asMappedResults();

            if (results.length > 0) {
                alert('Mã thanh toán đã tồn tại');
                return true;
            }

            return false;
        };

        return {
            trungMaThanhToan,
        }

    });
