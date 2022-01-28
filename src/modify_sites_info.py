# read raw sites info from file ./raw_sites.info and output 
# modified sites info to ./sites.info

if __name__ == '__main__':
    info = dict()
    with open("raw_sites.info", "r") as fin:
        for line in fin.readlines():
            line = line.split()
            if len(line) == 3: continue # skip tip information
            info[line[0]] = '"T":{},"N":{},"W":{}'.format(line[1], line[2], line[3])
    with open("sites.info", "w") as fout:
        fout.write(str(info)) 