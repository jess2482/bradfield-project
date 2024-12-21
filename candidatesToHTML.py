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
            <th>{name}<br>({party})</th>
            <th><input name="firstPreference" placeholder="Votes" type="number" /></th>
            <th></th>
            <th></th>
        </tr>'''
        else:
            htmlCode += f'''
        <tr>
            <th>{name}<br>({party})</th>
            <th><input name="firstPreference" placeholder="Votes" type="number" /></th>
            <th><input name="BoeleTCP" placeholder="Votes" type="number" /></th>
            <th><input name="LiberalTCP" placeholder="Votes" type="number" /></th>
        </tr>'''

htmlCode += '''
        <tr>
            <th>Informal</th>
            <th><input id="formalVotes" name="firstPreference" placeholder="Votes" type="number" /></th>
        </tr>
        <tr>
            <th><br></th>
        </tr>
        <tr>
            <th>Total Formal</th>
            <th><input id="totalFormal" placeholder="Votes" type="number" /></th>
            <th><input id="totalBoeleTCP" placeholder="Votes" type="number" /></th>
            <th><input id="totalLiberalTCP" placeholder="Votes" type="number" /></th>
        </tr>
        <tr>
            <th>Total</th>
            <th><input id="fullTotal" placeholder="Votes" type="number" /></th>
        </tr>
    </tbody>
</table>'''

print(htmlCode)
