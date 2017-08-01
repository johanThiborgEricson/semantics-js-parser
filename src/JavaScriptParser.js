function JavaScriptParser(global) {
  this.global = global;
}

(function() {
  var f = new InterpreterMethodFactory();
  var j = {};
  JavaScriptParser.prototype = j;
  
  j.variableStatement = f.nonTerminalSequence("reservedWordVar", "identifier", 
  "initializer", "semicolon", 
  function(reservedWordVar, identifier, initializer) {
    this.global[identifier] = initializer;
  });
  
  j.reservedWordVar = f.terminal(/(var )/, function() {});
  
  j.semicolon = f.terminal(/(;)/, function() {});
  
  j.identifier = f.terminal(/([a-z])/, function(match) {
    return match;
  });
  
  j.numericLiteral = f.terminal(/([0-9])/, function(match) {
    return Number(match);
  });
  
  j.equalSign = f.terminal(/=/, function() {});
  
  j.initializer = f.nonTerminalSequence("equalSign", "numericLiteral", 
  function(equalSign, numericLiteral) {
    return numericLiteral;
  });
  
})();
