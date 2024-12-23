
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
    let code = document.getElementById('boothCode').value;
    if (code.length == 0) {
        alert('Enter a booth code');
        return false;
    }
    if (validateBoothCode(code) == false) {
        alert('Invalid booth code');
        return false
    }
    if (validateForm() == false) {
        return false;
    }
    sendResultsToAPI();
    alert('Form submitted: ' + document.getElementById('fullTotal').value() + ' total votes')
    return true;
}

function validateForm() {
    // all first pref + full total must be filled in
    let firstPrefs = document.getElementsByName('firstPreference');
    Array.from(firstPrefs).forEach((input) => {
        let value = parseInt(input.value);
        if (value < 0 || isNaN(value)) {
            alert('All first preference values must be filled out');
            return false;
        }
    });
    let fullTotal = parseInt(document.getElementById('fullTotal').value());
    if (fullTotal <= 0 || isNaN(fullTotal)) {
        alert('Total must be filled out');
        return false;
    }

    // first prefs must sum to full total
    let firstPrefSum = calculateSum('firstPreference');
    if (firstPrefSum != fullTotal) {
        alert('Incorrect vote tally: ' + firstPrefSum);
        return false;
    }

    // first pref - informal must sum to total formal (if it exists)
    let numInformal = parseInt(document.getElementById('formalVotes').value());
    let totalFormal = parseInt(document.getElementById('totalFormal').value());
    if (!isNaN(totalFormal) && (firstPrefSum - numInformal) != totalFormal) {
        alert('Incorrect formal vote tally: ' + (firstPrefSum - numInformal));
        return false;
    }

    // if TCP values included...
    if (!includesTCP()) {
        return true;
    }
    // each TCP column must add to total formal for column
    if (!checkTCPsum('Boele') || !checkTCPsum('Liberal')) {
        return false;
    }
    // TCP total valids must add to full total
    let totalBoeleTCP = parseInt(document.getElementById('totalBoeleTCP').value());
    let totalLiberalTCP = parseInt(document.getElementById('totalLiberalTCP').value());
    if (isNaN(totalBoeleTCP) || isNaN(totalLiberalTCP)) {
        alert('Invalid TCP total');
        return false;
    } else if ((totalBoeleTCP + totalLiberalTCP) != fullTotal) {
        alert('TCP totals do not add to overall total');
        return false;
    }
    return true;
}

function calculateSum(columnName) {
    let fields = document.getElementsByName(columnName);
    let sum = 0;
    Array.from(fields).forEach((input) => {
        let value = parseInt(input.value());
        if (!isNaN(value)) {
            sum += value;
        }
    });
    return sum;
}

function checkTCPsum(name) {
    let sum = calculateSum(name + 'TCP');
    let total = parseInt(document.getElementById('total' + name + 'TCP').value());
    if (sum == 0 || isNaN(total)) {
        alert('Invalid TCP total');
        return false;
    } else if (sum != total) {
        alert('Incorrect ' + name + ' total votes: ' + sum)
        return false;
    }
    return true;
}

function includesTCP() {
    let tcpFields = document.getElementsByClassName('TCP');
    Array.from(tcpFields).forEach((input) => {
        let value = parseInt(input.value());
        if (!isNaN(value) && value > 0) {
            return true;
        }
    });
    return false;
}

// function sendResultsToAPI() {
//     let table = document.getElementById('resultInputs');
//     for (let row )
// }

function sendCandidateResultToAPI() {
    let resultsHeader = new Headers();
    resultsHeader.append("Content-Type", "application/json");

    // temp, do this better later
    let data = JSON.stringify({
        "boothCode": document.getElementById('boothCode').value,
        "result1": document.getElementById('result1').value,
        "result2": document.getElementById('result2').value,
        "total": document.getElementById('total').value
    });

    let requestOptions = {
        method: 'POST',
        headers: resultsHeader,
        body: data,
        redirect: 'follow'
    };

    fetch("https://mn2e97c7b4.execute-api.ap-southeast-2.amazonaws.com/mobile-form-stage", requestOptions)
    .then(response => response.text())
    .then(result => alert(JSON.parse(result).body))
    .catch(error => console.log('error', error))
}