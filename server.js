//import the packages - here will need express and express-handlebars
const express = require('express')
const { engine } = require('express-handlebars')
const db = require("siennasql")
const path = require('path')

//create the server
const app = express()

//connect to the database
db.connect("arboretum.db")

//setup the server to work the way we want
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.engine(".hbs", engine({ extname: ".hbs" }))
app.set("view engine", ".hbs")

//turn on the server
app.listen(3000, function () { console.log('running on port 3000') })

//these are the 'routes' (the addresses users put in to get pages etc)

let species
let species1

app.all( //home
    '/',
    function (request, response) {
        let allSpecies = db.run("SELECT * FROM SPECIES")
        let commonNames = db.run("SELECT * FROM COMMON_NAMES")

        //this generates the table of values for the pie chart
        let percentValues = db.run("SELECT SCIENTIFIC_NAME, PERCENTAGE FROM SPECIES ORDER BY PERCENTAGE DESC LIMIT 20")
        
        let dataValues = []
        let dataLabels = []
        for (let i = 0; i < percentValues.length; i++) {
            if (!isNaN(percentValues[i].PERCENTAGE)) { //if the percentage is a number
                dataValues.push(percentValues[i].PERCENTAGE)
                dataLabels.push(percentValues[i].SCIENTIFIC_NAME)
            }
        }

        let speciesList = []
        let list = db.run("SELECT SCIENTIFIC_NAME, PERCENTAGE FROM SPECIES ORDER BY SCIENTIFIC_NAME ASC")
        for (let i = 0; i < list.length; i++) {
            if (!isNaN(list[i].PERCENTAGE)) {
                speciesList.push(list[i])
            }
        }

        response.render('home.hbs', { speciesList: speciesList, allSpecies: allSpecies, commonNames: commonNames, dataValues: dataValues, dataLabels: JSON.stringify(dataLabels) })
    }
)

app.all( //processSearch
    '/processSearch',
    function (request, response) {
        species = request.body.species
        let hbsFile = 'speciesSearch.hbs'
        search(request, response, hbsFile)
    }
)

function search(request, response, hbsFile, comparing) {

    let scientificOptions = db.run("SELECT * FROM SPECIES WHERE SCIENTIFIC_NAME LIKE ? COLLATE NOCASE", ["%" + species + "%"])
    let commonOptions = db.run("SELECT COMMON_NAME FROM COMMON_NAMES WHERE COMMON_NAME LIKE ? COLLATE NOCASE", ["%" + species + "%"])

    if (scientificOptions.length === 0 && commonOptions.length === 0) { //There are no results
        let error = "No results found."

        //Below variables are for the data list for the search bar
        let allSpecies = db.run("SELECT * FROM SPECIES")
        let commonNames = db.run("SELECT * FROM COMMON_NAMES")
        response.render(hbsFile, { error: error, allSpecies: allSpecies, commonNames: commonNames })

    } else if (scientificOptions.length === 0) { //Common search
        let scientificName = db.run("SELECT SCIENTIFIC_NAME FROM COMMON_NAMES WHERE COMMON_NAME LIKE ? COLLATE NOCASE", ["%" + species + "%"])
        //db.run("CREATE VIEW ALL_DISTRIBUTIONS AS SELECT SCIENTIFIC_NAME, GROUP_CONCAT(DISTRIBUTION, ', ') AS LOCATIONS FROM DISTRIBUTIONS GROUP BY SCIENTIFIC_NAME")
        //db.run("CREATE VIEW SUMMARY AS SELECT COMMON_NAMES.SCIENTIFIC_NAME, GROUP_CONCAT(COMMON_NAME, ', ') AS NAMES, ALL_DISTRIBUTIONS.LOCATIONS FROM COMMON_NAMES JOIN ALL_DISTRIBUTIONS ON ALL_DISTRIBUTIONS.SCIENTIFIC_NAME = COMMON_NAMES.SCIENTIFIC_NAME GROUP BY COMMON_NAMES.SCIENTIFIC_NAME")

        let options = searchProcess(scientificName, comparing)

        let allSpecies = db.run("SELECT * FROM SPECIES")
        let commonNames = db.run("SELECT * FROM COMMON_NAMES")
        response.render(hbsFile, { species1: species1, options: options, allSpecies: allSpecies, commonNames: commonNames })

    } else if (commonOptions.length === 0) { //Scientific search
        let options = searchProcess(scientificOptions, comparing)

        let allSpecies = db.run("SELECT * FROM SPECIES")
        let commonNames = db.run("SELECT * FROM COMMON_NAMES")
        response.render(hbsFile, { species1: species1, options: options, allSpecies: allSpecies, commonNames: commonNames })

    } else { //Both scientific and common search
        //Below variable contains the scientific names of options if the search was a common name
        let scientificNameCommonSearch = db.run("SELECT SCIENTIFIC_NAME FROM COMMON_NAMES WHERE COMMON_NAME LIKE ? COLLATE NOCASE", ["%" + species + "%"])

        let options = searchProcess(scientificNameCommonSearch, comparing)
        let options2 = searchProcess(scientificOptions, comparing)

        for (let i = 0; i < options2.length; i++) {
            options.push(options2[i])
        }

        let allSpecies = db.run("SELECT * FROM SPECIES")
        let commonNames = db.run("SELECT * FROM COMMON_NAMES")
        response.render(hbsFile, { species1: species1, options: options, allSpecies: allSpecies, commonNames: commonNames })
    }
}

function searchProcess(possibleNames, comparing) {
    let options = []

    //Pushes the scientific name, common name, and distribution of the search result options into array "options"
    for (let i = 0; i < possibleNames.length; i++) {
        if (comparing = true && possibleNames[i].SCIENTIFIC_NAME === species1) {
            continue
        } else {
            let anOption = db.run("SELECT * FROM SUMMARY WHERE SCIENTIFIC_NAME = ? COLLATE NOCASE", [possibleNames[i].SCIENTIFIC_NAME])
            options.push(anOption[0])
        }
    }

    return(options)
}

app.all( //speciesInfo
    '/speciesInfo',
    function (request, response) {
        let species = request.body.speciesInfoRequest

        let generalInfo = db.run("SELECT SPECIES.SCIENTIFIC_NAME, SUMMARY.NAMES, SPECIES.FAMILY, SPECIES.AUSTRALIAN FROM SPECIES JOIN SUMMARY ON SUMMARY.SCIENTIFIC_NAME = SPECIES.SCIENTIFIC_NAME WHERE SPECIES.SCIENTIFIC_NAME = ?", [species])
        let count = db.run("SELECT COUNT(*) AS COUNT FROM SPECIMENS WHERE SCIENTIFIC_NAME = ?", [species])
        let measurements = db.run("SELECT MIN(HEIGHT) AS MINH, ROUND(AVG(HEIGHT), 1) AS AVGH, MAX(HEIGHT) AS MAXH, MIN(CROWN_WIDTH) AS MINC, ROUND(AVG(CROWN_WIDTH), 1) AS AVGC, MAX(CROWN_WIDTH) AS MAXC, MIN(DBH) AS MIND, ROUND(AVG(DBH), 0) AS AVGD, MAX(DBH) AS MAXD FROM SPECIMENS WHERE SCIENTIFIC_NAME = ?", [species])

        let distributions = db.run("SELECT LOCATIONS FROM SUMMARY WHERE SCIENTIFIC_NAME = ?", [species])
        let habitat = db.run("SELECT HABITAT FROM SPECIES WHERE SCIENTIFIC_NAME = ?", [species])
        
        let vulnerabilities = db.run("SElECT CONSERVATION_ACT_1992, EPBC_ACT_1999 FROM SPECIES WHERE SCIENTIFIC_NAME = ?", [species])

        let description = db.run("SELECT SPECIES_PROFILE FROM SPECIES WHERE SCIENTIFIC_NAME = ?", [species])

        response.render("speciesInfo.hbs", { generalInfo: generalInfo, count: count, measurements: measurements, distributions: distributions, habitat: habitat, vulnerabilities: vulnerabilities, description: description })
    }
)

app.all( //speciesComparing
    '/speciesComparing',
    function (request, response) {
        if (request.body.speciesCompareRequest != undefined) {
            species1 = request.body.speciesCompareRequest
        }
        if (request.body.species != undefined) {
            species = request.body.species
        }
        let hbsFile = 'speciesComparing.hbs'
        let comparing = true
        search(request, response, hbsFile, comparing)
    }
)

app.all( //speciesComparison
    '/speciesComparison',
    function (request, response) {
        let tallest
        let widest
        let largestDBH
        let mostCount
        let species2 = request.body.speciesCompareRequest

        let species1Measurements = db.run("SELECT AVG(HEIGHT) AS HEIGHT, AVG(CROWN_WIDTH) AS WIDTH, AVG(DBH) AS DBH, COUNT(*) AS COUNT FROM SPECIMENS WHERE SCIENTIFIC_NAME = ?", [species1])
        let species2Measurements = db.run("SELECT AVG(HEIGHT) AS HEIGHT, AVG(CROWN_WIDTH) AS WIDTH, AVG(DBH) AS DBH, COUNT(*) AS COUNT FROM SPECIMENS WHERE SCIENTIFIC_NAME = ?", [species2])

        let heightDifference = Math.abs(species1Measurements[0].HEIGHT - species2Measurements[0].HEIGHT)
        heightDifference = Math.round(heightDifference * 100) / 100
        if (heightDifference === 0) {
            tallest = "Both equal heights"
        } else if (species1Measurements[0].HEIGHT > species2Measurements[0].HEIGHT) {
            tallest = species1
        } else {
            tallest = species2
        }

        let widthDifference = Math.abs(species1Measurements[0].WIDTH - species2Measurements[0].WIDTH)
        widthDifference = Math.round(widthDifference * 100) / 100
        if (widthDifference === 0) {
            widest = "Both equal crown widths"
        } else if (species1Measurements[0].WIDTH > species2Measurements[0].WIDTH) {
            widest = species1
        } else {
            widest = species2
        }

        let DBHDifference = Math.abs(species1Measurements[0].DBH - species2Measurements[0].DBH)
        DBHDifference = Math.round(DBHDifference * 100) / 100
        if (DBHDifference === 0) {
            largestDBH = "Both equal diameters at breast height"
        } else if (species1Measurements[0].DBH > species2Measurements[0].DBH) {
            largestDBH = species1
        } else {
            largestDBH = species2
        }

        let countDifference = Math.abs(species1Measurements[0].COUNT - species2Measurements[0].COUNT)
        countDifference = Math.round(countDifference * 100) / 100
        if (countDifference === 0) {
            mostCount = "Both equal numbers"
        } else if (species1Measurements[0].COUNT > species2Measurements[0].COUNT) {
            mostCount = species1
        } else {
            mostCount = species2
        }

        let species1Facts = db.run("SELECT FAMILY, AUSTRALIAN, HABITAT, CONSERVATION_ACT_1992, EPBC_ACT_1999 FROM SPECIES WHERE SCIENTIFIC_NAME = ?", [species1])
        let species2Facts = db.run("SELECT FAMILY, AUSTRALIAN, HABITAT, CONSERVATION_ACT_1992, EPBC_ACT_1999 FROM SPECIES WHERE SCIENTIFIC_NAME = ?", [species2])

        let sameFamily
        let sameAus
        let sameHabitat
        if (species1Facts[0].FAMILY === species2Facts[0].FAMILY) {
            sameFamily = "Both are in the family "+species1Facts[0].FAMILY
        }
        if (species1Facts[0].AUSTRALIAN === species2Facts[0].AUSTRALIAN) {
            if (species1Facts[0].AUSTRALIAN === "Yes") {
                sameAus = "Both are Australian"
            } else {
                sameAus = "Both are not Australian"
            }
        }
        if (species1Facts[0].HABITAT === species2Facts[0].HABITAT) {
            sameHabitat = "Both are found in "+species1Facts[0].HABITAT
        }

        let vulnerability1
        let vulnerability2
        if (species1Facts[0].EPBC_ACT_1999 === "Not listed") {
            vulnerability1 = species1Facts[0].CONSERVATION_ACT_1992
        } else {
            vulnerability1 = species1Facts[0].EPBC_ACT_1992
        }
        if (species2Facts[0].EPBC_ACT_1999 === "Not listed") {
            vulnerability2 = species2Facts[0].CONSERVATION_ACT_1992
        } else {
            vulnerability2 = species2Facts[0].EPBC_ACT_1992
        }

        response.render('speciesComparison.hbs', {vulnerability1: vulnerability1, vulnerability2: vulnerability2, sameFamily: sameFamily, sameAus: sameAus, sameHabitat: sameHabitat, species1: species1, species2: species2, tallest: tallest, heightDifference: heightDifference, widest: widest, widthDifference: widthDifference, largestDBH: largestDBH, DBHDifference: DBHDifference, mostCount: mostCount, countDifference: countDifference})
    }
)

app.all( //specimens
    '/specimens',
    function (request, response) {
        let specimenSpecies = request.body.specimensRequest
        let specimenInfo = db.run("SELECT TREE_ID, ROUND(LATITUDE, 2) AS LATITUDE, ROUND(LONGITUDE, 2) AS LONGITUDE, YEAR_ESTABLISHED, HEIGHT, CROWN_WIDTH, DBH FROM SPECIMENS WHERE SCIENTIFIC_NAME = ?", [specimenSpecies])

        response.render('specimens.hbs', {specimenSpecies: specimenSpecies, specimenInfo: specimenInfo})
    }
)