#!/usr/bin/env python3

import sys
import subprocess

partyAbbrvs = {
    "Independent": "IND",
    "Labor": "ALP",
    "Liberal": "LIB",
    "The Greens": "GRN",
    "United Australia Party": "UAP",
    "Pauline Hanson's One Nation": "ON"
}

if len(sys.argv) < 2:
    print(f'Usage: {sys.argv[0]} <file.csv>')
    sys.exit(1)

# assumes file format: state, division (electorate name), ballot position, surname, given name, party name
csv_file = sys.argv[1]
command = f"cat {csv_file} | grep '^NSW,Bradfield' | cut -d',' -f3,4,5,6 | sort -n | cut -d',' -f2,3,4 >tempcandidates.csv"
candidateData = subprocess.run(command, shell = True, executable="/bin/dash")

htmlCode = '''<table id="resultInputs">
    <thead>
        <tr>
            <th>Candidate</th>
            <th>First<br>Preference</th>
            <th>TCP to<br>Boele</th>
            <th>TCP to<br>Liberal</th>
        </tr>
    </thead>
    <tbody>'''

with open('tempcandidates.csv') as file:
    for line in file:
        values = line.split(',')
        party = partyAbbrvs[values[2].strip()]
        name = f'{values[0]}, {values[1][0]}.'

        if 'boele' in name.lower() or party == 'LIB':
            htmlCode += f'''
        <tr>
            <td>{name}<br>({party})</td>
            <td><input name="firstPreference" placeholder="Votes" type="number" /></td>
            <td></td>
            <td></td>
        </tr>'''
        else:
            htmlCode += f'''
        <tr>
            <td>{name}<br>({party})</td>
            <td><input name="firstPreference" placeholder="Votes" type="number" /></td>
            <td><input class = "TCP" name="BoeleTCP" placeholder="Votes" type="number" /></td>
            <td><input class = "TCP" name="LiberalTCP" placeholder="Votes" type="number" /></td>
        </tr>'''

htmlCode += '''
        <tr>
            <td>Informal</td>
            <td><input id="formalVotes" name="firstPreference" placeholder="Votes" type="number" /></td>
            <td></td>
            <td></td>
        </tr>
        <tr>
            <td><br></td>
            <td></td>
            <td></td>
            <td></td>
        </tr>
        <tr>
            <td>Total Formal</td>
            <td><input id="totalFormal" placeholder="Votes" type="number" /></td>
            <td><input id="totalBoeleTCP" placeholder="Votes" type="number" /></td>
            <td><input id="totalLiberalTCP" placeholder="Votes" type="number" /></td>
        </tr>
        <tr>
            <td>Total</td>
            <td><input id="fullTotal" placeholder="Votes" type="number" /></td>
            <td></td>
            <td></td>
        </tr>
    </tbody>
</table>'''

print(htmlCode)
