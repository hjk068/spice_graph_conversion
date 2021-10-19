# Quantum SPICE 
# Converts circuit information to capacitance & inductance graph

# arbitrary class for each components in the quantum circuit
class circComp(object):

    circCompList = []

    def __init__(self, name, type, terminals, value, connections):
        # name (string) -> e.g. C1, I2
        self.name = name
        # type (string) => e.g. capacitor, inductor
        self.type = type
        # terminal (string tuple) => e.g. (C1_1, C1_2)
        self.terminals = terminals
        # value (string) => e.g. 4F, 15H
        self.value = value
        # connection (dictionary w string key and string list value) 
        # e.g. {C1_1: [C2_1, I1_2], C1_2: []}
        # stores list of connections between 
        # self.terminals (key) & other terminals (values)
        # no connection is shown by []
        self.connections = connections
        # add circComp instance to circCompList
        circComp.circCompList.append(self)      

    def __del__(self):
        self.name = None
        self.type = None
        self.terminals = None
        self.value = None
        self.connections = None
        del self 

    # convert connection dict to only store connection with terminals 
    # that are from same type of comps as self
    # e.g. connection between capacitors / connection between inductors
    def getSameTypeConnections(self):
        result = dict()
        for terminal in self.connections:
            result[terminal] = []
            connections = self.connections[terminal]
            # connected_t -> terminal (string)
            for connected_t in connections:
                connected_comp = getCompFromTerminal(connected_t)
                # check if the current terminal and the terminal connected to it
                # are from components of the same type
                if (connected_comp.type == self.type):
                    result[terminal].append(connected_t)
                # if not, call findSameTypeTerminal() to find 
                # connected terminals of same type
                else:
                    # sameTypeT -> list of terminals that are connected
                    sameTypeT = findSameTypeTerminal(connected_t, self.type, [])
                    result[terminal] += (sameTypeT)
                
        return result
    
# clear circuit
def clearCircCompList():
    for comp in circComp.circCompList:
        circComp.__del__(comp)
    circComp.circCompList = []

# return the circComp that has the input terminal
def getCompFromTerminal(terminal):
    for comp in circComp.circCompList:
        if terminal in comp.terminals:
            return comp
    raise Exception("terminal doesn't exist")

# return the value of the comp that 
# the terminal is in
def getValFromTerminal(terminal):
    comp = getCompFromTerminal(terminal)
    return comp.value

# return list of other terminals that are connected to a terminal
def getConnectedTerminals(terminal):
    comp = getCompFromTerminal(terminal)
    if (terminal in comp.connections):
        return comp.connections[terminal]
    else:
        raise Exception("terminal doesn't exist in comp")

# return list of other terminals in the same component
def getOtherTermSameComp(terminal):
    otherTerms = []
    comp = getCompFromTerminal(terminal)
    for t in comp.terminals:
        if (t != terminal):
            otherTerms.append(t)
    return otherTerms

# return list of terminals connected by other terminals in the same comp
def getOtherConTerminals(terminal):
    result = []
    otherTerms = getOtherTermSameComp(terminal)
    for t in otherTerms:
        result += getConnectedTerminals(t)
    return result

# recursively go though connected terminals to find
# the terminal that is from the comp of same type
# return the list of connected same type terminals
def findSameTypeTerminal(terminal, type, loopedT):
    result = []
    otherTs = getOtherConTerminals(terminal)
    # base case 1) if reached endpoint, return []
    # base case 2) if looping through same terminal, return []
    if (not otherTs or (terminal in loopedT)):
        return []
    loopedT.append(terminal)
    for t in otherTs:
        ##print("t: " + t)
        # if the connected terminal is from comp of same type
        if (getCompFromTerminal(t).type == type):
            ##print("same!: " + circComp.getCompFromTerminal(t).name)
            result.append(t)
        # if connected terminal is not of same type,
        # do recursion
        else:
            result += findSameTypeTerminal(t, type, loopedT)
    return result

# remove redundant connections from a connection dictionary
def removeRedundantCon(conDict):
    removedCons = []
    for terminal in conDict:
        for con in conDict[terminal]:
            if (terminal in conDict[con]):
                conDict[con].remove(terminal)
                # to prevent confusing the deleted connection 
                # with endpoints
                if (conDict[con] == []):
                    removedCons.append(con)
    for removedCon in removedCons:
        del conDict[removedCon]

# return connection dictionary of certain type
def getConnectionDict(type):
    connectionDict = dict()
    for comp in circComp.circCompList:
        if (comp.type == type):
            connectionDict.update(circComp.getSameTypeConnections(comp))
    # remove redundant connection
    removeRedundantCon(connectionDict)
    return connectionDict

# return list of elems in dict
def dictToArray(dict):
    result = []
    for elem in dict:
        result.append(elem)
    return result

# check if a terminal is in the connection dictionary
# as either key or value
def checkInConDict(t, dict):
    if (t in dict):
        return True
    for terms in dict:
        for cons in dict[terms]:
            if (t == cons):
                return True
    return False        

    
# convert connection dictionary to graph with edges and nodes
def convertToGraph(conDict, type):
    graph = dict()
    nodeName = "N" + ("C" if type == "capacitor" else "I")
    nodeCount = 0
    termNames = dictToArray(conDict)

    # if there's only one component in circuit
    if (len(circComp.circCompList) == 1):
        for term in conDict:
            val = getValFromTerminal(term)
        graph[nodeName + "0"] = {nodeName + "1" : val}

    # if there are multiple components, 
    # loop through connection dictionary
    for term in conDict:
        # print("term: " + term)
        valDict = dict()
        if (conDict[term] != []):
            # get list of other terminals in same comp
            sameCompOtherT = getOtherTermSameComp(term);
            # endpoint
            for otherT in sameCompOtherT:
                if (otherT in conDict) and (conDict[otherT] == []):  
                    otherNode = nodeName + str(termNames.index(otherT)) 
                    valDict[otherNode] = getValFromTerminal(otherT)
            
            for conT in conDict[term]:
                otherConTs = getOtherTermSameComp(conT)
                # get list of other terminals in same comp for the connected terminal
                for otherT in otherConTs:
                    print(term + ", conT: " + conT + " otherT: " + otherT)
                    # if that terminal is in conDict
                    # it is a node, so add that to dictionary
                    if (otherT in conDict):
                        print("otherT in dict: " + otherT)
                        otherNode = nodeName + str(termNames.index(otherT))  
                        valDict[otherNode] = getValFromTerminal(otherT)
                    # more cases for cyclic circuit: 
                    else:
                        for conConT in findSameTypeTerminal(otherT, type, []):
                            print("conConT: " + conConT)
                            if (getCompFromTerminal(conConT) == getCompFromTerminal(term)):
                                otherNode = nodeName + str(termNames.index(term))  
                                valDict[otherNode] = getValFromTerminal(otherT)

        termNodeName = nodeName + str(nodeCount)
        if (bool(valDict)):
            graph[termNodeName] = valDict
        nodeCount += 1           
    return graph

   # template for graph
   #  "NC0": {"NC1" : "15F", "NC2" : "10F"}


# test if above functions are working
def test():
    # connected in a line
    # |-- C1 -- I1 -- C2 -- I2 --|
    C1 = circComp("C1", "capacitor", ("C1_1", "C1_2"), "5F", {"C1_1": [], "C1_2": ["I1_1"]})
    I1 = circComp("I1", "inductor", ("I1_1", "I1_2"), "6H", {"I1_1": ["C1_2"], "I1_2": ["C2_1"]})
    C2 = circComp("C2", "capacitor", ("C2_1", "C2_2"), "10F", {"C2_1": ["I1_2"], "C2_2": ["I2_1"]}) 
    I2 = circComp("I2", "inductor", ("I2_1", "I2_2"), "3H", {"I2_1": ["C2_1"], "I2_2": ["C3_1"]})
    C3 = circComp("C3", "capacitor", ("C3_1", "C3_2"), "7F", {"C3_1": ["I2_1"], "C3_2": []}) 

    # # print(findSameTypeTerminal("C1_1", "capacitor"))
    # # print(circComp.getSameTypeConnections(C1))
    # # print(circComp.getSameTypeConnections(C2))
    # # print(circComp.getSameTypeConnections(I1))
    # # print(circComp.getSameTypeConnections(I2))

    capConDict = getConnectionDict("capacitor")
    # indConDict = getConnectionDict("inductor")

    # print(capConDict)
    # print(indConDict)

    print(convertToGraph(capConDict, "capacitor"))
    # print(convertToGraph(indConDict, "inductor"))

    clearCircCompList()

    # C1 -- I1 -- C2 -- I2 -- C1 (connected in cycle)
    C1 = circComp("C1", "capacitor", ("C1_1", "C1_2"), "5F", {"C1_1": ["I2_2"], "C1_2": ["I1_1"]})
    I1 = circComp("I1", "inductor", ("I1_1", "I1_2"), "6H", {"I1_1": ["C1_2"], "I1_2": ["C2_1"]})
    C2 = circComp("C2", "capacitor", ("C2_1", "C2_2"), "10F", {"C2_1": ["I1_2"], "C2_2": ["I2_1"]}) 
    I2 = circComp("I2", "inductor", ("I2_1", "I2_2"), "3H", {"I2_1": ["C2_2"], "I2_2": ["C1_1"]})

    capConDict = getConnectionDict("capacitor")
    # indConDict = getConnectionDict("inductor")

    print(capConDict)
    # print(indConDict)

    print(convertToGraph(capConDict, "capacitor"))
    # print(convertToGraph(indConDict, "inductor"))


def __main__():
    test()

test()