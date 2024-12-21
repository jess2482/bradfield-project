
function submitBoothCode() {
    let code = document.getElementById('boothCode').value;
    if (code.length == 0) {
        alert('Enter a booth code');
        return false;
    }
    if (validateBoothCode(code) == false) {
        alert('Invalid booth code');
        return false
    }

    // todo: get corresponding info for name/location
    // (instead of showing booth code)
    document.getElementById('boothName').innerHTML = 'Name: ' + code;
    document.getElementById('boothLocation').innerHTML = 'Location: ' + code;
    return false;
}

function validateBoothCode(code) {
    // todo
    return true;
}

function submitResults() {
    if (validateForm() == false) {
        return false;
    }
    sendResultsToAPI();
    return true;
}

function validateForm() {
    let total = parseInt(document.getElementById('total').value);
    let sum = 0;

    const results = document.getElementsByName('firstPreference');
    Array.from(results).forEach((input) => {
        let value = parseInt(input.value);
        if (value <= 0 || isNaN(value)) {
            alert('All values must be filled out');
            return false;
        }
        sum += value;
    })

    if (sum != total) {
        alert('Incorrect vote tally: ' + sum);
        return false;
    }
}

function sendResultsToAPI() {
    // todo
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