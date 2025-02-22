#!/usr/bin/env python3

# Given .csv file with information for all candidates, prints web form table HTML for Bradfield candidates
# in order of position on ballot

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
    id = 1
    for line in file:
        values = line.split(',')
        party = partyAbbrvs[values[2].strip()]
        name = f'{values[0]}, {values[1][0]}.'

        htmlCode += f'''
        <tr>
            <td>{name}<br>({party})</td>
            <td><input id="fp{id}" name="firstPreference" placeholder="Votes" type="number" /></td>
            <td><input id="btcp{id}" class="TCP" name="BoeleTCP" placeholder="Votes" type="number" /></td>
            <td><input id="ltcp{id}" class="TCP" name="LiberalTCP" placeholder="Votes" type="number" /></td>
        </tr>'''

        id += 1

htmlCode += '''
        <tr>
            <td>Informal</td>
            <td><input id="informalVotes" name="firstPreference" placeholder="Votes" type="number" /></td>
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
