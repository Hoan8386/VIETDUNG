/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/search', 'N/file','../common/scv_common_excel_helper', 'N/runtime'], (record, search, file, excelHelper, runtime) => {

    const DATA_SOURCE = [
        { "lot": "18041", "seri": "2325S10" },
        { "lot": "17997", "seri": "1425G01" },
        { "lot": "22743", "seri": "0125D03" },
        { "lot": "18078", "seri": "4625Z03" },
        { "lot": "18079", "seri": "4625Z04" },
        { "lot": "18080", "seri": "4725I01" },
        { "lot": "18082", "seri": "4725I03" },
        { "lot": "18083", "seri": "4725I04" },
        { "lot": "18084", "seri": "4725I05" },
        { "lot": "18086", "seri": "4725I07" },
        { "lot": "18087", "seri": "4725I08" },
        { "lot": "18088", "seri": "4725I09" },
        { "lot": "18089", "seri": "4725I10" },
        { "lot": "13056", "seri": "0121D01" },
        { "lot": "23203", "seri": "0625D01" },
        { "lot": "18061", "seri": "1925Z01" },
        { "lot": "18062", "seri": "1825Z01" },
        { "lot": "18063", "seri": "1925Z02" },
        { "lot": "17900", "seri": "0425D01" },
        { "lot": "18102", "seri": "1425G06" },
        { "lot": "18068", "seri": "1425Z01" },
        { "lot": "18069", "seri": "1525Z01" },
        { "lot": "23097", "seri": "0325Z01" },
        { "lot": "22180", "seri": "0124Z01" },
        { "lot": "18096", "seri": "1325G04" },
        { "lot": "17767", "seri": "1225G13" },
        { "lot": "17755.2", "seri": "1225G01" },
        { "lot": "17940", "seri": "1625G07" },
        { "lot": "17793", "seri": "0125G01" },
        { "lot": "14931", "seri": "0122D01" },
        { "lot": "23210", "seri": "0125D01" },
        { "lot": "17913", "seri": "0625G01" },
        { "lot": "18064", "seri": "0525Z01" },
        { "lot": "18071", "seri": "0725Z01" },
        { "lot": "23222", "seri": "0725Z01" },
        { "lot": "23043", "seri": "0125Z01" },
        { "lot": "18065", "seri": "1325Z01" },
        { "lot": "18066", "seri": "1425Z01" },
        { "lot": "18072", "seri": "1125Z01" },
        { "lot": "18073", "seri": "1225Z01" },
        { "lot": "23224", "seri": "0925Z01" },
        { "lot": "4696", "seri": "1625S01" },
        { "lot": "18067", "seri": "0725Z01" },
        { "lot": "23226", "seri": "0225Z01" },
        { "lot": "16901", "seri": "0124Z01" },
        { "lot": "18023", "seri": "1125S01" },
        { "lot": "17679", "seri": "0225D01" },
        { "lot": "4469", "seri": "0125S01" },
        { "lot": "18070", "seri": "0625Z01" },
        { "lot": "23228", "seri": "0425Z01" },
        { "lot": "22229", "seri": "0224Z01" },
        { "lot": "17901", "seri": "0325D01" },
        { "lot": "23493", "seri": "0425D01" },
        { "lot": "17956", "seri": "0525B01" },
        { "lot": "4654", "seri": "0425B01" },
        { "lot": "17659", "seri": "0225G01" },
        { "lot": "3947", "seri": "0124S01" },
        { "lot": "18074", "seri": "0925Z01" },
        { "lot": "18053", "seri": "3925D01" },
        { "lot": "18054", "seri": "4025D01" },
        { "lot": "18055", "seri": "4125D01" },
        { "lot": "18056", "seri": "4225D01" },
        { "lot": "18057", "seri": "4125D02" },
        { "lot": "18058", "seri": "4125D03" },
        { "lot": "17275", "seri": "0125D01" },
        { "lot": "22459", "seri": "0924D01" },
        { "lot": "22460", "seri": "1024D01" },
        { "lot": "23206", "seri": "0525D01" },
        { "lot": "4329", "seri": "0125D02" },
        { "lot": "22741", "seri": "0125D01" },
        { "lot": "23117", "seri": "0225D01" },
        { "lot": "13057", "seri": "0121D01" },
        { "lot": "17703", "seri": "0225D01" },
        { "lot": "4573", "seri": "0425D01" },
        { "lot": "4772", "seri": "0625D01" },
        { "lot": "17563", "seri": "1625D01" },
        { "lot": "23208", "seri": "0325D01" },
        { "lot": "16948", "seri": "0224D02" },
        { "lot": "23290", "seri": "0825N01" },
        { "lot": "10611", "seri": "0317D02" },
        { "lot": "17283", "seri": "0125D01" },
        { "lot": "23261", "seri": "1225D01" },
        { "lot": "18060", "seri": "1725D02" },
        { "lot": "17863", "seri": "0225D01" },
        { "lot": "22924", "seri": "0125D01" },
        { "lot": "23284", "seri": "0925N01" },
        { "lot": "17114", "seri": "0424D02" },
        { "lot": "17668", "seri": "0225D04" },
        { "lot": "17092", "seri": "0124D01" },
        { "lot": "23358", "seri": "0225D01" },
        { "lot": "22917", "seri": "0125D01" },
        { "lot": "17561", "seri": "0125D01" },
        { "lot": "4264", "seri": "0224D01" },
        { "lot": "4570", "seri": "0325D01" },
        { "lot": "16945", "seri": "0124D01" },
        { "lot": "23202", "seri": "0125D01" },
        { "lot": "17772", "seri": "0125D02" },
        { "lot": "17754", "seri": "1225G04" },
        { "lot": "17918", "seri": "1225G05" },
        { "lot": "18103", "seri": "1425G07" },
        { "lot": "18104", "seri": "1425G08" },
        { "lot": "18091", "seri": "1425G02" },
        { "lot": "18092", "seri": "1425G03" },
        { "lot": "18098", "seri": "1425G05" },
        { "lot": "23219", "seri": "1025Z03" },
        { "lot": "18094", "seri": "1325G02" },
        { "lot": "18095", "seri": "1325G03" },
        { "lot": "18100", "seri": "1325G06" },
        { "lot": "18101", "seri": "1325G07" },
        { "lot": "17784", "seri": "0325G01" },
        { "lot": "18059", "seri": "1725D01" },
        { "lot": "18081", "seri": "4725I02" },
        { "lot": "18085", "seri": "4725I06" },
        { "lot": "23219", "seri": "1025Z03" },
        { "lot": "23388", "seri": "0725D02" },
        { "lot": "16948", "seri": "0224D02" },
        { "lot": "17770", "seri": "0225D03" },
        { "lot": "4575", "seri": "0325D01" },
        { "lot": "17622", "seri": "0125D01" },
        { "lot": "17699", "seri": "0325D01" },
        { "lot": "17941", "seri": "0725G01" },
        { "lot": "17997", "seri": "1425G01" },
        { "lot": "18077", "seri": "4625Z02" },
        { "lot": "17795", "seri": "0925D01" },
        { "lot": "23301", "seri": "0225S09" },
        { "lot": "4629", "seri": "0825S02" },
        { "lot": "18075", "seri": "0125Z01" },
        { "lot": "4698", "seri": "0825S01" },
        { "lot": "23163", "seri": "0725N01" },
        { "lot": "17867", "seri": "0525N01" },
        { "lot": "23497", "seri": "0325D01" }
    ];
    const getInputData = () => {
        return DATA_SOURCE
    }

    const map = (context) => {
        try {
            const rowData = JSON.parse(context.value);
            const lotName = rowData.lot.trim();
            const seriVal = rowData.seri.trim();

            if (!lotName) return;
        } catch (e) {
            log.error('Lỗi tại Map Stage', e);
        }

    }


    const summarize = (summary) => {
        log.audit('Summary', 'Import Process Completed');
        if (summary.inputSummary.error) {
            log.error('Input Error', summary.inputSummary.error);
        }
        summary.mapSummary.errors.iterator().each((key, error) => {
            log.error(`Map Error for key: ${key}`, error);
            return true;
        });
        summary.reduceSummary.errors.iterator().each((key, error) => {
            log.error(`Reduce Error for key: ${key}`, error);
            return true;
        });
    }

    return {
        getInputData,
        map,
        reduce,
        summarize
    }
});