const fs = require('fs')
const db = require('sqlite-sync')

db.connect('arboretum.db')

///////////////////////////////////////////////////////////////////
////////////////////// INSERT INTO SPECIES ////////////////////////
///////////////////////////////////////////////////////////////////


let data = fs.readFileSync("SPECIES.txt", "utf-8")
let dataLines = data.split('\r\n')                  //Makes the string an array

let sql = "INSERT INTO SPECIES(SCIENTIFIC_NAME, FAMILY, CONSERVATION_ACT_1992, EPBC_ACT_1999, AUSTRALIAN, PERCENTAGE, HABITAT, SPECIES_PROFILE) VALUES (?,?,?,?,?,?,?,?)"

for (let i=1; i<dataLines.length; i++) {
    let line = dataLines[i].split('\t')
    for (let i = line.length - 1; i >= 0; i--) {
        if (line[i] === "" || line[i] === '""') {
            line.splice(i, 1)
        }
    }

    if (line.length > 0) {
        db.run(sql, line)
    }
}

let results = db.run("SELECT * FROM SPECIES")
console.log(results)

db.close()


///////////////////////////////////////////////////////////////////
///////////////////// INSERT INTO SPECIMENS ///////////////////////
///////////////////////////////////////////////////////////////////

/*
let data = fs.readFileSync("SPECIMENS.txt", "utf-8")
let dataLines = data.split('\r\n')                  //Makes the string an array

let sql = "INSERT INTO SPECIMENS(TREE_ID, LATITUDE, LONGITUDE, YEAR_ESTABLISHED, SCIENTIFIC_NAME, HEIGHT, CROWN_WIDTH, DBH) VALUES (?,?,?,?,?,?,?,?)"

for (let i=1; i<dataLines.length; i++) {
    let line = dataLines[i].split('\t')
    
    for (let i = line.length - 1; i >= 0; i--) {
        if (line[i] === "" || line[i] === '""') {
            line.splice(i, 1)
        }
    }

    if (line.length > 0) {
        db.run(sql, line)
    }
    
}

let results = db.run("SELECT * FROM SPECIMENS")
console.log(results)

db.close()
*/

///////////////////////////////////////////////////////////////////
/////////////////// INSERT INTO COMMON_NAMES //////////////////////
///////////////////////////////////////////////////////////////////

/*
let data = fs.readFileSync("COMMON_NAMES.txt", "utf-8")
let dataLines = data.split('\r\n')                  //Makes the string an array

let sql = "INSERT INTO COMMON_NAMES(SCIENTIFIC_NAME, COMMON_NAME) VALUES (?,?)"

for (let i=1; i<dataLines.length; i++) {
    let line = dataLines[i].split('\t')
    
    for (let i = line.length - 1; i >= 0; i--) {
        if (line[i] === "" || line[i] === '""') {
            line.splice(i, 1)
        }
    }

    if (line.length > 0) {
        db.run(sql, line)
    }
    
}

let results = db.run("SELECT * FROM COMMON_NAMES")
console.log(results)

db.close()
*/

///////////////////////////////////////////////////////////////////
/////////////////// INSERT INTO DISTRIBUTIONS /////////////////////
///////////////////////////////////////////////////////////////////

/*
let data = fs.readFileSync("DISTRIBUTIONS.txt", "utf-8")
let dataLines = data.split('\r\n')                  //Makes the string an array

let sql = "INSERT INTO DISTRIBUTIONS(SCIENTIFIC_NAME, DISTRIBUTION) VALUES (?,?)"

for (let i=1; i<dataLines.length; i++) {
    let line = dataLines[i].split('\t')
    
    for (let i = line.length - 1; i >= 0; i--) {
        if (line[i] === "" || line[i] === '""') {
            line.splice(i, 1)
        }
    }

    if (line.length > 0) {
        db.run(sql, line)
    }
    
}

let results = db.run("SELECT * FROM DISTRIBUTIONS")
console.log(results)

db.close()
*/