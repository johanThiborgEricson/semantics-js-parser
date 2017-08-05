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
    "variableStatement", "assignmentExpression");
  
  j.variableStatement = f.nonTerminalSequence(/var /, "identifier", 
  "initializerOpt", /;/, 
  function(identifier, initializer) {
    this.global[identifier] = initializer;
  });
  
  j.identifier = f.terminal(/([a-z])/, function(match) {
    return match;
  });
  
  j.numericLiteral = f.terminal(/([0-9])/, function(match) {
    return Number(match);
  });
  
  j.initializer = f.nonTerminalSequence(/=/, "assignmentExpression", 
  function(assignmentExpression) {
    return assignmentExpression;
  });
  
  j.assignmentExpression = f.nonTerminalAlternative("numericLiteral", 
  "functionExpression", "assignmentExpression1");
  
  j.assignmentExpression1 = f.nonTerminalSequence("identifier", /=/, 
  "assignmentExpression", function(identifier, assignmentExpression) {
    this.global[identifier] = assignmentExpression;
    return assignmentExpression;
  });
  
  j.functionExpression = f.nonTerminalSequence(/function/, 
  /\(/, /\)/, /\{/, "functionBody", /\}/, function(functionBody) {
    return functionBody;
  });
  
  j.functionBody = f.deferredExecution("program");
  
  j.initializerOpt = f.nonTerminalQuestionMark("initializer", undefined);
  
})();
