with open('pdb/wildtype_structure_prediction_af2.pdb','r') as f:
    lines = f.read().split('\n')
    atoms = ""
    for line in lines:
        element = line[76:78]
        if not (element in atoms):
            atoms += element
    print(atoms)