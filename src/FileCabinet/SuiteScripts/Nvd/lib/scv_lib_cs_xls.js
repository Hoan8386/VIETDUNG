/**
 * Nội dung: hỗ trợ call data asyn by ajax, hỗ trợ xuất export theo exceljs
 * =======================================================================================
 *  Date                Author                  Description
 * 19 Dec 2023          Huy Pham                Int create file, move from VLG
 */
define(['N/search'],
    /**
     * @param {search} search
     */
    function(search) {
        if(typeof ExcelJS == "undefined"){
            jQuery.getScript('https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.3.0/exceljs.min.js');
        }
        if(typeof saveAs == "undefined"){
            jQuery.getScript('https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js');
        }

        const loadWorkbookFromUrl = async (_urlFile, _callbackSucc) => {
            let workbook = null;

            await fetch(_urlFile).then(res => res.blob())
                .then(async blob => {
                    let buf = await blob.arrayBuffer();
                    workbook = new ExcelJS.Workbook();
                    await workbook.xlsx.load(buf);

                    if(typeof _callbackSucc == "function"){
                        _callbackSucc(workbook);
                    }
                })

            return workbook;
        }

        const saveWorkbook = async (_workbook, _name) => {
            _workbook.xlsx.writeBuffer().then(function(buffer) {
                saveAs(new Blob([buffer]), _name);
            });
        }

        const isContainValue = (value) => {
            let isContain = false;
            if(value !== undefined && value !== null && value !== '') {
                if(util.isArray(value)) {
                    if(value.length > 0) {
                        isContain = true;
                    }
                } else {
                    isContain = true;
                }
            }
            return isContain;
        }

        const syncRangeMergeAfterInsertRow = (_ws, _rowStartInsert, _numLineInserted) =>{
            let arrRangeMerge = _ws.model.merges;
            let arrRangeMergeFinal = [];
            for(let i = 0; i < arrRangeMerge.length; i++){
                let address_range = arrRangeMerge[i];
                let address_cell_start = getPositionCell(_ws, address_range.split(":")[0]);
                let address_cell_end = getPositionCell(_ws, address_range.split(":")[1]);

                if(address_cell_start.row >= _rowStartInsert){
                    _ws.unMergeCells(address_range);

                    arrRangeMergeFinal.push({
                        row_start: address_cell_start.row + _numLineInserted,
                        col_start: address_cell_start.col,
                        row_end: address_cell_end.row + _numLineInserted,
                        col_end: address_cell_end.col
                    })

                }
            }

            for(let i = 0; i < arrRangeMergeFinal.length; i++){
                let objRangeMerge = arrRangeMergeFinal[i];
                _ws.mergeCells(objRangeMerge.row_start, objRangeMerge.col_start, objRangeMerge.row_end, objRangeMerge.col_end);
            }
        }

        const getPositionCell = (_ws, _pos) => {
            let objPos = {row: 1, col: 1, address: "A1"};

            if(typeof _pos == "string"){
                objPos.address = _pos.toUpperCase();

                let cell_start = _ws.getCell(objPos.address);

                objPos.row = cell_start.row;
                objPos.col = cell_start.col;
            }
            else if(typeof _pos == "object"){
                objPos.row = _pos.row||1;
                objPos.col = _pos.col||1;

                let cell_start = _ws.getCell(objPos.row, objPos.col);

                objPos.address = cell_start._address;
            }

            return objPos;
        }

        const copyStyleCellToCells = (_ws, _posCellCopy, _arrPosCellPast) => {
            for(let i = 0; i < _arrPosCellPast.length; i++){
                copyStyleCellToCell(_ws, _posCellCopy, _arrPosCellPast[i]);
            }
        }

        const copyStyleCellToCell = (_ws, _posCellCopy, _posCellPast) => {
            let posCellCopy = getPositionCell(_ws, _posCellCopy);
            let posCellPast = getPositionCell(_ws, _posCellPast);

            let cellCopy = _ws.getCell(posCellCopy.address);
            let cellPast = _ws.getCell(posCellPast.address);

            if(cellCopy.numFmt !== undefined){
                cellPast.numFmt = cellCopy.numFmt
            }
            if(cellCopy.font !== undefined){
                cellPast.font = {...cellCopy.font}
            }
            if(cellCopy.alignment !== undefined){
                cellPast.alignment = {...cellCopy.alignment}
            }
            if(cellCopy.border !== undefined){
                cellPast.border = {...cellCopy.border}
            }
            if(cellCopy.fill !== undefined){
                cellPast.fill = {...cellCopy.fill}
            }
        }

        const copyStyleRowToRows = (_ws, _rowNumCopy, _arrRowNumPast) => {
            for(let i = 0; i < _arrRowNumPast.length; i++){
                copyStyleCellToCell(_ws, _rowNumCopy, _arrRowNumPast[i]);
            }
        }

        const copyStyleRowToRow = (_ws, _rowNumCopy, _rowNumPast) => {
            let rowCopy = _ws.getRow(_rowNumCopy);
            let rowPast = _ws.getRow(_rowNumPast);

            let cellCount = rowCopy.cellCount < rowPast.cellCount ? rowPast.cellCount : rowCopy.cellCount;
            for(let i = 1; i <= cellCount; i++){
                rowPast.getCell(i).numFmt = rowCopy.getCell(i).numFmt;
            }

            if(rowCopy.font !== undefined){
                rowPast.font = {...rowCopy.font}
            }
            if(rowCopy.alignment !== undefined){
                rowPast.alignment = {...rowCopy.alignment}
            }
            if(rowCopy.border !== undefined){
                rowPast.border = {...rowCopy.border}
            }
            if(rowCopy.fill !== undefined){
                rowPast.fill = {...rowCopy.fill}
            }
        }

        const fnRemoveMultiRow = (_curSheet, startRowIdx, endRowIdx) => {
            for (let i = startRowIdx; i <= endRowIdx; i++) {
                fnRemoveRow(_curSheet, startRowIdx, 1);
            }
        }

        const addEmptyRow = (_curSheet, numberRows) => {
            let i = 0;
            while (i < numberRows) {
                _curSheet.addRow([]);
                i++;
            }
        }

        const fnCloneSheet = (workbook, indexSheet, nameSheet) => {
            let sheetToClone = workbook.getWorksheet(indexSheet);
            const _nameSheet = nameSheet;
            let cloneSheet = workbook.addWorksheet(_nameSheet)
            cloneSheet.model = sheetToClone.model
            cloneSheet.name = _nameSheet;
            return cloneSheet;
        }

        const fnInsertAllStylesRow = (objStyle, _rowSourceRow, _widthCountHeader) => {
            const widthCountHeader = _rowSourceRow.cellCount || _widthCountHeader;
            _rowSourceRow.eachCell({includeEmpty: true}, (sourceCell, colNumber) => {
                if (colNumber > widthCountHeader) return;
                sourceCell.style = Object.assign({}, objStyle);
            });
        }

        const fnInsertDetailStylesRow = (_rowSourceRow, arrRowsStyle) => {
            _rowSourceRow.eachCell({includeEmpty: true}, (sourceCell, colNumber) => {
                sourceCell.style = Object.assign({}, arrRowsStyle?.[colNumber] || {});
            });
        }

        const fnRemoveRow = (_curSheet, rowIdx, numRows = 1) => {
            _curSheet.spliceRows(rowIdx, numRows);
        }

        const fnInsertStylesRow = (objStyle, _destinationRow) => {
            for (let colNumber in objStyle) {
                _destinationRow.getCell(colNumber*1).style = Object.assign({}, objStyle[colNumber]);
            }
        }

        const fnMergeCell = (_curSheet, startRowIdx, startColumnIdx, endRowIdx, endColumnIdx) =>{
            _curSheet.mergeCells(startRowIdx, startColumnIdx, endRowIdx, endColumnIdx);
        }

        const mergeCell = (_curSheet, startRowIdx, startColumnIdx, endRowIdx, endColumnIdx) =>{
            _curSheet.mergeCells(startRowIdx, startColumnIdx, endRowIdx, endColumnIdx);
        }

        const fnGetStyleOfCell = (_curSheet, _addressCell) => {
            let _cellSource = _curSheet.getCell(_addressCell);
            let objStyle = {};
            Object.assign(objStyle, _cellSource.style);
            return objStyle;
        }

        const fnGetStyleOfRow = (_curSheet, indexRow) => {
            let _rowSourceRow = _curSheet.getRow(indexRow);
            let objStyle = {};
            _rowSourceRow.eachCell({includeEmpty: true}, (sourceCell, colNumber) => {
                objStyle[colNumber] = Object.assign({}, sourceCell.style);
            });
            return objStyle;
        }

        const fnUpdMultiValueToCell = (_ws, arrData) => {
            let len = arrData.length;
            for (let i = 0; i < len; i++) {
                const objCellUpd = arrData[i];
                let addressCell = objCellUpd.addressCell;
                let keys = objCellUpd.keys;
                let values = objCellUpd.values;
                replaceKeyCellValue(_ws, addressCell, keys, values);
            }
        }

        const updMultiValueToCell = (_ws, arrData) => {
            let len = arrData.length;
            for (let i = 0; i < len; i++) {
                const objCellUpd = arrData[i];
                let addressCell = objCellUpd.addressCell;
                let keys = objCellUpd.keys;
                let values = objCellUpd.values;
                replaceKeyCellValue(_ws, addressCell, keys, values);
            }
        }

        const replaceKeyCellValue = (_ws, _addressCell, _keys, _values) =>{
            //let objAddress = getPositionCell(_ws, _addressCell)
            let cellInfo = _ws.getCell(_addressCell);

            let arrKey = [], arrValue = [];
            if(typeof _keys == "string" && !!_keys){
                arrKey.push(_keys)
                arrValue.push(_values)
            }else{
                arrKey = _keys
                arrValue = _values
            }

            for(let i = 0; i < arrKey.length; i++){
                cellInfo.value = isContainValue(cellInfo.value) ? cellInfo.value.toString().replaceAll(arrKey[i], arrValue[i]??"") : null;
                if(!isNaN(cellInfo.value)){
                    cellInfo.value = Number(cellInfo.value);
                }
            }
        }

        const createNumFmtWithRange = (_ws, _posStart, _posEnd, _numFmt) => {
            let posStart = getPositionCell(_ws, _posStart);
            let posEnd = getPositionCell(_ws, _posEnd);

            for(let idxRow = posStart.row; idxRow <= posEnd.row; idxRow++){
                for (let idxCol = posStart.col; idxCol <= posEnd.col; idxCol++) {
                    let curCell = _ws.getCell(idxRow, idxCol);

                    curCell.numFmt = _numFmt;
                }
            }
        }

        const createFillWithRange = (_ws, _posStart, _posEnd, _objFill) => {
            _objFill = _objFill||{};

            let posStart = getPositionCell(_ws, _posStart);
            let posEnd = getPositionCell(_ws, _posEnd);

            for(let idxRow = posStart.row; idxRow <= posEnd.row; idxRow++){
                for (let idxCol = posStart.col; idxCol <= posEnd.col; idxCol++) {
                    let curCell = _ws.getCell(idxRow, idxCol);

                    let curFill = {...curCell.fill};

                    Object.keys(_objFill).forEach(keyId =>{
                        let tempValue = _objFill[keyId];
                        if(tempValue !== undefined){
                            curFill[keyId] = tempValue;
                        }
                    })

                    curCell.fill = curFill;
                }
            }
        }

        const createFontsWithRange = (_ws, _posStart, _posEnd, _objFont) => {
            _objFont = _objFont||{};

            let posStart = getPositionCell(_ws, _posStart);
            let posEnd = getPositionCell(_ws, _posEnd);

            for(let idxRow = posStart.row; idxRow <= posEnd.row; idxRow++){
                for (let idxCol = posStart.col; idxCol <= posEnd.col; idxCol++) {
                    let curCell = _ws.getCell(idxRow, idxCol);

                    let curFont = {...curCell.font};

                    Object.keys(_objFont).forEach(keyId =>{
                        let tempValue = _objFont[keyId];
                        if(tempValue !== undefined){
                            curFont[keyId] = tempValue;
                        }
                    })

                    curCell.font = curFont;
                }
            }
        }

        const createBorderWithRange = (_ws, _posStart, _posEnd, _borderOutside, _objBorderInside) => {
            _borderOutside = _borderOutside||"thin";
            _objBorderInside = _objBorderInside||{rowStyle: "", colStyle: ""};

            /* thin,dotted, dashDot, hair, dashDotDot, slantDashDot, mediumDashed, mediumDashDotDot, mediumDashDot
            medium, double, thick
            */
            let styleBorderOutside = {
                style: _borderOutside
            };

            let posStart = getPositionCell(_ws,_posStart);
            let posEnd = getPositionCell(_ws,_posEnd);

            for (let i = posStart.row; i <= posEnd.row; i++) {
                let leftBorderCell = _ws.getCell(i, posStart.col);
                let rightBorderCell = _ws.getCell(i, posEnd.col);

                leftBorderCell.border = {
                    ...leftBorderCell.border,
                    left: styleBorderOutside
                };
                rightBorderCell.border = {
                    ...rightBorderCell.border,
                    right: styleBorderOutside
                };
            }

            for (let i = posStart.col; i <= posEnd.col; i++) {
                let topBorderCell = _ws.getCell(posStart.row, i);
                let botBorderCell = _ws.getCell(posEnd.row, i);

                topBorderCell.border = {
                    ...topBorderCell.border,
                    top: styleBorderOutside
                };
                botBorderCell.border = {
                    ...botBorderCell.border,
                    bottom: styleBorderOutside
                };
            }

            if(!!_objBorderInside.rowStyle || !!_objBorderInside.colStyle){
                for(let idxRow = posStart.row; idxRow <= posEnd.row; idxRow++){
                    for (let idxCol = posStart.col; idxCol <= posEnd.col; idxCol++) {
                        if(!!_objBorderInside.rowStyle && idxRow < posEnd.row){
                            let botBorderCell = _ws.getCell(idxRow, idxCol);
                            botBorderCell.border = {
                                ...botBorderCell.border,
                                bottom: {style: _objBorderInside.rowStyle}
                            };
                        }

                        if(!!_objBorderInside.colStyle && idxCol < posEnd.col){
                            let rightBorderCell = _ws.getCell(idxRow, idxCol);
                            rightBorderCell.border = {
                                ...rightBorderCell.border,
                                right: {style: _objBorderInside.colStyle}
                            };
                        }
                    }
                }
            }
        };

        const asyncPostMultiRequestFetchSSPageByAjax = async (_urlReq, _arrReqAction, _callbackCompletedMulti, _callbackSucc, _callbackErr) =>{
            if(_arrReqAction.length === 0){
                if(typeof _callbackSucc == "function"){
                    _callbackCompletedMulti(_arrReqAction);
                }
            }
            let cntCallData = 0;debugger
            let arrReqActionPage = [];
            _arrReqAction.forEach(objAction => {
                if(objAction.isSuccess) {
                    cntCallData++;
                    return;
                }

                let paramsFunc = objAction.params;
                paramsFunc.action = objAction.action;

                asyncPostDataByAjax(_urlReq, paramsFunc, function(_res, _paramsCallback){
                    cntCallData++;

                    if(typeof _callbackSucc == "function"){
                        _callbackSucc(_res, _paramsCallback);
                    }

                    objAction.data = _res.data;
                    objAction.isSuccess = true;
                    let info = _res.data.info || {};
                    let page = info.page||0;
                    let ttlPage = info.ttlPage||1;
                    if(!isContainValue(_paramsCallback.page) && page < (ttlPage - 1)){
                        for( let idxPage = 1; idxPage < ttlPage; idxPage++){
                            let paramFetchPage = {..._paramsCallback};
                            paramFetchPage.page = idxPage;
                            arrReqActionPage.push({
                                action: _paramsCallback.action,
                                params: paramFetchPage,
                                data: []
                            })
                        }
                    }

                    updateProgessStatus("Processing step: " + cntCallData + "/" + _arrReqAction.length);

                    if(cntCallData < _arrReqAction.length) return;

                    if(arrReqActionPage.length > 0){
                        _arrReqAction = _arrReqAction.concat(arrReqActionPage);
                        asyncPostMultiRequestFetchSSPageByAjax(_urlReq, _arrReqAction, _callbackCompletedMulti, _callbackSucc, _callbackErr);
                        return;
                    }
                    if(typeof _callbackSucc == "function"){
                        _callbackCompletedMulti(_arrReqAction);
                    }
                }, function(request, status, error){
                    cntCallData++;

                    if(typeof _callbackSucc == "function"){
                        _callbackErr(request, status, error);
                    }
                })
            });
        }

        const asyncPostMultiRequestByAjax = async (_urlReq, _arrReqAction, _callbackCompletedMulti, _callbackSucc, _callbackErr) =>{
            if(_arrReqAction.length === 0){
                if(typeof _callbackSucc == "function"){
                    _callbackCompletedMulti(_arrReqAction);
                }
            }
            let cntCallData = 0;
            _arrReqAction.forEach(objAction => {
                let paramsFunc = objAction.params;
                paramsFunc.action = objAction.action;

                asyncPostDataByAjax(_urlReq, paramsFunc, function(_res, _paramsCallback){
                    cntCallData++;

                    if(typeof _callbackSucc == "function"){
                        _callbackSucc(_res, _paramsCallback);
                    }

                    objAction.data = _res.data;

                    updateProgessStatus("Processing step: " + cntCallData + "/" + _arrReqAction.length);

                    if(cntCallData < _arrReqAction.length) return;

                    if(typeof _callbackSucc == "function"){
                        _callbackCompletedMulti(_arrReqAction);
                    }
                }, function(request, status, error){
                    cntCallData++;

                    if(typeof _callbackSucc == "function"){
                        _callbackErr(request, status, error);
                    }
                })
            });
        }

        const asyncPostDataByAjax = async (_urlReq, _params, _callbackSucc, _callbackErr) => {
            requestDataByAjax("post", _urlReq, true, _params, _callbackSucc);
        }

        const nonAsyncPostDataByAjax = (_urlReq, _params, _callbackSucc, _callbackErr) => {
            return requestDataByAjax("post", _urlReq, false, _params, _callbackSucc, _callbackErr);
        }

        const requestDataByAjax = (_method, _urlReq, _isAsync, _params, _callbackSucc, _callbackErr) => {
            let resResult = {};

            jQuery.ajax({type: _method, url: _urlReq, dataType: "json", async: _isAsync, data: {..._params}
            }).done(function (response) {
                resResult = {...response};
                if(typeof _callbackSucc == "function"){
                    _callbackSucc(resResult, _params);
                }
            }).fail(function(request, status, error){
                if(typeof _callbackErr == "function"){
                    _callbackErr(request, status, error);
                }
            });

            return resResult;
        }

        const updateProgessStatus = (_msg) => {
            jQuery("#idxProgessStatus").html(_msg);
        }

        const updateCellValue = (currentSheet, strCellAddress, value, style) => {
            let cellInfo = currentSheet.getCell(strCellAddress);
            if(style) {
                cellInfo.style = style;
            }
            cellInfo.value = value;
        }

        const updateCellValueWithKey = (currentSheet, strCellAddress, key, value, style) => {
            let cellInfo = currentSheet.getCell(strCellAddress);
            if(style) {
                cellInfo.style = style;
            }
            let cellVale = cellInfo.value;
            cellVale = cellVale.replaceAll(key, value);
            cellInfo.value = cellVale;
        }

        const updateRowHeight = (worksheet, cellValue, extendNumber, rowNumber, lengRow) => {
            const row = worksheet.getRow(rowNumber);
            row.height = calculateRowHeight(cellValue, extendNumber, lengRow);
        }

        const calculateRowHeight = (cellValue, extendNumber, lengRow) => {
            const lineHeight = 19.5;
            const numLines = Math.ceil((cellValue.length + extendNumber)/lengRow);
            return lineHeight * numLines;
        }

        const assignStyle = (currentSheet, rowNumber, columnNamesFull, objStyle) => {
            for(let cellName of columnNamesFull) {
                let cellAddress = cellName + rowNumber;
                objStyle[cellName] = currentSheet.getCell(cellAddress).style
            }
        }

        const getObjStyleColumn = (currentSheet, columnName, rowStart, rowEnd) => {
            let objStyle = {};
            for (let iRow = rowStart; iRow <= rowEnd; iRow++) {
                objStyle[iRow] = currentSheet.getCell(columnName + iRow).style;
            }
            return objStyle;
        }

        const getObjStyleRow = (currentSheet, rowNumber, listColumn, columnStart, columnEnd, isBold) => {
            let objStyle = {};
            for (let iCol = columnStart; iCol <= columnEnd; iCol++) {
                let colName = listColumn[iCol];
                let cell = currentSheet.getCell(colName + rowNumber);

                const existingStyle = cell.style;

                let newStyle = {
                    font: { name: 'Arial', size: 10, bold: isBold },
                    alignment: existingStyle.alignment,
                    border: existingStyle.border,
                    fill: existingStyle.fill,
                    numFmt: existingStyle.numFmt
                };
                cell.style = newStyle;

                objStyle[colName] = cell.style;
            }
            return objStyle;
        }

        const assignStyleColumn = (currentSheet, columnName, objStyleColumn, rowStart, rowEnd) => {
            for (let iRow = rowStart; iRow <= rowEnd; iRow++) {
                let cellInfo = currentSheet.getCell(columnName + iRow);
                cellInfo.style = objStyleColumn[iRow];
            }
        }

        const copyWorkSheet = (workbook, curSheet, sheet_nm, isRowFitHeight) => {
            const copiedWorksheet = workbook.addWorksheet(sheet_nm);
            // copy column width
            copiedWorksheet.columns = curSheet.columns.map(column => ({ ...column }));
            // Copy default row height
            if (workbook.properties.defaultRowHeight) {
                copiedWorksheet.properties.defaultRowHeight = workbook.properties.defaultRowHeight;
            }
            // Copy each row and its values
            curSheet.eachRow((row, rowNumber) => {
                const newRow = copiedWorksheet.getRow(rowNumber);
                newRow.height = !!row.height ? (row.height * 1.244) : row.height;
                if(isRowFitHeight === true) {
                    newRow.height = newRow.height * 20 / newRow.width;
                }
                newRow._outlineLevel = row._outlineLevel;
                row.eachCell((cell, colNumber) => {
                    const newCell = newRow.getCell(colNumber);
                    newCell.value = cell.value;
                    // Copy style if needed
                    newCell.style = { ...cell.style };
                });
                newRow.commit();
            });
            // copy merges column
            curSheet.model.merges.forEach(merge => {
                copiedWorksheet.mergeCells(merge);
            });
            return copiedWorksheet;
        }

        const truncatedSheetName = (_sheetName) => {
            if (!_sheetName) return "None";

            let sheetName = _sheetName.replace(/[*?:\\/\[\]]/g, '')

            let maxLength = 28;//sheet tối đa 31
            let suffix = "...";

            if (sheetName.length <= maxLength) return sheetName;

            let partLength = Math.floor((maxLength - suffix.length) / 2);

            let start = sheetName.substring(0, partLength);
            let lastSpaceStart = start.lastIndexOf(" ");
            if (lastSpaceStart !== -1) {
                start = start.substring(0, lastSpaceStart);
            }

            let end = sheetName.substring(sheetName.length - partLength);
            let firstSpaceEnd = end.indexOf(" ");
            if (firstSpaceEnd !== -1) {
                end = end.substring(firstSpaceEnd + 1);
            }

            return `${start}${suffix}${end}`;
        }

        const getNumberAccountingFormatXls = (_precision = 0) =>{
            if(_precision == 0) return "_(#,##0_);_( (#,##0);_( \\-\\ ??_);_(@_)";

            let padPrecision = "".padStart(_precision, "#");

            return "_(#,##0." + padPrecision + "_);_( (#,##0." + padPrecision + ");_( \\-\\ ??_);_(@_)";
        }

        const syncStyleRangeWithRowGrid = (_ws, _posStart, _posEnd, _objRes) =>{
            let objFont = {
                bold: false, italic: false, underline: false
            };
            let objFill = {
                type: 'pattern',
                pattern:'solid',
                fgColor:{}
            };
            if(_objRes.rowPreparedData?.style?.fontWeight == "bold"){
                objFont.bold = true;
            }
            if(_objRes.rowPreparedData?.style?.fontStyle == "italic"){
                objFont.italic = true;
            }
            if(_objRes.rowPreparedData?.style?.textDecoration == "underline"){
                objFont.underline = true;
            }
            if(!!_objRes.rowPreparedData?.style?.backgroundColor){
                objFill.fgColor.argb = _objRes.rowPreparedData.style.backgroundColor.replace("#", "");
            }
            createFontsWithRange(_ws, _posStart, _posEnd, objFont);
            createFillWithRange(_ws, _posStart, _posEnd, objFill);
        }
        
        const renderHeaderExport = (curSheet, idxRowHeader, columns, objStyle) => {
            const rows = [];
            const colIndex = { value: 1 };
            const maxDepth = { value: 1 };
            
            (function traverse(cols, depth) {
                if (!rows[depth]) rows[depth] = [];
                for (let col of cols) {
                    let cell = { caption: col.caption || "", start: colIndex.value, span: 1, rowSpan: 1 };
                    if (col.columns) {
                        let start = colIndex.value;
                        maxDepth.value = Math.max(maxDepth.value, depth + 1);
                        traverse(col.columns, depth + 1);
                        cell.start = start;
                        cell.span = colIndex.value - start;
                        cell.rowSpan = 1;
                    } else {
                        colIndex.value++;
                        maxDepth.value = Math.max(maxDepth.value, depth + 1);
                        cell.rowSpan = 1;
                    }
                    rows[depth].push(cell);
                }
            })(columns, 0);

            for (let i = 0; i < rows.length; i++) {
                for (let cell of rows[i]) {
                    if (cell.span === 1 && cell.rowSpan === 1) {
                        cell.rowSpan = maxDepth.value - i;
                    }
                }
            }

            for (let r = 0; r < rows.length; r++) {
                const rowVals = [];
                for (let cell of rows[r]) {
                    while (rowVals.length < cell.start - 1) rowVals.push("");
                    rowVals.push(cell.caption);
                }
                curSheet.insertRow(idxRowHeader + r, rowVals);
            }

            for (let r = 0; r < rows.length; r++) {
                for (let cell of rows[r]) {
                    const r1 = idxRowHeader + r;
                    const r2 = r1 + cell.rowSpan - 1;
                    const c1 = cell.start;
                    const c2 = c1 + cell.span - 1;
                    if (r1 !== r2 || c1 !== c2) {
                        curSheet.mergeCells(r1, c1, r2, c2);
                    }
                }
            }

            for (let i = 0; i < maxDepth.value; i++) {
                const row = curSheet.getRow(idxRowHeader + i);
                row.height = 40;
                row.eachCell(cell => {
                    cell.font = { name: "Tahoma", size: 8, bold: true, ...objStyle?.font };
                    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF" }, ...objStyle?.fill };
                    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
                    cell.border = {
                        top: { style: "thin" },
                        left: { style: "thin" },
                        bottom: { style: "thin" },
                        right: { style: "thin" }
                    };
                });
            }

            const flatColumns = [];
            (function flattenColumns(cols) {
                for (let col of cols) {
                    if (col.columns) {
                        flattenColumns(col.columns);
                    } else {
                        flatColumns.push(col);
                    }
                }
            })(columns);

            flatColumns.forEach((col, idx) => {
                curSheet.getColumn(idx + 1).width = col.width / 10 || 15;
            });

            return {
                arrColHeader: flatColumns.map(col => ({
                    dataField: col.dataField,
                    dataType: col.dataType,
                    width: col.width / 10 || 15
                })),
                arrColNumFmt: flatColumns
                .map((col, idx) => ({ idxCol: idx + 1, numFmt: col.format }))
                .filter(item => item.numFmt),
                col_end: flatColumns.length
            };
        }

        return {
            loadWorkbookFromUrl: loadWorkbookFromUrl,
            saveWorkbook: saveWorkbook,
            syncRangeMergeAfterInsertRow: syncRangeMergeAfterInsertRow,
            getPositionCell: getPositionCell,
            copyStyleCellToCell: copyStyleCellToCell,
            copyStyleCellToCells: copyStyleCellToCells,
            copyStyleRowToRows: copyStyleRowToRows,
            copyStyleRowToRow: copyStyleRowToRow,
            isContainValue: isContainValue,
            createNumFmtWithRange: createNumFmtWithRange,
            createFillWithRange: createFillWithRange,
            createFontsWithRange: createFontsWithRange,
            createBorderWithRange: createBorderWithRange,
            asyncPostMultiRequestFetchSSPageByAjax: asyncPostMultiRequestFetchSSPageByAjax,
            asyncPostMultiRequestByAjax: asyncPostMultiRequestByAjax,
            asyncPostDataByAjax: asyncPostDataByAjax,
            nonAsyncPostDataByAjax: nonAsyncPostDataByAjax,
            replaceKeyCellValue: replaceKeyCellValue,
            fnUpdMultiValueToCell: fnUpdMultiValueToCell,
            updMultiValueToCell: updMultiValueToCell,
            fnGetStyleOfRow: fnGetStyleOfRow,
            fnInsertStylesRow: fnInsertStylesRow,
            fnGetStyleOfCell: fnGetStyleOfCell,
            fnRemoveMultiRow : fnRemoveMultiRow,
            fnRemoveRow: fnRemoveRow,
            fnInsertDetailStylesRow : fnInsertDetailStylesRow,
            fnMergeCell : fnMergeCell,
            mergeCell: mergeCell,
            fnInsertAllStylesRow : fnInsertAllStylesRow,
            addEmptyRow : addEmptyRow,
            fnCloneSheet : fnCloneSheet,
            updateCellValue: updateCellValue,
            updateCellValueWithKey: updateCellValueWithKey,
            updateRowHeight: updateRowHeight,
            calculateRowHeight: calculateRowHeight,
            assignStyle: assignStyle,
            getObjStyleColumn: getObjStyleColumn,
            getObjStyleRow: getObjStyleRow,
            assignStyleColumn: assignStyleColumn,
            copyWorkSheet: copyWorkSheet,
            truncatedSheetName,
            getNumberAccountingFormatXls,
            syncStyleRangeWithRowGrid,
            renderHeaderExport
        };

    });
