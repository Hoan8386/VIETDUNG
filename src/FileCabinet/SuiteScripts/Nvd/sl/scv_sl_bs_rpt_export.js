/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(
    ['N/file', 'N/search'],
    (file, search) => {
        
        /**
         * Definition of the Suitelet script trigger point.
         *
         * @param {Object} context
         * @param {ServerRequest} context.request - Encapsulation of the incoming request
         * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         */
        const onRequest = (context) => {
            let request = context.request;
            let parameters = request.parameters;
            if (context.request.method === 'GET') {
                let dataHeader = getDataHeader(parameters);
                let dataDetail = getDataDetail(parameters);
                
                let templatePath = '../xml/fs_report/scv_fs_bs.xml';
                let namefile = 'BS Report.xls';
                let fileObject = file.load({
                    id: templatePath
                });
                let content = fileObject.getContents();
                content = content.replace(/{pSubsidiary}/gi, dataHeader.SubName);
                content = content.replace(/{pAddress}/gi, dataHeader.SubAddress);
                content = content.replace(/{pCurTodate}/gi, dataHeader.CurrentDate);
                for (let idx_maso = 0; idx_maso < dataDetail.length; idx_maso++) {
                    content = content.replace("{pCur_" + dataDetail[idx_maso].maso + "}", Number(dataDetail[idx_maso].amtCur));
                    content = content.replace("{pBef_" + dataDetail[idx_maso].maso + "}", Number(dataDetail[idx_maso].amtBef));
                }
                let f = file.create({
                    name: namefile,
                    fileType: file.Type.XMLDOC,
                    contents: content,
                    encoding: file.Encoding.UTF8,
                });
                context.response.writeFile(f, false);
            }
        }
        
        const getDataHeader = (_params) => {
            let subsidiary = _params.custpage_subsidiary;
            let lkSubsidiary = search.lookupFields({
                type: search.Type.SUBSIDIARY, id: subsidiary.split(",")[0], columns: ['legalname',
                    'address.address']
            });
            return {
                SubName: lkSubsidiary.legalname,
                SubAddress: lkSubsidiary['address.address'],
                CurrentDate: _params.curtodt_header
            };
        }
        
        const getDataDetail = (_params) => {
            let myData = [];
            let myDataCur = getDataDetailCur(_params);
            let myDataBef = getDataDetailBef(_params);
            let arrMaSo = getListMaSo();
            for (let i = 0; i < arrMaSo.length; i++) {
                let objData = {
                    maso: arrMaSo[i].maso,
                    amtCur: 0,
                    amtBef: 0
                };
                let objCur = findByMaSo(myDataCur, objData.maso);
                let objBef = findByMaSo(myDataBef, objData.maso);
                if (objCur) {
                    objData.amtCur = Number(objCur.amt) * arrMaSo[i].factor;
                }
                if (objBef) {
                    objData.amtBef = Number(objBef.amt) * arrMaSo[i].factor;
                }
                myData.push(objData);
            }
            return myData;
        }
        
        const getDataDetailCur = (_params) => {
            let resultSearch = search.load("customsearch_scv_report_bs");
            let myFilter = resultSearch.filters;
            let myColumns = resultSearch.columns;
            if (_params.custpage_subsidiary) {
                myFilter.push(search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.ANYOF,
                    values: _params.custpage_subsidiary.split(","),
                }));
            }
            
            if (_params.custpage_curtodt) {
                myFilter.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.ONORBEFORE,
                    values: _params.custpage_curtodt
                }));
            }
            
            resultSearch = resultSearch.runPaged({pageSize: 1000});
            let myData = [];
            for (let i = 0; i < resultSearch.pageRanges.length; i++) {
                let dataPage = resultSearch.fetch(i).data;
                for (let idx in dataPage) {
                    let obj = {};
                    let chitieu = dataPage[idx].getValue(myColumns[0]);
                    obj.maso = chitieu.substring(0, chitieu.indexOf("-")).trim();
                    obj.amt = Number(dataPage[idx].getValue(myColumns[1]));
                    myData.push(obj);
                }
            }
            return myData;
        }
        
        const getDataDetailBef = (_params) => {
            let resultSearch = search.load("customsearch_scv_report_bs");
            let myFilter = resultSearch.filters;
            let myColumns = resultSearch.columns;
            if (_params.custpage_subsidiary) {
                myFilter.push(search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.ANYOF,
                    values: _params.custpage_subsidiary.split(","),
                }));
            }
            if (_params.custpage_beftodt) {
                myFilter.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.ONORBEFORE,
                    values: _params.custpage_beftodt
                }));
            }
            
            resultSearch = resultSearch.runPaged({pageSize: 1000});
            let myData = [];
            for (let i = 0; i < resultSearch.pageRanges.length; i++) {
                let dataPage = resultSearch.fetch(i).data;
                for (let idx in dataPage) {
                    let obj = {};
                    let chitieu = dataPage[idx].getValue(myColumns[0]);
                    obj.maso = chitieu.substring(0, chitieu.indexOf("-")).trim();
                    obj.amt = Number(dataPage[idx].getValue(myColumns[1]));
                    myData.push(obj);
                }
            }
            return myData;
        }
        
        const getListMaSo = () => {
            return [
                {maso: "100", factor: 1, chitieu: "A - TÀI SẢN NGẮN HẠN"},
                {maso: "110", factor: 1, chitieu: "I. Tiền và các khoản tương đương tiền"},
                {maso: "111", factor: -1, chitieu: "1. Tiền "},
                {maso: "112", factor: -1, chitieu: "2. Các khoản tương đương tiền"},
                {maso: "120", factor: 1, chitieu: "II. Đầu tư tài chính ngắn hạn"},
                {maso: "121", factor: -1, chitieu: "1. Chứng khoán kinh doanh"},
                {maso: "122", factor: -1, chitieu: "2. Dự phòng giảm giá chứng khoán kinh doanh (*)"},
                {maso: "123", factor: -1, chitieu: "3. Đầu tư nắm giữ đến ngày đáo hạn"},
                {maso: "130", factor: 1, chitieu: "III. Các khoản phải thu ngắn hạn"},
                {maso: "131", factor: -1, chitieu: "1. Phải thu ngắn hạn của khách hàng "},
                {maso: "132", factor: -1, chitieu: "2. Trả trước cho người bán ngắn hạn"},
                {maso: "133", factor: -1, chitieu: "3. Phải thu nội bộ ngắn hạn"},
                {maso: "134", factor: -1, chitieu: "4. Phải thu theo tiến độ kế hoạch hợp đồng xây dựng"},
                {maso: "135", factor: -1, chitieu: "5. Phải thu về cho vay ngắn hạn"},
                {maso: "136", factor: -1, chitieu: "6. Phải thu ngắn hạn khác"},
                {maso: "137", factor: -1, chitieu: "7. Dự phòng phải thu ngắn hạn khó đòi (*)"},
                {maso: "139", factor: -1, chitieu: "8. Tài sản thiếu chờ xử lý"},
                {maso: "140", factor: 1, chitieu: "IV. Hàng tồn kho"},
                {maso: "141", factor: -1, chitieu: "1. Hàng tồn kho"},
                {maso: "149", factor: -1, chitieu: "2. Dự phòng giảm giá hàng tồn kho (*)"},
                {maso: "150", factor: 1, chitieu: "V. Tài sản ngắn hạn khác"},
                {maso: "151", factor: -1, chitieu: "1. Chi phí trả trước ngắn hạn "},
                {maso: "152", factor: -1, chitieu: "2. Thuế GTGT được khấu trừ"},
                {maso: "153", factor: -1, chitieu: "3. Thuế và các khoản khác phải thu Nhà nước"},
                {maso: "154", factor: -1, chitieu: "4. Giao dịch mua bán lại trái phiếu Chính phủ"},
                {maso: "155", factor: -1, chitieu: "5. Tài sản ngắn hạn khác"},
                {maso: "200", factor: 1, chitieu: "B - TÀI SẢN DÀI HẠN"},
                {maso: "210", factor: 1, chitieu: "I. Các khoản phải thu dài hạn "},
                {maso: "211", factor: -1, chitieu: "1. Phải thu dài hạn của khách hàng"},
                {maso: "212", factor: -1, chitieu: "2. Trả trước cho người bán dài hạn"},
                {maso: "213", factor: -1, chitieu: "3. Vốn kinh doanh ở đơn vị trực thuộc"},
                {maso: "214", factor: -1, chitieu: "4. Phải thu nội bộ dài hạn"},
                {maso: "215", factor: -1, chitieu: "5. Phải thu về cho vay dài hạn"},
                {maso: "216", factor: -1, chitieu: "6. Phải thu dài hạn khác"},
                {maso: "219", factor: -1, chitieu: "7. Dự phòng phải thu dài hạn khó đòi (*)"},
                {maso: "220", factor: 1, chitieu: "II. Tài sản cố định"},
                {maso: "221", factor: 1, chitieu: "1. Tài sản cố định hữu hình"},
                {maso: "222", factor: -1, chitieu: "      - Nguyên giá"},
                {maso: "223", factor: -1, chitieu: "      - Giá trị hao mòn luỹ kế (*)"},
                {maso: "224", factor: 1, chitieu: "2. Tài sản cố định thuê tài chính"},
                {maso: "225", factor: -1, chitieu: "      - Nguyên giá"},
                {maso: "226", factor: -1, chitieu: "      - Giá trị hao mòn luỹ kế (*)"},
                {maso: "227", factor: 1, chitieu: "3. Tài sản cố định vô hình"},
                {maso: "228", factor: -1, chitieu: "      - Nguyên giá"},
                {maso: "229", factor: -1, chitieu: "      - Giá trị hao mòn luỹ kế (*)"},
                {maso: "230", factor: 1, chitieu: "III. Bất động sản đầu tư"},
                {maso: "231", factor: -1, chitieu: "      - Nguyên giá"},
                {maso: "232", factor: -1, chitieu: "      - Giá trị hao mòn luỹ kế (*)"},
                {maso: "240", factor: 1, chitieu: "IV. Tài sản dở dang dài hạn "},
                {maso: "241", factor: -1, chitieu: "1. Chi phí sản xuất, kinh doanh dở dang dài hạn "},
                {maso: "242", factor: -1, chitieu: "2. Chi phí xây dựng cơ bản dở dang"},
                {maso: "250", factor: 1, chitieu: "V. Đầu tư tài chính dài hạn"},
                {maso: "251", factor: -1, chitieu: "1. Đầu tư vào công ty con "},
                {maso: "252", factor: -1, chitieu: "2. Đầu tư vào công ty liên doanh, liên kết"},
                {maso: "253", factor: -1, chitieu: "3. Đầu tư góp vốn vào đơn vị khác"},
                {maso: "254", factor: -1, chitieu: "4. Dự phòng đầu tư tài chính dài hạn (*)"},
                {maso: "255", factor: -1, chitieu: "5. Đầu tư nắm giữ đến ngày đáo hạn"},
                {maso: "260", factor: 1, chitieu: "VI. Tài sản dài hạn khác"},
                {maso: "261", factor: -1, chitieu: "1. Chi phí trả trước dài hạn"},
                {maso: "262", factor: -1, chitieu: "2. Tài sản thuế thu nhập hoãn lại"},
                {maso: "263", factor: -1, chitieu: "3. Thiết bị, vật tư, phụ tùng thay thế dài hạn"},
                {maso: "268", factor: -1, chitieu: "4. Tài sản dài hạn khác"},
                {maso: "270", factor: 1, chitieu: "TỔNG CỘNG TÀI SẢN (270 = 100 + 200)"},
                {maso: "300", factor: 1, chitieu: "C - NỢ PHẢI TRẢ"},
                {maso: "310", factor: 1, chitieu: "I. Nợ ngắn hạn"},
                {maso: "311", factor: 1, chitieu: "1. Phải trả người bán ngắn hạn"},
                {maso: "312", factor: 1, chitieu: "2. Người mua trả tiền trước ngắn hạn"},
                {maso: "313", factor: 1, chitieu: "3. Thuế và các khoản phải nộp Nhà nước"},
                {maso: "314", factor: 1, chitieu: "4. Phải trả người lao động"},
                {maso: "315", factor: 1, chitieu: "5. Chi phí phải trả ngắn hạn"},
                {maso: "316", factor: 1, chitieu: "6. Phải trả nội bộ ngắn hạn"},
                {maso: "317", factor: 1, chitieu: "7. Phải trả theo tiến độ kế hoạch hợp đồng xây dựng"},
                {maso: "318", factor: 1, chitieu: "8. Doanh thu chưa thực hiện ngắn hạn "},
                {maso: "319", factor: 1, chitieu: "9. Phải trả ngắn hạn khác"},
                {maso: "320", factor: 1, chitieu: "10. Vay và nợ thuê tài chính ngắn hạn"},
                {maso: "321", factor: 1, chitieu: "11. Dự phòng phải trả ngắn hạn "},
                {maso: "322", factor: 1, chitieu: "12. Quỹ khen thưởng, phúc lợi "},
                {maso: "323", factor: 1, chitieu: "13. Quỹ bình ổn giá"},
                {maso: "324", factor: 1, chitieu: "14. Giao dịch mua bán lại trái phiếu Chính phủ"},
                {maso: "330", factor: 1, chitieu: "II. Nợ dài hạn"},
                {maso: "331", factor: 1, chitieu: "1. Phải trả người bán dài hạn"},
                {maso: "332", factor: 1, chitieu: "2. Người mua trả tiền trước dài hạn"},
                {maso: "333", factor: 1, chitieu: "3. Chi phí phải trả dài hạn"},
                {maso: "334", factor: 1, chitieu: "4. Phải trả nội bộ về vốn kinh doanh"},
                {maso: "335", factor: 1, chitieu: "5. Phải trả nội bộ dài hạn"},
                {maso: "336", factor: 1, chitieu: "6. Doanh thu chưa thực hiện dài hạn "},
                {maso: "337", factor: 1, chitieu: "7. Phải trả dài hạn khác"},
                {maso: "338", factor: 1, chitieu: "8. Vay và nợ thuê tài chính dài hạn "},
                {maso: "339", factor: 1, chitieu: "9. Trái phiếu chuyển đổi"},
                {maso: "340", factor: 1, chitieu: "10. Cổ phiếu ưu đãi"},
                {maso: "341", factor: 1, chitieu: "11. Thuế thu nhập hoãn lại phải trả "},
                {maso: "342", factor: 1, chitieu: "12. Dự phòng phải trả dài hạn "},
                {maso: "343", factor: 1, chitieu: "13. Quỹ phát triển khoa học và công nghệ"},
                {maso: "400", factor: 1, chitieu: "D - VỐN CHỦ SỞ HỮU"},
                {maso: "410", factor: 1, chitieu: "I. Vốn chủ sở hữu"},
                {maso: "411", factor: 1, chitieu: "1. Vốn góp của chủ sở hữu"},
                {maso: "411a", factor: 1, chitieu: "    - Cổ phiếu phổ thông có quyền biểu quyết"},
                {maso: "411b", factor: 1, chitieu: "    - Cổ phiếu ưu đãi"},
                {maso: "412", factor: 1, chitieu: "2. Thặng dư vốn cổ phần"},
                {maso: "413", factor: 1, chitieu: "3. Quyền chọn chuyển đổi trái phiếu"},
                {maso: "414", factor: 1, chitieu: "4. Vốn khác của chủ sở hữu "},
                {maso: "415", factor: 1, chitieu: "5. Cổ phiếu quỹ (*)"},
                {maso: "416", factor: 1, chitieu: "6. Chênh lệch đánh giá lại tài sản"},
                {maso: "417", factor: 1, chitieu: "7. Chênh lệch tỷ giá hối đoái"},
                {maso: "418", factor: 1, chitieu: "8. Quỹ đầu tư phát triển"},
                {maso: "419", factor: 1, chitieu: "9. Quỹ hỗ trợ sắp xếp doanh nghiệp"},
                {maso: "420", factor: 1, chitieu: "10. Quỹ khác thuộc vốn chủ sở hữu"},
                {maso: "421", factor: 1, chitieu: "11. Lợi nhuận sau thuế chưa phân phối"},
                {maso: "421a", factor: 1, chitieu: "     - LNST chưa phân phối lũy kế đến cuối kỳ trước"},
                {maso: "421b", factor: 1, chitieu: "     - LNST chưa phân phối kỳ này"},
                {maso: "422", factor: 1, chitieu: "12. Nguồn vốn đầu tư XDCB"},
                {maso: "430", factor: 1, chitieu: "II. Nguồn kinh phí và quỹ khác"},
                {maso: "431", factor: 1, chitieu: "  1. Nguồn kinh phí "},
                {maso: "432", factor: 1, chitieu: "  2. Nguồn kinh phí đã hình thành TSCĐ"},
                {maso: "440", factor: 1, chitieu: "TỔNG CỘNG NGUỒN VỐN (440 = 300 + 400)"}
            ];
        }
        
        const findByMaSo = (_arrFind, _maso) => {
            return _arrFind.find(o => o.maso === _maso);
        }
        
        return {
            onRequest
        };
        
    });
