#!/usr/bin/env python3

# Given .csv file with information for all polling places, prints relevant information
# for Bradfield polling places

import sys
import subprocess

if len(sys.argv) < 2:
    print(f'Usage: {sys.argv[0]} <file.csv>')
    sys.exit(1)

# assumes file format: [x], [x], [x], polling place id, [x], polling place name, premises name, premises address
csv_file = sys.argv[1]
command = f"cat {csv_file} | grep '108,Bradfield' | cut -d',' -f4,6,7,8"
candidateData = subprocess.run(command, shell = True, executable="/bin/dash")

# output format: polling place id, polling place name, premises name, premises address