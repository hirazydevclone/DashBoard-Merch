// Hello

const XLSX = require('xlsx')

const testPath = "D:\\OneDrive\\Documents\\Book3.xlsx"

const wb = XLSX.readFile(testPath)
const ws = wb.Sheets["Sheet1"];

// var data = XLSX.utils.sheet_to_json(ws)

// for (let x of data) {
//     x["Status"] = "Done"
// }


// // read value in D4 
// let cell = ws['AE2'].v;
// console.log(cell)

// // modify value in D4
// ws['AE3'].v = 'NEW VALUE from NODE';

// modify value if D4 is undefined / does not exists
XLSX.utils.sheet_add_aoa(ws, [
    ['NEW VALUE from NODE']
], { origin: 'AE3' });


XLSX.writeFile(wb, testPath);


// let workBook = XLSX.utils.book_new();
// const workSheet = XLSX.utils.json_to_sheet(data);

// XLSX.writeFile(wb, testPath)
// console.log(data)