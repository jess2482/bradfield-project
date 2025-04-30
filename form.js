/*
    Scrutineering form functionality - checks input and sends to database
    Created: December 2024
*/

function submitBoothCode() {
    let code = document.getElementById('boothCode').value;
    if (code.length == 0 || validateBoothCode(code) == false) {
        code = 'Not found';
    }
    document.getElementById('boothName').textContent = 'Name: ' + getBoothInfo(code)[0];
    document.getElementById('boothLocation').textContent = 'Location: ' + getBoothInfo(code)[1];
}

function getBoothInfo(code) {
    if (parseInt(code) == 123456) return ['TEST BOOTH', 'Test Booth'];
    let csv = pollingPlaceInfo().split('\n');
    let id = (code ^ 692115) / 13;
    for (let booth of csv) {
        let info = booth.split(',');
        if (parseInt(info[0]) == id) {
            return [info[1].toUpperCase(), info[2]];
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
        alert('Unknown booth code');
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
        boeleTCP = (candidate.includes('(LIB)')) ? 0 : parseInt(document.getElementById('btcp' + i).value);
        liberalTCP = (candidate.includes('BOELE')) ? 0 : parseInt(document.getElementById('ltcp' + i).value);
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
            alert('Both TCP values for each row must be filled out and must add to first preference votes')
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
    if (parseInt(code) == 123456) id = 123456;
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

    fetch("https://mn2e97c7b4.execute-api.ap-southeast-2.amazonaws.com/mobile-form-stage", requestOptions)
        .then(response => response.text())
        .then(result => console.log(JSON.parse(result)))
        .catch(error => console.log('error', error))
}

function clearInput() {
    if (confirm('Clear form input?')) {
        let fields = document.getElementsByTagName('input');
        Array.from(fields).forEach((input) => {
            input.value = "";
        });
        document.getElementById('boothName').textContent = 'Name: ';
        document.getElementById('boothLocation').textContent = 'Location: ';
    } else {
        return;
    }
}

function pollingPlaceInfo() {
    return `
2008,Artarmon,Artarmon Community Centre,139 Artarmon Rd
2009,Artarmon Central,Artarmon Public School,McMillan Rd
121997,Cammeray (Bradfield),Cammeray Public School,68 Palmer St
2011,Castle Cove,Castle Cove Public School,2 Kendall Rd
2012,Castlecrag,Castlecrag Community Centre,10 The Postern
79987,Chatswood (Bradfield),St Paul's Anglican Church,1-5 View St
33766,Chatswood East,The Salvation Army,Cnr Bertram St & Johnson St
56721,Chatswood West (Bradfield),Chatswood Public School,5 Centennial Ave
194,Gordon,Gordon Library Meeting Room,799 Pacific Hwy
195,Gordon East,Gordon East Public School,Rosedale Rd
196,Gordon West,Gordon West Public School,146 Ryde Rd
97630,Killara,Killara Public School,1A Ridgeland Ave
199,Killara East,Killara High School,Koola Ave
98075,Lindfield,Sydney Korean Community Church,33 Tryon Rd
97405,Lindfield Central,All Saints Air Force Memorial Church West Lindfield,11 Moore Ave
202,Lindfield East,Lindfield East Public School,90 Tryon Rd
203,Lindfield North,Lindfield Public School,218 Pacific Hwy
204,Lindfield West,Beaumont Road Public School,17 Beaumont Rd
2026,Naremburn,Naremburn School,250 Willoughby Rd
133,Normanhurst (Bradfield),Normanhurst Public School,Normanhurst Rd
2029,Northbridge,St Mark's Anglican Church Hall,17 Tunks St
2030,Northbridge East,Northbridge Public School,296A Sailors Bay Rd
206,Pymble,Sacred Heart Pymble Primary School,1 Bobbin Head Rd
137,Pymble North,Pymble Public School,Crown Rd
207,Pymble West,West Pymble Public School,Apollo Ave
208,Roseville,Roseville Uniting Church,7A Lord St
210,Roseville East,Roseville Public School,19A Archbold Rd
2032,Roseville South,St Barnabas Roseville East Anglican Church Hall,81-83 Macquarie St
129,South Turramurra,Turramurra High School,104 Maxwell St
142,South Turramurra Heights,Turramurra Public School,174 Kissing Point Rd
211,St Ives,St Ives Community Hall,Memorial Ave
212,St Ives Chase,St Ives North Scout Hall,161 Warrimoo Ave
188,St Ives East,St Ives Park Public School,7 Acron Rd
213,St Ives North,St Ives North Public School,87 Memorial Ave
214,St Ives South,St Ives High School,91 Yarrabung Rd
2033,St Leonards (Bradfield),TAFE NSW (St Leonards),213 Pacific Hwy
140,Turramurra Central,Northside Montessori School,42 Bobbin Head Rd
141,Turramurra North,Turramurra North Public School,237 Bobbin Head Rd
130,Turramurra Valley,Ku-ring-gai High School,403 Bobbin Head Rd
108401,Ultimo (Bradfield),TAFE NSW (Ultimo Campus),651-731 Harris St
143,Wahroonga,Wahroonga Anglican Church - Water St,2 Water St
144,Wahroonga East,Wahroonga Public School,71 Burns Rd
83551,Wahroonga North,1st East Wahroonga Scout Hall,26 Cliff Ave
83552,Wahroonga South,St Lucy's School,21 Cleveland St
147,Warrawee,Warrawee Public School,1482 Pacific Hwy
2035,Willoughby,Willoughby Public School,Oakville Rd
2036,Willoughby North,Willoughby Park Centre,15 Warrane Rd
83554,Willoughby South,Willoughby Uniting Church,10-12 Clanwilliam St
108402,Wynyard (Bradfield),St Stephen's Uniting Church,197 Macquarie St
58723,Chatswood BRADFIELD PPVC,St Paul's Anglican Church,1-5 View St
97898,Crows Nest BRADFIELD PPVC,Fred Hutley Hall,200 Miller St
33948,Gordon PPVC,2nd Gordon Scout Hall,32C Rosedale Rd
98115,Haymarket BRADFIELD PPVC,Sydney Masonic Centre,66 Goulburn St
65110,Hornsby BRADFIELD PPVC,TAFE NSW (Hornsby - AG.03 Exhibition Space),205 Peats Ferry Rd
109349,Macquarie Park BRADFIELD PPVC,Dunmore Lang College,130 Herring Rd
83679,Pennant Hills BRADFIELD PPVC,Chinese & Australian Baptist Church,235 Pennant Hills Rd
83553,St Ives PPVC,Ku-ring-gai Community Groups Meeting Room,207 Mona Vale Rd
109340,Turramurra BRADFIELD PPVC,Northside Church,217 Bobbin Head Rd
97589,Ultimo BRADFIELD PPVC,TAFE NSW (Ultimo Campus),651-731 Harris St
97904,Willoughby BRADFIELD PPVC,Willoughby Uniting Church,10-12 Clanwilliam St
97606,Wynyard BRADFIELD PPVC,St Stephen's Uniting Church,197 Macquarie St
8991,ABSENT,Not applicable,Not applicable
9692,PROVISIONAL,Not applicable,Not applicable
9493,PRE_POLL,Not applicable,Not applicable
9974,POSTAL,Not applicable,Not applicable
8905,Special Hospital Team 1,Not applicable,Not applicable
9196,Special Hospital Team 2,Not applicable,Not applicable
9247,Special Hospital Team 3,Not applicable,Not applicable
    `
}