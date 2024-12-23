
function submitBoothCode() {
    let code = document.getElementById('boothCode').value;
    if (code.length == 0 || validateBoothCode(code) == false) {
        code = 'Not found'
    }
    // todo: get corresponding info for name/location
    // (instead of showing booth code)
    document.getElementById('boothName').innerHTML = 'Name: ' + code;
    document.getElementById('boothLocation').innerHTML = 'Location: ' + code;
}

function validateBoothCode(code) {
    // TODO: actually check that booth code exists (xor to go back to original code + check for match)
    return true;
}

function submitResults() {
    let resultsTable = createResultsTable();
    console.log(resultsTable);

    // sendResultsToAPI();
    // return false;

    let code = document.getElementById('boothCode').value;
    if (code.length == 0) {
        alert('Enter a booth code');
        return false;
    }
    if (validateBoothCode(code) == false) {
        alert('Invalid booth code');
        return false
    }
    if (validateForm(resultsTable) == false) {
        return false;
    }
    sendResultsToAPI(resultsTable);
    alert('Form submitted: ' + document.getElementById('fullTotal').value + ' total votes')
    return true;
}

function createResultsTable() {
    let results = [];

    let table = document.getElementById('resultInputs');
    let numCandidates = document.getElementsByName('firstPreference').length - 1;
    let candidate = null;
    let firstPref = null;
    let boeleTCP = null;
    let liberalTCP = null;
    for (let i = 1; i <= numCandidates; i++) {
        candidate = table.rows[i].cells[0].innerHTML;
        firstPref = parseInt(document.getElementById('fp' + i).value);
        // if (candidate.includes('BOELE, N.')) {
        //     boeleTCP = firstPref;
        //     liberalTCP = 0;
        // } else if (candidate.includes('LIB')) {
        //     boeleTCP = 0;
        //     liberalTCP = firstPref;
        boeleTCP = parseInt(document.getElementById('btcp' + i).value);
        liberalTCP = parseInt(document.getElementById('ltcp' + i).value);
        results[i] = [candidate, firstPref, boeleTCP, liberalTCP];
    }

    firstPref = parseInt(document.getElementById('informalVotes').value);
    boeleTCP = null;
    liberalTCP = null;
    results[numCandidates + 1] = ['Informal', firstPref, boeleTCP, liberalTCP];

    firstPref = parseInt(document.getElementById('totalFormal').value);
    boeleTCP = parseInt(document.getElementById('totalBoeleTCP').value);
    liberalTCP = parseInt(document.getElementById('totalLiberalTCP').value);
    results[numCandidates + 2] = ['Total Formal', firstPref, boeleTCP, liberalTCP];

    firstPref = parseInt(document.getElementById('fullTotal').value);
    boeleTCP = null;
    liberalTCP = null;
    results[numCandidates + 3] = ['Total', firstPref, boeleTCP, liberalTCP];

    return results;
}

function validateForm(results) {
    let numCandidates = document.getElementsByName('firstPreference').length - 1;
    let informalIndex = numCandidates + 1;
    let formalIndex = numCandidates + 2;
    let totalIndex = numCandidates + 3;

    let firstPrefCol = 1;
    let boeleTCPcol = 2;
    let liberalTCPcol = 3;

    // all first pref + full total must be filled in
    let firstPrefSum = 0;
    for (let i = 1; i <= numCandidates + 1; i++) {
        let value = results[i][firstPrefCol];
        if (value < 0 || isNaN(value)) {
            alert('All first preference values must be filled out');
            return false;
        }
        firstPrefSum += value;
    }
    let fullTotal = results[totalIndex][firstPrefCol];
    if (fullTotal <= 0 || isNaN(fullTotal)) {
        alert('Total must be filled out');
        return false;
    }
    // first prefs must sum to full total
    if (firstPrefSum != fullTotal) {
        alert('Incorrect vote tally: ' + firstPrefSum);
        return false;
    }

    // first pref - informal must sum to total formal (if it exists)
    let numInformal = results[informalIndex][firstPrefCol];
    let totalFormal = results[formalIndex][firstPrefCol];
    if (!isNaN(totalFormal) && (firstPrefSum - numInformal) != totalFormal) {
        alert('Incorrect formal vote tally: ' + (firstPrefSum - numInformal));
        return false;
    }

    // if TCP values included...
    if (!includesTCP()) return true;
    // each TCP column must sum to total formal for that column
    if (!checkTCPsum('Boele') || !checkTCPsum('Liberal')) {
        return false;
    }
    // TCP total formal values must add to full total - informal
    let totalBoeleTCP = results[formalIndex][boeleTCPcol];
    let totalLiberalTCP = results[formalIndex][liberalTCPcol];
    if (isNaN(totalBoeleTCP) || isNaN(totalLiberalTCP)) {
        alert('Invalid TCP total');
        return false;
    } else if ((totalBoeleTCP + totalLiberalTCP) != (fullTotal - numInformal)) {
        console.log(totalBoeleTCP)
        console.log(totalLiberalTCP);
        console.log(totalFormal);
        console.log(numInformal);
        alert('TCP totals do not add to overall total');
        return false;
    }
    // for each column, TCP values must add to first pref
    for (let i = 1; i <= numCandidates; i++) {
        if (results[i][boeleTCPcol] + results[i][liberalTCPcol] != results[i][firstPrefCol]) {
            alert('TCP values for each candidate must add to first preference votes')
            return false;
        }
    }

    return true;
}

function checkTCPsum(name) {
    let sum = calculateSum(name + 'TCP');
    let total = parseInt(document.getElementById('total' + name + 'TCP').value);
    if (sum == 0 || isNaN(total)) {
        alert('Invalid TCP total');
        return false;
    } else if (sum != total) {
        alert('Incorrect ' + name + ' total votes: ' + sum)
        return false;
    }
    return true;
}

function calculateSum(columnName) {
    let fields = document.getElementsByName(columnName);
    let sum = 0;
    Array.from(fields).forEach((input) => {
        let value = parseInt(input.value);
        if (!isNaN(value)) {
            sum += value;
        }
    });
    return sum;
}

function includesTCP() {
    let tcpFields = document.getElementsByClassName('TCP');
    for (let input of tcpFields) {
        let value = parseInt(input.value);
        if (!isNaN(value) && value > 0) return true;
    }
    return false;
}

function sendResultsToAPI(results) {
    let numCandidates = document.getElementsByName('firstPreference').length - 1;
    for (let i = 1; i <= numCandidates + 3; i++) {
        let candidate = results[i][0].replace('<br>', ' ');
        sendCandidateResultToAPI(candidate, results[i][1], results[i][2], results[i][3]);
    }
}

function sendCandidateResultToAPI(candidate, firstPref, boeleTCP, liberalTCP) {
    let resultsHeader = new Headers();
    resultsHeader.append("Content-Type", "application/json");

    let data = JSON.stringify({
        "boothCode": document.getElementById('boothCode').value,
        "candidateName": candidate,
        "firstPreference": firstPref,
        "boeleTCP": boeleTCP,
        "liberalTCP": liberalTCP
    });

    let requestOptions = {
        method: 'POST',
        headers: resultsHeader,
        body: data,
        redirect: 'follow'
    };

    console.log(data);

    fetch("https://mn2e97c7b4.execute-api.ap-southeast-2.amazonaws.com/mobile-form-stage", requestOptions)
        .then(response => response.text())
        .then(result => alert(JSON.parse(result).body))
        .catch(error => console.log('error', error))
}