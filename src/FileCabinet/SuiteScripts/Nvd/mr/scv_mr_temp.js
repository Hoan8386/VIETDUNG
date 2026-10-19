/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/query', 'N/record'],
    
    (query, record) => {
        /**
         * Defines the function that is executed at the beginning of the map/reduce process and generates the input data.
         * @param {Object} inputContext
         * @param {boolean} inputContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Object} inputContext.ObjectRef - Object that references the input data
         * @typedef {Object} ObjectRef
         * @property {string|number} ObjectRef.id - Internal ID of the record instance that contains the input data
         * @property {string} ObjectRef.type - Type of the record instance that contains the input data
         * @returns {Array|Object|Search|ObjectRef|File|Query} The input data to use in the map/reduce process
         * @since 2015.2
         */
        
        const getInputData = (inputContext) => {
            return dataRaw;
        }
        
        const dataRaw = [
            // {
            //     custitemnumber_scv_item_num_color_seri: '5125B01',
            //     custitemnumber_scv_core_weight: '29',
            //     memo: 'NM1, LG=29kg',
            //     custitemnumber_scv_import_date: '20/11/2025',
            //     item: 14296,
            //     inventorynumber: '4784'
            // },
            {
                custitemnumber_scv_item_num_color_seri: '5125B02',
                custitemnumber_scv_core_weight: '29',
                memo: 'NM1, LG=29kg',
                custitemnumber_scv_import_date: '20/11/2025',
                item: 14296,
                inventorynumber: '4785'
            },
            {
                custitemnumber_scv_item_num_color_seri: '1425S01',
                custitemnumber_scv_core_weight: '18',
                memo: 'NM1, LS=18kg',
                custitemnumber_scv_import_date: '10/11/2025',
                item: 14327,
                inventorynumber: '4773'
            },
            {
                custitemnumber_scv_item_num_color_seri: '1425S02',
                custitemnumber_scv_core_weight: '18',
                memo: 'NM1, LS=18kg',
                custitemnumber_scv_import_date: '10/11/2025',
                item: 14327,
                inventorynumber: '4774'
            },
            {
                custitemnumber_scv_item_num_color_seri: '1225G13',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14529,
                inventorynumber: '17767'
            },
            {
                custitemnumber_scv_item_num_color_seri: '1125S01',
                custitemnumber_scv_core_weight: '18',
                memo: 'NM1, LS=18kg',
                custitemnumber_scv_import_date: '10/11/2025',
                item: 14348,
                inventorynumber: '4775'
            },
            {
                custitemnumber_scv_item_num_color_seri: '2025S01',
                custitemnumber_scv_core_weight: '18',
                memo: 'NM1, LS=18kg',
                custitemnumber_scv_import_date: '10/11/2025',
                item: 14354,
                inventorynumber: '4776'
            },
            {
                custitemnumber_scv_item_num_color_seri: '2025S02',
                custitemnumber_scv_core_weight: '18',
                memo: 'NM1, LS=18kg',
                custitemnumber_scv_import_date: '10/11/2025',
                item: 14354,
                inventorynumber: '4777'
            },
            {
                custitemnumber_scv_item_num_color_seri: '2025S03',
                custitemnumber_scv_core_weight: '18',
                memo: 'NM1, LS=18kg',
                custitemnumber_scv_import_date: '10/11/2025',
                item: 14354,
                inventorynumber: '4778'
            },
            {
                custitemnumber_scv_item_num_color_seri: '1625S01',
                custitemnumber_scv_core_weight: '18',
                memo: 'NM1, LS=18kg',
                custitemnumber_scv_import_date: '10/11/2025',
                item: 14373,
                inventorynumber: '4779'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0525S01',
                custitemnumber_scv_core_weight: '18',
                memo: 'NM1, LS=18kg',
                custitemnumber_scv_import_date: '10/11/2025',
                item: 17708,
                inventorynumber: '4780'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0825S01',
                custitemnumber_scv_core_weight: '18',
                memo: 'NM1, LS=18kg',
                custitemnumber_scv_import_date: '10/11/2025',
                item: 14383,
                inventorynumber: '4781'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0325S01',
                custitemnumber_scv_core_weight: '18',
                memo: 'NM1, LS=18kg',
                custitemnumber_scv_import_date: '10/11/2025',
                item: 14387,
                inventorynumber: '4782'
            },
            {
                custitemnumber_scv_item_num_color_seri: '2825B01',
                custitemnumber_scv_core_weight: '20',
                memo: 'NM1, LS=20kg',
                custitemnumber_scv_import_date: '20/11/2025',
                item: 14400,
                inventorynumber: '4788'
            },
            {
                custitemnumber_scv_item_num_color_seri: '2925B01',
                custitemnumber_scv_core_weight: '20',
                memo: 'NM1, LS=20kg',
                custitemnumber_scv_import_date: '20/11/2025',
                item: 14400,
                inventorynumber: '4789'
            },
            {
                custitemnumber_scv_item_num_color_seri: '3025B01',
                custitemnumber_scv_core_weight: '20',
                memo: 'NM1, LS=20kg',
                custitemnumber_scv_import_date: '20/11/2025',
                item: 14400,
                inventorynumber: '4790'
            },
            {
                custitemnumber_scv_item_num_color_seri: '3125B01',
                custitemnumber_scv_core_weight: '20',
                memo: 'NM1, LS=20kg',
                custitemnumber_scv_import_date: '20/11/2025',
                item: 14400,
                inventorynumber: '4791'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0525B01',
                custitemnumber_scv_core_weight: '40',
                memo: 'NM1, LG=40kg',
                custitemnumber_scv_import_date: '20/11/2025',
                item: 14401,
                inventorynumber: '4793'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0525B01',
                custitemnumber_scv_core_weight: '20',
                memo: 'NM1, LS=20kg',
                custitemnumber_scv_import_date: '20/11/2025',
                item: 14403,
                inventorynumber: '4786'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0325S01',
                custitemnumber_scv_core_weight: '18',
                memo: 'NM1, LS=18kg',
                custitemnumber_scv_import_date: '10/11/2025',
                item: 14406,
                inventorynumber: '4783'
            },
            {
                custitemnumber_scv_item_num_color_seri: '2325S10',
                custitemnumber_scv_core_weight: '18',
                memo: 'LS=18, ID: 18041',
                custitemnumber_scv_import_date: '25/10/2025',
                item: 14298,
                inventorynumber: '18041'
            },
            {
                custitemnumber_scv_item_num_color_seri: '1425G01',
                custitemnumber_scv_core_weight: '23',
                memo: 'LG=23  ID: 17997',
                custitemnumber_scv_import_date: '17/10/2025',
                item: 14303,
                inventorynumber: '17997'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0125D03',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14304,
                inventorynumber: '22743'
            },
            {
                custitemnumber_scv_item_num_color_seri: '4625Z02',
                custitemnumber_scv_core_weight: '24',
                memo: 'LG=24, ID: 18077',
                custitemnumber_scv_import_date: '07/11/2025',
                item: 15194,
                inventorynumber: '18077'
            },
            {
                custitemnumber_scv_item_num_color_seri: '4625Z03',
                custitemnumber_scv_core_weight: '24',
                memo: 'LG=24, ID: 18078',
                custitemnumber_scv_import_date: '07/11/2025',
                item: 15194,
                inventorynumber: '18078'
            },
            {
                custitemnumber_scv_item_num_color_seri: '4625Z04',
                custitemnumber_scv_core_weight: '24',
                memo: 'LG=24, ID: 18079',
                custitemnumber_scv_import_date: '07/11/2025',
                item: 15194,
                inventorynumber: '18079'
            },
            {
                custitemnumber_scv_item_num_color_seri: '4725I01',
                custitemnumber_scv_core_weight: '35',
                memo: 'LG=35, ID: 18080',
                custitemnumber_scv_import_date: '14/11/2025',
                item: 15194,
                inventorynumber: '18080'
            },
            {
                custitemnumber_scv_item_num_color_seri: '4725I02',
                custitemnumber_scv_core_weight: '35',
                memo: 'LG=35, ID: 18081',
                custitemnumber_scv_import_date: '14/11/2025',
                item: 15194,
                inventorynumber: '18081'
            },
            {
                custitemnumber_scv_item_num_color_seri: '4725I03',
                custitemnumber_scv_core_weight: '35',
                memo: 'LG=35, ID: 18082',
                custitemnumber_scv_import_date: '14/11/2025',
                item: 15194,
                inventorynumber: '18082'
            },
            {
                custitemnumber_scv_item_num_color_seri: '4725I04',
                custitemnumber_scv_core_weight: '35',
                memo: 'LG=35, ID: 18083',
                custitemnumber_scv_import_date: '14/11/2025',
                item: 15194,
                inventorynumber: '18083'
            },
            {
                custitemnumber_scv_item_num_color_seri: '4725I05',
                custitemnumber_scv_core_weight: '35',
                memo: 'LG=35, ID: 18084',
                custitemnumber_scv_import_date: '14/11/2025',
                item: 15194,
                inventorynumber: '18084'
            },
            {
                custitemnumber_scv_item_num_color_seri: '4725I06',
                custitemnumber_scv_core_weight: '26',
                memo: 'LG=26, ID: 18085',
                custitemnumber_scv_import_date: '14/11/2025',
                item: 15194,
                inventorynumber: '18085'
            },
            {
                custitemnumber_scv_item_num_color_seri: '4725I07',
                custitemnumber_scv_core_weight: '33',
                memo: 'LG=33, ID: 18086',
                custitemnumber_scv_import_date: '14/11/2025',
                item: 15194,
                inventorynumber: '18086'
            },
            {
                custitemnumber_scv_item_num_color_seri: '4725I08',
                custitemnumber_scv_core_weight: '28',
                memo: 'LG=28, ID: 18087',
                custitemnumber_scv_import_date: '14/11/2025',
                item: 15194,
                inventorynumber: '18087'
            },
            {
                custitemnumber_scv_item_num_color_seri: '4725I09',
                custitemnumber_scv_core_weight: '35',
                memo: 'LG=35, ID: 18088',
                custitemnumber_scv_import_date: '14/11/2025',
                item: 15194,
                inventorynumber: '18088'
            },
            {
                custitemnumber_scv_item_num_color_seri: '4725I10',
                custitemnumber_scv_core_weight: '35',
                memo: 'LG=35, ID: 18089',
                custitemnumber_scv_import_date: '14/11/2025',
                item: 15194,
                inventorynumber: '18089'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0121D01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 17509,
                inventorynumber: '13056'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0625D01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 15196,
                inventorynumber: '23203'
            },
            {
                custitemnumber_scv_item_num_color_seri: '1925Z01',
                custitemnumber_scv_core_weight: '20',
                memo: 'LS=20, ID: 18061',
                custitemnumber_scv_import_date: '07/11/2025',
                item: 14321,
                inventorynumber: '18061'
            },
            {
                custitemnumber_scv_item_num_color_seri: '1825Z01',
                custitemnumber_scv_core_weight: '20',
                memo: 'LS=20, ID: 18062',
                custitemnumber_scv_import_date: '07/11/2025',
                item: 14321,
                inventorynumber: '18062'
            },
            {
                custitemnumber_scv_item_num_color_seri: '1925Z02',
                custitemnumber_scv_core_weight: '20',
                memo: 'LS=20, ID: 18063',
                custitemnumber_scv_import_date: '07/11/2025',
                item: 14321,
                inventorynumber: '18063'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0425D01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14324,
                inventorynumber: '17900'
            },
            {
                custitemnumber_scv_item_num_color_seri: '1425G06',
                custitemnumber_scv_core_weight: '28',
                memo: 'LG=28, ID: 18102',
                custitemnumber_scv_import_date: '14/11/2025',
                item: 14505,
                inventorynumber: '18102'
            },
            {
                custitemnumber_scv_item_num_color_seri: '1425Z01',
                custitemnumber_scv_core_weight: '25',
                memo: 'LG=25, ID: 18068',
                custitemnumber_scv_import_date: '07/11/2025',
                item: 14328,
                inventorynumber: '18068'
            },
            {
                custitemnumber_scv_item_num_color_seri: '1525Z01',
                custitemnumber_scv_core_weight: '24',
                memo: 'LG=24, ID: 18069',
                custitemnumber_scv_import_date: '07/11/2025',
                item: 14328,
                inventorynumber: '18069'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0325Z01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14331,
                inventorynumber: '23097'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0124Z01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14332,
                inventorynumber: '22180'
            },
            {
                custitemnumber_scv_item_num_color_seri: '1325G04',
                custitemnumber_scv_core_weight: '24',
                memo: 'LG=24, ID: 18096',
                custitemnumber_scv_import_date: '14/11/2025',
                item: 14519,
                inventorynumber: '18096'
            },
            {
                custitemnumber_scv_item_num_color_seri: '1225G13',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14529,
                inventorynumber: '17767'
            },
            {
                custitemnumber_scv_item_num_color_seri: '1225G01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '10/10/2025',
                item: 14525,
                inventorynumber: '17755.2'
            },
            {
                custitemnumber_scv_item_num_color_seri: '1625G07',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14528,
                inventorynumber: '17940'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0125G01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14531,
                inventorynumber: '17793'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0122D01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14337,
                inventorynumber: '14931'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0125D01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14337,
                inventorynumber: '23210'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0625G01',
                custitemnumber_scv_core_weight: '11',
                memo: 'ID=17913  LS=11 26/08/2025',
                custitemnumber_scv_import_date: '26/08/2025',
                item: 14540,
                inventorynumber: '17913'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0725G01',
                custitemnumber_scv_core_weight: '11',
                memo: 'ID=17915  LS=11 26/08/2025',
                custitemnumber_scv_import_date: '',
                item: 14541,
                inventorynumber: '17915'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0525Z01',
                custitemnumber_scv_core_weight: '20',
                memo: 'LS=20, ID: 18064',
                custitemnumber_scv_import_date: '07/11/2025',
                item: 14340,
                inventorynumber: '18064'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0725Z01',
                custitemnumber_scv_core_weight: '25',
                memo: 'LG=25, ID: 18071',
                custitemnumber_scv_import_date: '07/11/2025',
                item: 14345,
                inventorynumber: '18071'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0725Z01',
                custitemnumber_scv_core_weight: '25',
                memo: 'NM3, LG= 25 kg',
                custitemnumber_scv_import_date: '11/09/2025',
                item: 14349,
                inventorynumber: '23222'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0125Z01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14350,
                inventorynumber: '23043'
            },
            {
                custitemnumber_scv_item_num_color_seri: '1325Z01',
                custitemnumber_scv_core_weight: '25',
                memo: 'LG=25, ID: 18065',
                custitemnumber_scv_import_date: '07/11/2025',
                item: 14353,
                inventorynumber: '18065'
            },
            {
                custitemnumber_scv_item_num_color_seri: '1425Z01',
                custitemnumber_scv_core_weight: '25',
                memo: 'LG=25, ID: 18066',
                custitemnumber_scv_import_date: '07/11/2025',
                item: 14353,
                inventorynumber: '18066'
            },
            {
                custitemnumber_scv_item_num_color_seri: '1125Z01',
                custitemnumber_scv_core_weight: '25',
                memo: 'LG=25, ID: 18072',
                custitemnumber_scv_import_date: '07/11/2025',
                item: 14355,
                inventorynumber: '18072'
            },
            {
                custitemnumber_scv_item_num_color_seri: '1225Z01',
                custitemnumber_scv_core_weight: '25',
                memo: 'LG=25, ID: 18073',
                custitemnumber_scv_import_date: '07/11/2025',
                item: 14355,
                inventorynumber: '18073'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0925Z01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14355,
                inventorynumber: '23224'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0725Z01',
                custitemnumber_scv_core_weight: '25',
                memo: 'LG=25, ID: 18067',
                custitemnumber_scv_import_date: '07/11/2025',
                item: 14357,
                inventorynumber: '18067'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0225Z01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14359,
                inventorynumber: '23226'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0124Z01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14364,
                inventorynumber: '16901'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0125Z01',
                custitemnumber_scv_core_weight: '24',
                memo: 'LG=24, ID: 18075',
                custitemnumber_scv_import_date: '07/11/2025',
                item: 14364,
                inventorynumber: '18075'
            },
            {
                custitemnumber_scv_item_num_color_seri: '1125S01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14362,
                inventorynumber: '18023'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0225D01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14369,
                inventorynumber: '17679'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0125S01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14370,
                inventorynumber: '4469'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0625Z01',
                custitemnumber_scv_core_weight: '25',
                memo: 'LG=25, ID: 18070',
                custitemnumber_scv_import_date: '07/11/2025',
                item: 14374,
                inventorynumber: '18070'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0425Z01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14374,
                inventorynumber: '23228'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0224Z01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14376,
                inventorynumber: '22229'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0325D01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14379,
                inventorynumber: '17901'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0425D01',
                custitemnumber_scv_core_weight: '26',
                memo: 'NM3, LG=26kg',
                custitemnumber_scv_import_date: '11/11/2025',
                item: 14384,
                inventorynumber: '23493'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0525B01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14399,
                inventorynumber: '17956'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0225G01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14402,
                inventorynumber: '17659'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0124S01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14415,
                inventorynumber: '3947'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0925Z01',
                custitemnumber_scv_core_weight: '25',
                memo: 'LG=25, ID: 18074',
                custitemnumber_scv_import_date: '07/11/2025',
                item: 14418,
                inventorynumber: '18074'
            },
            {
                custitemnumber_scv_item_num_color_seri: '3925D01',
                custitemnumber_scv_core_weight: '26',
                memo: 'LG=26, ID: 18053',
                custitemnumber_scv_import_date: '05/11/2025',
                item: 14421,
                inventorynumber: '18053'
            },
            {
                custitemnumber_scv_item_num_color_seri: '4025D01',
                custitemnumber_scv_core_weight: '26',
                memo: 'LG=26, ID: 18054',
                custitemnumber_scv_import_date: '05/11/2025',
                item: 14421,
                inventorynumber: '18054'
            },
            {
                custitemnumber_scv_item_num_color_seri: '4125D01',
                custitemnumber_scv_core_weight: '26',
                memo: 'LG=26, ID: 18055',
                custitemnumber_scv_import_date: '05/11/2025',
                item: 14421,
                inventorynumber: '18055'
            },
            {
                custitemnumber_scv_item_num_color_seri: '4225D01',
                custitemnumber_scv_core_weight: '26',
                memo: 'LG=26, ID: 18056',
                custitemnumber_scv_import_date: '05/11/2025',
                item: 14421,
                inventorynumber: '18056'
            },
            {
                custitemnumber_scv_item_num_color_seri: '4125D02',
                custitemnumber_scv_core_weight: '26',
                memo: 'LG=26, ID: 18057',
                custitemnumber_scv_import_date: '05/11/2025',
                item: 14421,
                inventorynumber: '18057'
            },
            {
                custitemnumber_scv_item_num_color_seri: '4125D03',
                custitemnumber_scv_core_weight: '26',
                memo: 'LG=26, ID: 18058',
                custitemnumber_scv_import_date: '05/11/2025',
                item: 14421,
                inventorynumber: '18058'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0924D01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14422,
                inventorynumber: '22459'
            },
            {
                custitemnumber_scv_item_num_color_seri: '1024D01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14422,
                inventorynumber: '22460'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0525D01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14422,
                inventorynumber: '23206'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0225D01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 15199,
                inventorynumber: '17703'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0625D01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 15199,
                inventorynumber: '4772'
            },
            {
                custitemnumber_scv_item_num_color_seri: '1625D01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14485,
                inventorynumber: '17563'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0325D01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14429,
                inventorynumber: '23208'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0224D02',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14430,
                inventorynumber: '16948'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0825N01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14431,
                inventorynumber: '23290'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0317D02',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14488,
                inventorynumber: '10611'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0125D01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14432,
                inventorynumber: '17283'
            },
            {
                custitemnumber_scv_item_num_color_seri: '1225D01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14439,
                inventorynumber: '23261'
            },
            {
                custitemnumber_scv_item_num_color_seri: '1725D02',
                custitemnumber_scv_core_weight: '32',
                memo: 'LG=32, ID: 18060',
                custitemnumber_scv_import_date: '05/11/2025',
                item: 14442,
                inventorynumber: '18060'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0225D01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14443,
                inventorynumber: '17863'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0125D01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '10/05/2025',
                item: 14447,
                inventorynumber: '22924'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0925N01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14449,
                inventorynumber: '23284'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0424D02',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14452,
                inventorynumber: '17114'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0225D04',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14497,
                inventorynumber: '17668'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0124D01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14458,
                inventorynumber: '17092'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0225D01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14458,
                inventorynumber: '23358'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0125D01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 27409,
                inventorynumber: '22917'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0125D01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14467,
                inventorynumber: '17561'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0224D01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14467,
                inventorynumber: '4264'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0325D01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14471,
                inventorynumber: '4570'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0124D01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14472,
                inventorynumber: '16945'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0125D01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14473,
                inventorynumber: '23202'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0125D02',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 29508,
                inventorynumber: '17772'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0925S01',
                custitemnumber_scv_core_weight: '18',
                memo: 'NM3, LS=18kg',
                custitemnumber_scv_import_date: '07/11/2025',
                item: 14294,
                inventorynumber: '23443'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0925S02',
                custitemnumber_scv_core_weight: '18',
                memo: 'NM3, LS=18kg',
                custitemnumber_scv_import_date: '07/11/2025',
                item: 14294,
                inventorynumber: '23444'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0925S03',
                custitemnumber_scv_core_weight: '18',
                memo: 'NM3, LS=18kg',
                custitemnumber_scv_import_date: '07/11/2025',
                item: 14294,
                inventorynumber: '23445'
            },
            {
                custitemnumber_scv_item_num_color_seri: '4925Z01',
                custitemnumber_scv_core_weight: '25',
                memo: 'NM3, LG=25kg',
                custitemnumber_scv_import_date: '08/11/2025',
                item: 14295,
                inventorynumber: '23468'
            },
            {
                custitemnumber_scv_item_num_color_seri: '5025Z03',
                custitemnumber_scv_core_weight: '20',
                memo: 'NM3, LS=20kg',
                custitemnumber_scv_import_date: '08/11/2025',
                item: 14296,
                inventorynumber: '23471'
            },
            {
                custitemnumber_scv_item_num_color_seri: '5025Z04',
                custitemnumber_scv_core_weight: '20',
                memo: 'NM3, LS=20kg',
                custitemnumber_scv_import_date: '08/11/2025',
                item: 14296,
                inventorynumber: '23472'
            },
            {
                custitemnumber_scv_item_num_color_seri: '5025Z05',
                custitemnumber_scv_core_weight: '20',
                memo: 'NM3, LS=20kg',
                custitemnumber_scv_import_date: '08/11/2025',
                item: 14296,
                inventorynumber: '23473'
            },
            {
                custitemnumber_scv_item_num_color_seri: '5025Z06',
                custitemnumber_scv_core_weight: '25',
                memo: 'NM3, LG=25kg',
                custitemnumber_scv_import_date: '08/11/2025',
                item: 14296,
                inventorynumber: '23474'
            },
            {
                custitemnumber_scv_item_num_color_seri: '5025Z07',
                custitemnumber_scv_core_weight: '25',
                memo: 'NM3, LG=25kg',
                custitemnumber_scv_import_date: '08/11/2025',
                item: 14296,
                inventorynumber: '23475'
            },
            {
                custitemnumber_scv_item_num_color_seri: '5025Z08',
                custitemnumber_scv_core_weight: '20',
                memo: 'NM3, LS=20kg',
                custitemnumber_scv_import_date: '08/11/2025',
                item: 14296,
                inventorynumber: '23476'
            },
            {
                custitemnumber_scv_item_num_color_seri: '5025Z09',
                custitemnumber_scv_core_weight: '24',
                memo: 'NM3, LG=24kg',
                custitemnumber_scv_import_date: '08/11/2025',
                item: 14296,
                inventorynumber: '23477'
            },
            {
                custitemnumber_scv_item_num_color_seri: '5025Z10',
                custitemnumber_scv_core_weight: '25',
                memo: 'NM3, LG=25kg',
                custitemnumber_scv_import_date: '08/11/2025',
                item: 14296,
                inventorynumber: '23478'
            },
            {
                custitemnumber_scv_item_num_color_seri: '5025Z12',
                custitemnumber_scv_core_weight: '20',
                memo: 'NM3, LS=20kg',
                custitemnumber_scv_import_date: '08/11/2025',
                item: 14296,
                inventorynumber: '23480'
            },
            {
                custitemnumber_scv_item_num_color_seri: '5025Z13',
                custitemnumber_scv_core_weight: '20',
                memo: 'NM3, LS=20kg',
                custitemnumber_scv_import_date: '08/11/2025',
                item: 14296,
                inventorynumber: '23481'
            },
            {
                custitemnumber_scv_item_num_color_seri: '2425S01',
                custitemnumber_scv_core_weight: '18',
                memo: 'NM3, LS=18kg',
                custitemnumber_scv_import_date: '07/11/2025',
                item: 14298,
                inventorynumber: '23446'
            },
            {
                custitemnumber_scv_item_num_color_seri: '2425S02',
                custitemnumber_scv_core_weight: '18',
                memo: 'NM3, LS=18kg',
                custitemnumber_scv_import_date: '07/11/2025',
                item: 14298,
                inventorynumber: '23447'
            },
            {
                custitemnumber_scv_item_num_color_seri: '2425S03',
                custitemnumber_scv_core_weight: '18',
                memo: 'NM3, LS=18kg',
                custitemnumber_scv_import_date: '07/11/2025',
                item: 14298,
                inventorynumber: '23448'
            },
            {
                custitemnumber_scv_item_num_color_seri: '2425S04',
                custitemnumber_scv_core_weight: '18',
                memo: 'NM3, LS=18kg',
                custitemnumber_scv_import_date: '07/11/2025',
                item: 14298,
                inventorynumber: '23449'
            },
            {
                custitemnumber_scv_item_num_color_seri: '1525D03',
                custitemnumber_scv_core_weight: '26',
                memo: 'NM3, LG=26kg',
                custitemnumber_scv_import_date: '11/11/2025',
                item: 15195,
                inventorynumber: '23490'
            },
            {
                custitemnumber_scv_item_num_color_seri: '1225D01',
                custitemnumber_scv_core_weight: '26',
                memo: 'NM3, LG=26kg',
                custitemnumber_scv_import_date: '11/11/2025',
                item: 15197,
                inventorynumber: '23491'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0125S32',
                custitemnumber_scv_core_weight: '18',
                memo: 'NM3, LS=18kg',
                custitemnumber_scv_import_date: '07/11/2025',
                item: 14311,
                inventorynumber: '23450'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0125S33',
                custitemnumber_scv_core_weight: '18',
                memo: 'NM3, LS=18kg',
                custitemnumber_scv_import_date: '07/11/2025',
                item: 14311,
                inventorynumber: '23451'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0525S08',
                custitemnumber_scv_core_weight: '18',
                memo: 'NM3, LS=18kg',
                custitemnumber_scv_import_date: '07/11/2025',
                item: 14326,
                inventorynumber: '23452'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0525S10',
                custitemnumber_scv_core_weight: '18',
                memo: 'NM3, LS=18kg',
                custitemnumber_scv_import_date: '07/11/2025',
                item: 14326,
                inventorynumber: '23454'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0525S11',
                custitemnumber_scv_core_weight: '18',
                memo: 'NM3, LS=18kg',
                custitemnumber_scv_import_date: '07/11/2025',
                item: 14326,
                inventorynumber: '23455'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0625S01',
                custitemnumber_scv_core_weight: '18',
                memo: 'NM3, LS=18kg',
                custitemnumber_scv_import_date: '07/11/2025',
                item: 14326,
                inventorynumber: '23456'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0525S12',
                custitemnumber_scv_core_weight: '18',
                memo: 'NM3, LS=18kg',
                custitemnumber_scv_import_date: '07/11/2025',
                item: 14326,
                inventorynumber: '23457'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0525S13',
                custitemnumber_scv_core_weight: '18',
                memo: 'NM3, LS=18kg',
                custitemnumber_scv_import_date: '07/11/2025',
                item: 14326,
                inventorynumber: '23458'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0525S14',
                custitemnumber_scv_core_weight: '18',
                memo: 'NM3, LS=18kg',
                custitemnumber_scv_import_date: '07/11/2025',
                item: 14326,
                inventorynumber: '23459'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0925S01',
                custitemnumber_scv_core_weight: '18',
                memo: 'NM3, LS=18kg',
                custitemnumber_scv_import_date: '07/11/2025',
                item: 14344,
                inventorynumber: '23460'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0525S01',
                custitemnumber_scv_core_weight: '18',
                memo: 'NM3, LS=18kg',
                custitemnumber_scv_import_date: '07/11/2025',
                item: 14351,
                inventorynumber: '23461'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0925S01',
                custitemnumber_scv_core_weight: '18',
                memo: 'NM3, LS=18kg',
                custitemnumber_scv_import_date: '07/11/2025',
                item: 14361,
                inventorynumber: '23462'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0725S01',
                custitemnumber_scv_core_weight: '18',
                memo: 'NM3, LS=18kg',
                custitemnumber_scv_import_date: '07/11/2025',
                item: 14377,
                inventorynumber: '23463'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0725S02',
                custitemnumber_scv_core_weight: '18',
                memo: 'NM3, LS=18kg',
                custitemnumber_scv_import_date: '07/11/2025',
                item: 14377,
                inventorynumber: '23464'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0625S01',
                custitemnumber_scv_core_weight: '18',
                memo: 'NM3, LS=18kg',
                custitemnumber_scv_import_date: '07/11/2025',
                item: 14382,
                inventorynumber: '23465'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0225D01',
                custitemnumber_scv_core_weight: '26',
                memo: 'NM3, LG=26kg',
                custitemnumber_scv_import_date: '11/11/2025',
                item: 14447,
                inventorynumber: '23496'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0525D01',
                custitemnumber_scv_core_weight: '26',
                memo: 'NM3, LG=26kg',
                custitemnumber_scv_import_date: '11/11/2025',
                item: 14452,
                inventorynumber: '23484'
            },
            {
                custitemnumber_scv_item_num_color_seri: '1225Z01',
                custitemnumber_scv_core_weight: '24',
                memo: 'LG=24 , ID: 17949 11/09/2025',
                custitemnumber_scv_import_date: '11/09/2025',
                item: 14303,
                inventorynumber: '17949'
            },
            {
                custitemnumber_scv_item_num_color_seri: '1225G04',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14501,
                inventorynumber: '17754'
            },
            {
                custitemnumber_scv_item_num_color_seri: '1225G05',
                custitemnumber_scv_core_weight: '21',
                memo: 'ID=17918  LG=21 26/08/2025',
                custitemnumber_scv_import_date: '26/08/2025',
                item: 14508,
                inventorynumber: '17918'
            },
            {
                custitemnumber_scv_item_num_color_seri: '1425G07',
                custitemnumber_scv_core_weight: '22',
                memo: 'LG=22, ID: 18103',
                custitemnumber_scv_import_date: '14/11/2025',
                item: 14508,
                inventorynumber: '18103'
            },
            {
                custitemnumber_scv_item_num_color_seri: '1425G08',
                custitemnumber_scv_core_weight: '24',
                memo: 'LG=24, ID: 18104',
                custitemnumber_scv_import_date: '14/11/2025',
                item: 14508,
                inventorynumber: '18104'
            },
            {
                custitemnumber_scv_item_num_color_seri: '1425G02',
                custitemnumber_scv_core_weight: '15',
                memo: 'LG=15, ID: 18091',
                custitemnumber_scv_import_date: '14/11/2025',
                item: 14506,
                inventorynumber: '18091'
            },
            {
                custitemnumber_scv_item_num_color_seri: '1425G03',
                custitemnumber_scv_core_weight: '13',
                memo: 'LG=13, ID: 18092',
                custitemnumber_scv_import_date: '14/11/2025',
                item: 14506,
                inventorynumber: '18092'
            },
            {
                custitemnumber_scv_item_num_color_seri: '1425G05',
                custitemnumber_scv_core_weight: '13',
                memo: 'LG=13, ID: 18098',
                custitemnumber_scv_import_date: '14/11/2025',
                item: 14507,
                inventorynumber: '18098'
            },
            {
                custitemnumber_scv_item_num_color_seri: '1025Z03',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14328,
                inventorynumber: '23219'
            },
            {
                custitemnumber_scv_item_num_color_seri: '1325G02',
                custitemnumber_scv_core_weight: '19',
                memo: 'LG=19, ID: 18094',
                custitemnumber_scv_import_date: '14/11/2025',
                item: 14519,
                inventorynumber: '18094'
            },
            {
                custitemnumber_scv_item_num_color_seri: '1325G03',
                custitemnumber_scv_core_weight: '21',
                memo: 'LG=21, ID: 18095',
                custitemnumber_scv_import_date: '14/11/2025',
                item: 14519,
                inventorynumber: '18095'
            },
            {
                custitemnumber_scv_item_num_color_seri: '1325G06',
                custitemnumber_scv_core_weight: '23',
                memo: 'LG=23, ID: 18100',
                custitemnumber_scv_import_date: '14/11/2025',
                item: 14520,
                inventorynumber: '18100'
            },
            {
                custitemnumber_scv_item_num_color_seri: '1325G07',
                custitemnumber_scv_core_weight: '15',
                memo: 'LG=15, ID: 18101',
                custitemnumber_scv_import_date: '14/11/2025',
                item: 14520,
                inventorynumber: '18101'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0325G01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14366,
                inventorynumber: '17784'
            },
            {
                custitemnumber_scv_item_num_color_seri: '3525D01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14421,
                inventorynumber: '23257'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0625D01',
                custitemnumber_scv_core_weight: '26',
                memo: 'NM3, LG=26kg',
                custitemnumber_scv_import_date: '09/09/2025',
                item: 14433,
                inventorynumber: '23193'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0125D01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14440,
                inventorynumber: '17622'
            },
            {
                custitemnumber_scv_item_num_color_seri: '1725D01',
                custitemnumber_scv_core_weight: '32',
                memo: 'LG=32, ID: 18059',
                custitemnumber_scv_import_date: '05/11/2025',
                item: 14442,
                inventorynumber: '18059'
            },
            {
                custitemnumber_scv_item_num_color_seri: '2425S01',
                custitemnumber_scv_core_weight: '18',
                memo: 'NM3, LS=18kg',
                custitemnumber_scv_import_date: '07/11/2025',
                item: 14298,
                inventorynumber: '23446'
            },
            {
                custitemnumber_scv_item_num_color_seri: '2425S01',
                custitemnumber_scv_core_weight: '18',
                memo: 'NM3, LS=18kg',
                custitemnumber_scv_import_date: '07/11/2025',
                item: 14298,
                inventorynumber: '23446'
            },
            {
                custitemnumber_scv_item_num_color_seri: '2425S03',
                custitemnumber_scv_core_weight: '18',
                memo: 'NM3, LS=18kg',
                custitemnumber_scv_import_date: '07/11/2025',
                item: 14298,
                inventorynumber: '23448'
            },
            {
                custitemnumber_scv_item_num_color_seri: '2425S03',
                custitemnumber_scv_core_weight: '18',
                memo: 'NM3, LS=18kg',
                custitemnumber_scv_import_date: '07/11/2025',
                item: 14298,
                inventorynumber: '23448'
            },
            {
                custitemnumber_scv_item_num_color_seri: '1225Z01',
                custitemnumber_scv_core_weight: '24',
                memo: 'LG=24 , ID: 17949 11/09/2025',
                custitemnumber_scv_import_date: '11/09/2025',
                item: 14303,
                inventorynumber: '17949'
            },
            {
                custitemnumber_scv_item_num_color_seri: '4725I02',
                custitemnumber_scv_core_weight: '35',
                memo: 'LG=35, ID: 18081',
                custitemnumber_scv_import_date: '14/11/2025',
                item: 15194,
                inventorynumber: '18081'
            },
            {
                custitemnumber_scv_item_num_color_seri: '4725I06',
                custitemnumber_scv_core_weight: '26',
                memo: 'LG=26, ID: 18085',
                custitemnumber_scv_import_date: '14/11/2025',
                item: 15194,
                inventorynumber: '18085'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0525S13',
                custitemnumber_scv_core_weight: '18',
                memo: 'NM3, LS=18kg',
                custitemnumber_scv_import_date: '07/11/2025',
                item: 14326,
                inventorynumber: '23458'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0525S13',
                custitemnumber_scv_core_weight: '18',
                memo: 'NM3, LS=18kg',
                custitemnumber_scv_import_date: '07/11/2025',
                item: 14326,
                inventorynumber: '23458'
            },
            {
                custitemnumber_scv_item_num_color_seri: '1025Z03',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14328,
                inventorynumber: '23219'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0224D02',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14430,
                inventorynumber: '16948'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0625D01',
                custitemnumber_scv_core_weight: '26',
                memo: 'NM3, LG=26kg',
                custitemnumber_scv_import_date: '09/09/2025',
                item: 14433,
                inventorynumber: '23193'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0125D01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14440,
                inventorynumber: '17622'
            },
            {
                custitemnumber_scv_item_num_color_seri: '4025I11',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14296,
                inventorynumber: '23279'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0725G01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14301,
                inventorynumber: '17941'
            },
            {
                custitemnumber_scv_item_num_color_seri: '1425G01',
                custitemnumber_scv_core_weight: '23',
                memo: 'LG=23  ID: 17997',
                custitemnumber_scv_import_date: '17/10/2025',
                item: 14303,
                inventorynumber: '17997'
            },
            {
                custitemnumber_scv_item_num_color_seri: '4625Z02',
                custitemnumber_scv_core_weight: '24',
                memo: 'LG=24, ID: 18077',
                custitemnumber_scv_import_date: '07/11/2025',
                item: 15194,
                inventorynumber: '18077'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0925D01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14309,
                inventorynumber: '17795'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0425D01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14324,
                inventorynumber: '17900'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0225S09',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14326,
                inventorynumber: '23301'
            },
            {
                custitemnumber_scv_item_num_color_seri: '1225G13',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14529,
                inventorynumber: '17767'
            },
            {
                custitemnumber_scv_item_num_color_seri: '1625G07',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14528,
                inventorynumber: '17940'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0825S02',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14348,
                inventorynumber: '4629'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0125Z01',
                custitemnumber_scv_core_weight: '24',
                memo: 'LG=24, ID: 18075',
                custitemnumber_scv_import_date: '07/11/2025',
                item: 14364,
                inventorynumber: '18075'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0425B01',
                custitemnumber_scv_core_weight: '20',
                memo: 'NM1, LS=20kg',
                custitemnumber_scv_import_date: '20/11/2025',
                item: 14408,
                inventorynumber: '4787'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0425D02',
                custitemnumber_scv_core_weight: '31',
                memo: 'NM3, LG=31kg',
                custitemnumber_scv_import_date: '11/11/2025',
                item: 15204,
                inventorynumber: '23487'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0325D01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14429,
                inventorynumber: '23208'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0725N01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14431,
                inventorynumber: '23163'
            },
            {
                custitemnumber_scv_item_num_color_seri: '1225D01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14439,
                inventorynumber: '23261'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0525N01',
                custitemnumber_scv_core_weight: '',
                memo: '',
                custitemnumber_scv_import_date: '',
                item: 14444,
                inventorynumber: '17867'
            },
            {
                custitemnumber_scv_item_num_color_seri: '0325D01',
                custitemnumber_scv_core_weight: '26',
                memo: 'NM3, LG=26kg',
                custitemnumber_scv_import_date: '11/11/2025',
                item: 14455,
                inventorynumber: '23497'
            }
        
        ]
        
        /**
         * Defines the function that is executed when the map entry point is triggered. This entry point is triggered automatically
         * when the associated getInputData stage is complete. This function is applied to each key-value pair in the provided
         * context.
         * @param {Object} mapContext - Data collection containing the key-value pairs to process in the map stage. This parameter
         *     is provided automatically based on the results of the getInputData stage.
         * @param {Iterator} mapContext.errors - Serialized errors that were thrown during previous attempts to execute the map
         *     function on the current key-value pair
         * @param {number} mapContext.executionNo - Number of times the map function has been executed on the current key-value
         *     pair
         * @param {boolean} mapContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} mapContext.key - Key to be processed during the map stage
         * @param {string} mapContext.value - Value to be processed during the map stage
         * @since 2015.2
         */
        
        const map = (mapContext) => {
            let value = JSON.parse(mapContext.value);
            let sql = `select in.id from inventorynumber in where in.item = ${value.item} and in.inventorynumber = '${value.inventorynumber}'`;
            let results = query.runSuiteQL({query: sql}).asMappedResults();
            let objNumber = results[0];
            if (objNumber) {
                record.submitFields({
                    type: 'inventorynumber', id: objNumber.id, values: {
                        custitemnumber_scv_item_num_color_seri: value.custitemnumber_scv_item_num_color_seri,
                        custitemnumber_scv_core_weight: value.custitemnumber_scv_core_weight,
                        memo: value.memo,
                        custitemnumber_scv_import_date: value.custitemnumber_scv_import_date
                    }
                })
            }
        }
        
        /**
         * Defines the function that is executed when the reduce entry point is triggered. This entry point is triggered
         * automatically when the associated map stage is complete. This function is applied to each group in the provided context.
         * @param {Object} reduceContext - Data collection containing the groups to process in the reduce stage. This parameter is
         *     provided automatically based on the results of the map stage.
         * @param {Iterator} reduceContext.errors - Serialized errors that were thrown during previous attempts to execute the
         *     reduce function on the current group
         * @param {number} reduceContext.executionNo - Number of times the reduce function has been executed on the current group
         * @param {boolean} reduceContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} reduceContext.key - Key to be processed during the reduce stage
         * @param {List<String>} reduceContext.values - All values associated with a unique key that was passed to the reduce stage
         *     for processing
         * @since 2015.2
         */
        const reduce = (reduceContext) => {
        
        }
        
        
        /**
         * Defines the function that is executed when the summarize entry point is triggered. This entry point is triggered
         * automatically when the associated reduce stage is complete. This function is applied to the entire result set.
         * @param {Object} summaryContext - Statistics about the execution of a map/reduce script
         * @param {number} summaryContext.concurrency - Maximum concurrency number when executing parallel tasks for the map/reduce
         *     script
         * @param {Date} summaryContext.dateCreated - The date and time when the map/reduce script began running
         * @param {boolean} summaryContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Iterator} summaryContext.output - Serialized keys and values that were saved as output during the reduce stage
         * @param {number} summaryContext.seconds - Total seconds elapsed when running the map/reduce script
         * @param {number} summaryContext.usage - Total number of governance usage units consumed when running the map/reduce
         *     script
         * @param {number} summaryContext.yields - Total number of yields when running the map/reduce script
         * @param {Object} summaryContext.inputSummary - Statistics about the input stage
         * @param {Object} summaryContext.mapSummary - Statistics about the map stage
         * @param {Object} summaryContext.reduceSummary - Statistics about the reduce stage
         * @since 2015.2
         */
        const summarize = (summaryContext) => {
        
        }
        
        return {getInputData, map, reduce, summarize}
        
    });
