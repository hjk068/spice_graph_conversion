//Quantum SPICE 
//Converts circuit information to capacitance & inductance graph

var circCompList = []

//arbitrary class for each components in the quantum circuit
class circComp {

    name = "a";
    type = "a";
    terminals = [];
    value = "a";
    connections = {};

    constructor(name, type, terminals, value, connections) {
        //name (string) -> e.g. C1, I2
        this.name = name;
        //type (string) => e.g. capacitor, inductor
        this.type = type;
        // terminal (string tuple) => e.g. (C1_1, C1_2)
        this.terminals = terminals;
        // value (string) => e.g. 4F, 15H
        this.value = value;
        // connection (dictionary w string key and string list value) 
        // e.g. {C1_1: [C2_1, I1_2], C1_2: []}
        // stores list of connections between 
        // this.terminals (key) & other terminals (values)
        // no connection is shown by []
        this.connections = connections;
        // add circComp instance to circCompList
        circCompList.push(this);
    }


    // convert connection dict to only store connection with terminals 
    // that are from same type of comps as this
    // e.g. connection between capacitors / connection between inductors
    get getSameTypeConnections() {
        var result = {};
        for (var terminal in this.connections) {
            result[terminal] = []
            var connections = this.connections[terminal]
            // connected_t -> terminal (string)
            for (let i = 0; i < connections.length; i++) {
                var connected_t = connections[i]
                var connected_comp = getCompFromTerminal(connected_t)
                // check if the current terminal and the terminal connected to it
                // are from components of the same type
                if (connected_comp.type == this.type) {
                    result[terminal].push(connected_t)
                }
                // if not, call findSameTypeTerminal() to find 
                // connected terminals of same type
                else {
                    // sameTypeT -> list of terminals that are connected
                    let sameTypeT = findSameTypeTerminal(connected_t, this.type, [])
                    result[terminal].push((sameTypeT))
                }
            }
        }
                
        return result
    }
}

// clear circuit
function clearCircCompList() {
    for (let i = 0; i < circCompList.length; i++) {
        delete circCompList[i]
    }
    circCompList = []
}


// return the circComp that has the input terminal
function getCompFromTerminal(terminal) {
    for (let i = 0; i < circCompList.length; i++) {
        var comp = circCompList[i]
        //console.log("comp name: "+ comp.name + ", " + comp.terminals[0] + ", " + comp.terminals[1])
        if (comp.terminals[0] == terminal || comp.terminals[1] == terminal)
            return comp;
    }
    console.log("exception: " + terminal)
    throw "terminal doesn't exist, perhaps you have a wrong test case?";
}

// return the value of the comp that 
// the terminal is in
function getValFromTerminal(terminal) {
    var comp = getCompFromTerminal(terminal)
    return comp.value
}

// return list of other terminals that are connected to a terminal
function getConnectedTerminals(terminal) {
    var comp = getCompFromTerminal(terminal)
    if (terminal in comp.connections) {
        return comp.connections[terminal]
    } else {
        throw "terminal doesn't exist in comp";
    }
}

// return list of other terminals in the same component
function getOtherTermSameComp(terminal) {
    var otherTerms = []
    var comp = getCompFromTerminal(terminal)
    for (let i = 0; i < comp.terminals.length; i++) {
        let t = comp.terminals[i]
        if (t != terminal) {
            otherTerms.push(t)
        }
    }
    return otherTerms
}

// return list of terminals connected by other terminals in the same comp
function getOtherConTerminals(terminal) {
    var result = []
    var otherTerms = getOtherTermSameComp(terminal)
    for (let i = 0; i < otherTerms.length; i++) {
        let t = otherTerms[i]
        //console.log("getOtherConTerminals t: " + t)
        result.push(getConnectedTerminals(t))
    }
    return result
}

// recursively go though connected terminals to find
// the terminal that is from the comp of same type
// return the list of connected same type terminals
function findSameTypeTerminal(terminal, type, loopedT) {
    var result = []
    var otherTs = getOtherConTerminals(terminal)
    //console.log("otherTs: " + otherTs.length + ", loopedT: " + loopedT.length)
    // base case 1) if reached endpoint, return []
    // base case 2) if looping through same terminal, return []
    if ((otherTs  == [] )|| (loopedT.includes(terminal))) {
        //console.log("return blank")
        return []
    }
    loopedT.push(terminal)
    for (let i = 0; i < otherTs.length; i++) {
        let t = otherTs[i]
        //console.log("otherTs t: " + t)
        ////console.log("t: " + t)
        // if the connected terminal is from comp of same type
        if (getCompFromTerminal(t).type == type) {
            ////console.log("same!: " + circComp.getCompFromTerminal(t).name)
            //console.log("findSameType a: " + t)
            result.push(t)
        }
        // if connected terminal is not of same type,
        // do recursion
        else {
            //console.log("findSameType b: " + findSameTypeTerminal(t, type, loopedT)) 
            result.push(findSameTypeTerminal(t, type, loopedT))
        }
    }
    return result
}

function arrHas(L, entry) {
    for (let i = 0; i < L.length; i++) {
        if (L[i] == entry) {
            return true
        }
    }
    return false
}

// remove redundant connections from a connection dictionary
function removeRedundantCon(conDict) {
    var removedCons = []
    for (const terminal in conDict) {
        for (let i = 0; i < conDict[terminal].length; i++) {
            var con = conDict[terminal][i]
            //console.log("terminal: " + terminal + ", con: " + con + ", " + conDict[con])
            //console.log("con: " + con)
            if (arrHas(conDict[con], terminal)) {
                //console.log("con included: " + con)
                let ind = conDict[con].indexOf(terminal)
                conDict[con].splice(ind, 1)
                //console.log("splice: " + terminal)

                // to prevent confusing the deleted connection 
                // with endpoints
                if (conDict[con].length == 0) {
                    //console.log("removedCons added: " + con)
                    removedCons.push(con)
                }
            }
        }
    }
    for (let i = 0; i < removedCons.length; i++) {
        var removedCon = removedCons[i]
        delete conDict[removedCon]
        //console.log(removedCon + " removed?: " + !(removedCon in conDict))
    }
}

// return connection dictionary of certain type
function getConnectionDict(type) {
    var connectionDict = {};
    for (let i = 0; i < circCompList.length; i++) {
        var comp = circCompList[i]
        if (comp.type == type) {
            //console.log("same type: " + comp.type)
            var newDict = comp.getSameTypeConnections
            for (var key in newDict) {
                connectionDict[key] = newDict[key]
                //console.log("dict: " + key + ", val: " + newDict[key])
            }
            
        }
    }
    // remove redundant connection
    removeRedundantCon(connectionDict)
    return connectionDict
}

// return list of lists [key, value] in dict
function dictToList(dict) {
    var result = []
    for (const elem in dict) {
        result.push([elem, dict[elem]])
    }
    return result
}

// return the index of the node that the terminal is contained in
function getNodeInd(term, conL) {
    for (let i = 0; i < conL.length; i++) {
        var tup = conL[i]
        if (tup[0] == term) {
            return i
        }
        else {
            for (let j = 0; j < tup[1].length; j++) {
                if (tup[1][j] == term) {
                    return i
                }
            }
        }
    }
    return -1
}

// extract integer index from string nodename
function getIndFromName(node) {
    return parseInt(node.slice(2, node.length))
}

// check if a terminal is in the connection dictionary
// as either key or value
function checkInConDict(t, dict) {
    if (t in dict) {
        return true
    }
    for (const terms in dict) {
        for (let i = 0; i < dict[terms].length; i++) {
            let cons = dict[terms][i]
            if (t == cons) {
                return true
            }
        }
    }
    return false    
}   
    
// convert connection dictionary to graph with edges and nodes
function convertToGraph(conDict, type) {
    var graph = {};
    var nodeName = "N"
    if (type == "capacitor") {
        nodeName += "C"
    } else {
        nodeName += "I"
    }
    var nodeCount = 0;
    var termNames = dictToList(conDict);

    // if there's only one component in circuit
    if (circCompList.length == 1) {
        for (const term in conDict) {
            var val = getValFromTerminal(term)
        }
        let entryName = nodeName + "1"
        graph[nodeName + "0"] = {entryName : val}
    }
    
    // if there are multiple components, 
    // loop through connection dictionary
    for (const term in conDict) {
        var termNodeName = nodeName + nodeCount.toString()
        var valDict = {}
        if (conDict[term] != []) {
        
            // get list of other terminals in same comp
            sameCompOtherT = getOtherTermSameComp(term);
            // find endpoint, add to node list
            for (const otherT in sameCompOtherT) {
                if ((otherT in conDict) && (conDict[otherT] == [])) {
                    var otherNode = nodeName + getNodeInd(otherT, termNames).toString()
                    valDict[otherNode] = getValFromTerminal(otherT)
                }
            }
            
            // loop through connected terminals to 'term'
            for (let i = 0; i < conDict[term].length; i++) {
                var conT = conDict[term][i]
                var otherConTs = getOtherTermSameComp(conT)
                // get list of other terminals in same comp for the connected terminal
                for (let j = 0; j < otherConTs.length; j++) {
                    var otherT = otherConTs[j]
                    //console.log(term + ", conT: " + conT + " otherT: " + otherT)
                    // if that terminal is in conDict
                    // it is a node, so add that to dictionary

                    //fix thisss 
                    if (checkInConDict(otherT, conDict)) {
                        //console.log("otherT in dict: " + otherT)
                        otherNode = nodeName + getNodeInd(otherT, termNames).toString() 

                        // check if the connection is already in the graph (if cyclic)
                        if (otherNode in graph && termNodeName in graph[otherNode]) {
                           var nodeInd = getIndFromName(otherNode)
                           var cyclicT = termNames[nodeInd][0]
                           // append to already existing node, 
                           // the connection to its other terminals in the same component
                           for (otherCT in getOtherTermSameComp(cyclicT)) {
                               var indC = getNodeInd(otherCT, termNames)
                               if (indC != -1) {
                                    var cyclicN = nodeName + indC.toString()
                                    var cyclicV = getValFromTerminal(cyclicT)
                                    if (!(cyclicN in graph[otherNode])) {
                                        graph[otherNode][cyclicN] = cyclicV
                                    }
                                    // edge case: where two compomenets are connected to 
                                    // only each other in cycle
                                    else {
                                        valDict[otherNode] = getValFromTerminal(cyclicT)
                                    }
                               }
                            }


                        // if connection not in graph, add it 
                        }
                        else {
                            valDict[otherNode] = getValFromTerminal(otherT)
                        }
                    }
                    // more cases for cyclic circuit: 
                    else { 
                        throw (otherT + " not in conDict, sth's wrong")
                    }
                    //    for conConT in findSameTypeTerminal(otherT, type, []):
                    //        #console.log("conConT: " + conConT)
                    //        if (getCompFromTerminal(conConT) == getCompFromTerminal(term)):
                    //            otherNode = nodeName + str(getNodeInd(otherT, termNames))  
                    //            valDict[otherNode] = getValFromTerminal(otherT)
                }
            }
        }

        
        // if valDict not empty?
        if (Object.keys(valDict).length > 0) {
            graph[termNodeName] = valDict
        }
        nodeCount += 1   
        
    }        
    return graph
}


// template for graph
//  "NC0": {"NC1" : "15F", "NC2" : "10F"}


// test if above functions are working
function test() {

    //@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    //#                Test Case 1                 ##
    //@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

    // connected in a line
    // |-- C1 -- I1 -- C2 -- I2 -- C3 --|
    var C1 = new circComp("C1", "capacitor", ["C1_1", "C1_2"], "5F", {"C1_1": [], "C1_2": ["I1_1"]})
    var I1 = new circComp("I1", "inductor", ["I1_1", "I1_2"], "6H", {"I1_1": ["C1_2"], "I1_2": ["C2_1"]})
    var C2 = new circComp("C2", "capacitor", ["C2_1", "C2_2"], "10F", {"C2_1": ["I1_2"], "C2_2": ["I2_1"]}) 
    var I2 = new circComp("I2", "inductor", ["I2_1", "I2_2"], "3H", {"I2_1": ["C2_1"], "I2_2": ["C3_1"]})
    var C3 = new circComp("C3", "capacitor", ["C3_1", "C3_2"], "7F", {"C3_1": ["I2_1"], "C3_2": []}) 


    // console.log(findSameTypeTerminal("C1_1", "capacitor"))
    // console.log(circComp.getSameTypeConnections(C1))
    // console.log(circComp.getSameTypeConnections(C2))
    // console.log(circComp.getSameTypeConnections(I1))
    // console.log(circComp.getSameTypeConnections(I2))

    var capConDict = getConnectionDict("capacitor")
    //indConDict = getConnectionDict("inductor")
    //var testDict = {"a" : 1, "b" : 2}
    console.log("log test: ")
    console.log(circCompList)

    console.log("Test case 1:")
    console.log(capConDict)
    // console.log(indConDict)

    
    console.log(convertToGraph(capConDict, "capacitor"))
    //console.log(convertToGraph(indConDict, "inductor"))

    clearCircCompList()

    //@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    //#                Test Case 2                 ##
    //@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

    // C1 -- I1 -- C2 -- I2 -- C1 (connected in cycle)
    var C1 = new circComp("C1", "capacitor", ["C1_1", "C1_2"], "5F", {"C1_1": ["I2_2"], "C1_2": ["I1_1"]})
    var I1 = new circComp("I1", "inductor", ["I1_1", "I1_2"], "6H", {"I1_1": ["C1_2"], "I1_2": ["C2_1"]})
    var C2 = new circComp("C2", "capacitor", ["C2_1", "C2_2"], "10F", {"C2_1": ["I1_2"], "C2_2": ["I2_1"]}) 
    var I2 = new circComp("I2", "inductor", ["I2_1", "I2_2"], "3H", {"I2_1": ["C2_2"], "I2_2": ["C1_1"]})

    var capConDict = getConnectionDict("capacitor")
    // indConDict = getConnectionDict("inductor")

    console.log("Test case 2:")
    console.log(capConDict)
    // console.log(indConDict)

    
    console.log(convertToGraph(capConDict, "capacitor"))
    //console.log(convertToGraph(indConDict, "inductor"))

    clearCircCompList()

    //@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    //#                Test Case 3                 ##
    //@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

    // C1 -- C2 -- C3 -- C4 -- C1 (connected in cycle)
    var C1 = new circComp("C1", "capacitor", ["C1_1", "C1_2"], "5F", {"C1_1": ["C4_2"], "C1_2": ["C2_1"]})
    var C2 = new circComp("C2", "capacitor", ["C2_1", "C2_2"], "7F", {"C2_1": ["C1_2"], "C2_2": ["C3_1"]}) 
    var C3 = new circComp("C3", "capacitor", ["C3_1", "C3_2"], "9F", {"C3_1": ["C2_2"], "C3_2": ["C4_1"]}) 
    var C4 = new circComp("C4", "capacitor", ["C4_1", "C4_2"], "11F", {"C4_1": ["C3_2"], "C4_2": ["C1_1"]}) 

    var capConDict = getConnectionDict("capacitor")
    // indConDict = getConnectionDict("inductor")

    console.log("Test case 3:")
    console.log(capConDict)
    // console.log(indConDict)
    
    console.log(convertToGraph(capConDict, "capacitor"))
    //console.log(convertToGraph(indConDict, "inductor"))
    clearCircCompList()

    //@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    //#                Test Case 4                 ##
    //@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

    // C1 -- I1 -- C2 -- I2 -- C3 -- I3 -- C1 (connected in cycle) 
    var C1 = new circComp("C1", "capacitor", ["C1_1", "C1_2"], "5F", {"C1_1": ["I3_2"], "C1_2": ["I1_1"]})
    var I1 = new circComp("I1", "inductor", ["I1_1", "I1_2"], "7H", {"I1_1": ["C1_2"], "I1_2": ["C2_1"]}) 
    var C2 = new circComp("C2", "capacitor", ["C2_1", "C2_2"], "9F", {"C2_1": ["I1_2"], "C2_2": ["I2_1"]}) 
    var I2 = new circComp("I2", "inductor", ["I2_1", "I2_2"], "11H", {"I2_1": ["C2_2"], "I2_2": ["C3_1"]}) 
    var C3 = new circComp("C3", "capacitor", ["C3_1", "C3_2"], "13F", {"C3_1": ["I2_2"], "C3_2": ["I3_1"]})
    var I3 = new circComp("I3", "inductor", ["I3_1", "I3_2"], "15H", {"I3_1": ["C3_2"], "I3_2": ["C1_1"]}) 
    // three capacitors and three inductors in cycle
    
    var capConDict = getConnectionDict("capacitor")
    var indConDict = getConnectionDict("inductor")

    console.log("Test case 4:")
    console.log(capConDict)
    console.log(indConDict)

    
    console.log(convertToGraph(capConDict, "capacitor"))
    console.log(convertToGraph(indConDict, "inductor"))
    clearCircCompList()

    //@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    //#                Test Case 5                 ##
    //@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

    //  --C1 --- C2 --   (connected in two cycle) 
    // |      |      |
    // C6     C7     C3
    // |      |      |
    //  --C5-- --C4--

    var C1 = new circComp("C1", "capacitor", ["C1_1", "C1_2"], "5F", {"C1_1": ["C6_2"], "C1_2": ["C2_1", "C7_1"]})
    var C2 = new circComp("C2", "capacitor", ["C2_1", "C2_2"], "7F", {"C2_1": ["C1_2", "C7_1"], "C2_2": ["C3_1"]}) 
    var C3 = new circComp("C3", "capacitor", ["C3_1", "C3_2"], "9F", {"C3_1": ["C2_2"], "C3_2": ["C4_1"]}) 
    var C4 = new circComp("C4", "capacitor", ["C4_1", "C4_2"], "11F", {"C4_1": ["C3_2"], "C4_2": ["C5_1", "C7_2"]}) 
    var C5 = new circComp("C5", "capacitor", ["C5_1", "C5_2"], "13F", {"C5_1": ["C4_2", "C7_2"], "C5_2": ["C6_1"]}) 
    var C6 = new circComp("C6", "capacitor", ["C6_1", "C6_2"], "15F", {"C6_1": ["C5_2"], "C6_2": ["C1_1"]}) 
    var C7 = new circComp("C7", "capacitor", ["C7_1", "C7_2"], "17F", {"C7_1": ["C1_2", "C2_1"], "C7_2": ["C4_2", "C5_1"]}) 

    
    var capConDict = getConnectionDict("capacitor")
    var indConDict = getConnectionDict("inductor")

    console.log("Test case 5: conDict::")
    console.log(capConDict)
    console.log(indConDict)
    console.log("Test case 5: graph::")
    console.log(convertToGraph(capConDict, "capacitor"))
    console.log(convertToGraph(indConDict, "inductor"))
    clearCircCompList()
}

function __main__() {
    test()
}

test();