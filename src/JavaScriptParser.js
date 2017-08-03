function JavaScriptParser() {
  this.global = {};
}

(function() {
  var f = new InterpreterMethodFactory();
  var j = {};
  JavaScriptParser.prototype = j;
  
  j.program = f.nonTerminalAsterisk("statement", function(statements) {
    
  });
  
  j.statement = f.nonTerminalAlternative(
    "variableStatement", "expressionStatement");
  
  j.variableStatement = f.nonTerminalSequence(/var /, "identifier", 
  "initializerOpt", /;/, 
  function(identifier, initializer) {
    this.global[identifier] = initializer;
  });
  
  j.expressionStatement = f.nonTerminalSequence("identifier", "initializer", 
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
  
  j.initializerOpt = f.nonTerminalQuestionMark("initializer", undefined);
  
})();
