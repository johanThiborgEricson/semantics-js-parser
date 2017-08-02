function JavaScriptParser(global) {
  this.global = global;
}

(function() {
  var f = new InterpreterMethodFactory();
  var j = {};
  JavaScriptParser.prototype = j;
  
  j.variableStatement = f.nonTerminalSequence(/var /, "identifier", 
  "initializer", /;/, 
  function(identifier, initializer) {
    this.global[identifier] = initializer;
  });
  
  j.identifier = f.terminal(/([a-z])/, function(match) {
    return match;
  });
  
  j.numericLiteral = f.terminal(/([0-9])/, function(match) {
    return Number(match);
  });
  
  j.initializer = f.nonTerminalSequence(/=/, "numericLiteral", 
  function(numericLiteral) {
    return numericLiteral;
  });
  
})();
