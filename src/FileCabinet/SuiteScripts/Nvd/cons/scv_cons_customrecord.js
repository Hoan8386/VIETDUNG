/**
 * =======================================================================================
 *  Date                Author                  Description
 *  21 Jan 2026         Phu Pham			    Init, create file
 */
define([
    'N/query', 'N/runtime',
],
    function(
        query, runtime,
    ) {
        const Type = "CustomRecordType";

        const getInfoCustomRecordByType = (_rectype) => {
            if(!_rectype) return {};

            const resultSQL = query.runSuiteQL({
                query: `SELECT description, scriptid, name, internalid
                    FROM CustomRecordType
                    WHERE scriptid = '${_rectype.toUpperCase()}'`
            }).asMappedResults();

            return resultSQL[0] || {};
        }

        const getCustRecPathByType = (_rectype, _includeDomain = false) => {
            let objCustRec = getInfoCustomRecordByType(_rectype);
            
            let urlCustRec = `/app/common/custom/custrecordentry.nl?rectype=${objCustRec.internalid}`;
            if(_includeDomain === false) return urlCustRec;

            let accountId = normalizeAccountId(runtime.accountId);
            return `https://${accountId}.app.netsuite.com` + urlCustRec;
        }

        const getCustRecPathByInternal = (_internalid, _includeDomain = false) => {
            let urlCustRec = `/app/common/custom/custrecordentry.nl?rectype=${_internalid}`;
            if(_includeDomain === false) return urlCustRec;

            let accountId = normalizeAccountId(runtime.accountId);
            return `https://${accountId}.app.netsuite.com` + urlCustRec;
        }

        const getDataCustFieldByRecType = (_rectype, _fields) => {
            if(!_rectype || !_fields) return {};

            let newFields = _fields.join("','").toUpperCase();
            const resultSQL = query.runSuiteQL({
                query: `SELECT 
                    CustRec.scriptid as recordtype, 
                    CustRec.name as recordname, 
                    CustRec.internalid as recordid,
                    CustField.scriptid as fieldscript,
                    CustField.fieldvaluetyperecord as fieldvaluetyperecord,
                    CustField.id as fieldid,
                    FROM CustomRecordType CustRec
                    LEFT JOIN CustomField CustField ON CustField.recordtype = CustRec.internalid
                    WHERE CustRec.scriptid = '${_rectype.toUpperCase()}'
                    AND CustField.scriptid IN ('${newFields}')`
            }).asMappedResults();

            return resultSQL;
        }

        function normalizeAccountId(accountId) {
            if(!accountId) return "";

            return accountId.toString().replace("_", "-").toLowerCase();
        }

        return {
            Type: Type,
            normalizeAccountId,

            getDataCustFieldByRecType,
            getInfoCustomRecordByType,
            getCustRecPathByType,
            getCustRecPathByInternal
        };
    });
    