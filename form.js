/*
    Scrutineering form functionality - checks input and sends to database
    Created: December 2024
*/

function submitBoothCode() {
    let code = document.getElementById('boothCode').value;
    if (code.length == 0 || validateBoothCode(code) == false) {
        code = 'Not found'
    }
    document.getElementById('boothName').innerHTML = 'Name: ' + getBoothInfo(code)[0];
    document.getElementById('boothLocation').innerHTML = 'Location: ' + getBoothInfo(code)[1];
}

function getBoothInfo(code) {
    let csv = pollingPlaceInfo().split('\n');
    let id = (code ^ 692115) / 13;
    for (let booth of csv) {
        let info = booth.split(',');
        if (parseInt(info[0]) == id) {
            return [info[2], info[3]];
        }
    }
    return ['Not found', 'Not found'];
}

function validateBoothCode(code) {
    if (getBoothInfo(code)[0] == 'Not found') {
        return false;
    }
    return true;
}

function submitResults() {
    let resultsTable = createResultsTable();
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
        alert('First preference total must be filled out');
        return false;
    }
    // first prefs must sum to full total
    if (firstPrefSum != fullTotal) {
        alert('Incorrect first preference total');
        return false;
    }

    // first pref - informal must sum to total formal (if it exists)
    let numInformal = results[informalIndex][firstPrefCol];
    let totalFormal = results[formalIndex][firstPrefCol];
    if (!isNaN(totalFormal) && (firstPrefSum - numInformal) != totalFormal) {
        alert('Incorrect first preference formal vote total');
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
        alert('TCP column totals must be filled out');
        return false;
    } else if ((totalBoeleTCP + totalLiberalTCP) != (fullTotal - numInformal)) {
        console.log(totalBoeleTCP)
        console.log(totalLiberalTCP);
        console.log(totalFormal);
        console.log(numInformal);
        alert('TCP column totals do not add to total formal votes');
        return false;
    }
    // for each column, TCP values must add to first pref
    let boeleRow = -1;
    let liberalRow = -1;
    for (let i = 1; i <= numCandidates; i++) {
        if (results[i][0].includes('BOELE')) boeleRow = i;
        if (results[i][0].includes('(LIB)')) liberalRow = i;
        if (results[i][boeleTCPcol] + results[i][liberalTCPcol] != results[i][firstPrefCol]) {
            alert('Both TCP values for each candidate must be filled out and must add to first preference votes')
            return false;
        }
    }
    // Boele should have all Boele TCP + Liberal should have all Liberal TCP
    if (results[boeleRow][boeleTCPcol] != results[boeleRow][firstPrefCol]) {
        alert('All Boele first preference votes should be allocated to Boele TCP')
        return false;
    } else if (results[liberalRow][liberalTCPcol] != results[liberalRow][firstPrefCol]) {
        alert('All Liberal first preference votes should be allocated to Liberal TCP')
        return false;
    }

    return true;
}

function checkTCPsum(name) {
    let sum = calculateSum(name + 'TCP');
    let total = parseInt(document.getElementById('total' + name + 'TCP').value);
    if (sum == 0 || isNaN(total) || sum != total) {
        alert('Incorrect ' + name + ' TCP total');
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

    let code = document.getElementById('boothCode').value;
    let id = Math.floor((parseInt(code) ^ 692115) / 13);
    let data = JSON.stringify({
        "boothId": id,
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

function clearInput() {
    if (confirm('Clear form input?')) {
        let fields = document.getElementsByTagName('input');
        Array.from(fields).forEach((input) => {
            input.value = "";
        });
        document.getElementById('boothName').innerHTML = 'Name: ';
        document.getElementById('boothLocation').innerHTML = 'Location: ';
    } else {
        return;
    }
}

function pollingPlaceInfo() {
    return `
115,Asquith (Bradfield),Asquith Public School,3 Dudley St
2011,Castle Cove,Castle Cove Public School,2 Kendall Rd
108401,Central Sydney (Bradfield),TAFE NSW Ultimo Campus,2-10 Mary Ann St
97589,Central Sydney BRADFIELD PPVC,TAFE NSW Ultimo Campus,2-10 Mary Ann St
79987,Chatswood (Bradfield),The Meridian,658 Pacific Hwy
58723,Chatswood BRADFIELD PPVC,The Meridian,658 Pacific Hwy
56721,Chatswood West (Bradfield),Chatswood High School,24 Centennial Ave
97898,Crows Nest BRADFIELD PPVC,Northside Conference Centre,Oxley St
65455,EAV Bradfield PPVC,AEC National EAV Centre,10 Mort St
108551,EAV COVID19 Bradfield PPVC,AEC National EAV2 Centre,10 Mort St
194,Gordon,St John's Anglican Church Hall,754 Pacific Hwy
195,Gordon East,Gordon East Public School,66-70 Rosedale Rd
33948,Gordon PPVC,2nd Gordon Scout Hall,32C Rosedale Rd
196,Gordon West,Gordon West Public School,146 Ryde Rd
98115,Haymarket BRADFIELD PPVC,Sydney Masonic Centre,66 Goulburn St
43833,Hornsby (Bradfield),TAFE NSW Hornsby (Northern Sydney Institute),205 Peats Ferry Rd
65110,Hornsby BRADFIELD PPVC,TAFE NSW Hornsby (Northern Sydney Institute),205 Peats Ferry Rd
127,Hornsby Central (Bradfield),Hornsby Girls High School,12 Edgeworth David Ave
33771,Hornsby East,Salvation Army Hornsby,29-31 Burdett St
82528,Hornsby West (Bradfield),Hornsby War Memorial Hall,2 High St
97630,Killara,St Albans Anglican Church,1-3 Tryon Rd
199,Killara East,Killara High School,35 Koola Ave
98075,Lindfield,Korean Community Uniting Church,33 Tryon Rd
97405,Lindfield Central,All Saints' Air Force Memorial Church West Lindfield,9 Moore Ave
202,Lindfield East,Lindfield East Public School,90 Tryon Rd
203,Lindfield North,Lindfield Public School,218 Pacific Hwy
204,Lindfield West,Beaumont Road Public School,17 Beaumont Rd
133,Normanhurst (Bradfield),Normanhurst Public School,2-12 Normanhurst Rd
83551,North Wahroonga,1st East Wahroonga Scouts,26 Cliff Ave
83679,Pennant Hills BRADFIELD PPVC,"1st Floor, 114 Yarrara Road"
206,Pymble,Sacred Heart Parish Hall,1-5 Bobbin Head Rd
137,Pymble North,Pymble Public School,30 Crown Rd
207,Pymble West,West Pymble Public School,10 Apollo Ave
208,Roseville,Roseville Uniting Church,7A Lord St
210,Roseville East,Roseville Public School,19A Archbold Rd
2032,Roseville South,St Barnabas' Anglican Church,30 William St
211,St Ives,St Ives Community Hall,2 Memorial Ave
212,St Ives Chase,St Ives North Scout Hall,161 Warrimoo Ave
188,St Ives East,St Ives Park Public School,7 Acron Rd
213,St Ives North,St Ives North Public School,87 Memorial Ave
83553,St Ives PPVC,Shop 5 169 - 177 Mona Vale,Shop 5 169 - 177 Mona Vale Rd
214,St Ives South,St Ives High School,67-69 Yarrabung Rd
129,South Turramurra,Turramurra High School,104 Maxwell St
142,South Turramurra Heights,Turramurra Public School,174 Kissing Point Rd
108444,Special Hospital Team 1,UPA Sydney North Aged Care,1614-1634 Pacific Hwy
108402,Sydney (Bradfield),York Events,Lvl 2 95-99 York St
97606,Sydney BRADFIELD PPVC,York Events,Lvl 2 95-99 York St
140,Turramurra Central,Northside Montessori School,42 Bobbin Head Rd
141,Turramurra North,Turramurra North Public School,237 Bobbin Head Rd
130,Turramurra Valley,Ku-ring-gai High School,403 Bobbin Head Rd
143,Wahroonga,Wahroonga Presbyterian Church Hall,cnr Stuart St & Illoura Ave
144,Wahroonga East,Wahroonga Public School,71 Burns Rd
83552,Wahroonga South,St Lucy's School,21 Cleveland St
145,Waitara,The Light of Christ Centre Hall,33 Yardley Ave
125,Waitara North,PCYC Waitara,1 Park Lane
147,Warrawee,Warrawee Public School,1486 Pacific Hwy
97904,Willoughby BRADFIELD PPVC,Willoughby Uniting Church,10 Clanwilliam St
    `
}