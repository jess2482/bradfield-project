
function validateBoothCode() {
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

    const results = document.getElementsByName('candidateresult');
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

    fetch("https://vdzu7vn1d2.execute-api.ap-southeast-2.amazonaws.com/web-form-stage/", requestOptions)
    .then(response => response.text())
    .then(result => alert(JSON.parse(result).body))
    .catch(error => console.log('error', error))
}